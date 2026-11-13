/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalDataStore } from './dataStore';
import {
  processCaregiverMessage,
  generateOrganicCheckIn,
  generateDynamicProgressReport
} from './geminiService';
import { analyzeParentSentiment } from './sentimentAnalyzer';
import { handleWhatsAppIncomingWebhook, DEFAULT_VERIFY_TOKEN, sendOutboundWhatsAppMessage } from './whatsappWebhook';
import { VERIFIED_EDUCATIONAL_MATERIALS } from './knowledgeBase';
import { VERIFIED_THERAPISTS, findTherapists } from './therapistDirectory';
import { ChatMessage, ChildProfile, TherapistAppointment } from '../types';

export interface RouteHandlerResult {
  status: number;
  headers?: Record<string, string>;
  body: any;
}

export async function handleApiRequest(
  method: string,
  pathname: string,
  query: URLSearchParams,
  bodyData: any
): Promise<RouteHandlerResult> {
  // CORS & Health
  if (pathname === '/api/health' && method === 'GET') {
    return {
      status: 200,
      body: {
        status: 'online',
        service: 'Kinda Care AI - WhatsApp Companion Backend',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        whatsAppConfigured: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        verifyToken: DEFAULT_VERIFY_TOKEN,
        webhookUrl: '/api/webhook/whatsapp',
        activeChildrenCount: globalDataStore.getAllChildren().length
      }
    };
  }

  // 1. WhatsApp Webhook Verification (GET /api/webhook/whatsapp)
  if (pathname === '/api/webhook/whatsapp' && method === 'GET') {
    const mode = query.get('hub.mode');
    const token = query.get('hub.verify_token');
    const challenge = query.get('hub.challenge');

    const expectedToken = process.env.WHATSAPP_VERIFY_TOKEN || DEFAULT_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === expectedToken) {
      return {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
        body: challenge || 'CHALLENGE_ACCEPTED'
      };
    }
    return {
      status: 403,
      body: { error: 'Verification failed. Hub token mismatch.' }
    };
  }

  // 2. WhatsApp Inbound Webhook (POST /api/webhook/whatsapp)
  if (pathname === '/api/webhook/whatsapp' && method === 'POST') {
    const result = await handleWhatsAppIncomingWebhook(bodyData);
    return {
      status: 200,
      body: result
    };
  }

  // 3. Chat / Interactive Simulator (POST /api/chat)
  if (pathname === '/api/chat' && method === 'POST') {
    const { childId, message, replyToId } = bodyData || {};
    if (!childId || !message) {
      return { status: 400, body: { error: 'childId and message required' } };
    }

    const now = new Date();
    const parentMsg: ChatMessage = {
      id: 'msg_p_' + Date.now(),
      childId,
      sender: 'parent',
      text: message,
      timestamp: now.toISOString(),
      timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      replyToId,
      status: 'read'
    };
    globalDataStore.addMessage(parentMsg);

    const { replyMessage, fiveBrainAnalysis } = await processCaregiverMessage(childId, message, parentMsg.id);

    return {
      status: 200,
      body: {
        success: true,
        parentMessage: parentMsg,
        replyMessage,
        sentimentAnalysis: fiveBrainAnalysis.conversationBrain.sentimentAnalysis,
        fiveBrainAnalysis
      }
    };
  }

  // 3b. Standalone Sentiment Analysis Endpoint (POST /api/sentiment/analyze)
  if (pathname === '/api/sentiment/analyze' && method === 'POST') {
    const { message, childId } = bodyData || {};
    if (!message || typeof message !== 'string') {
      return { status: 400, body: { error: 'message string is required' } };
    }
    const recentSnippet = childId
      ? globalDataStore
          .getMessages(childId)
          .slice(-4)
          .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
          .join('\n')
      : undefined;

    const sentimentAnalysis = await analyzeParentSentiment(message, recentSnippet);
    return {
      status: 200,
      body: {
        success: true,
        sentimentAnalysis
      }
    };
  }

  // 4. Children Profiles
  if (pathname === '/api/children' && method === 'GET') {
    return { status: 200, body: { children: globalDataStore.getAllChildren() } };
  }

  if (pathname.startsWith('/api/children/') && method === 'GET') {
    const id = pathname.replace('/api/children/', '');
    const child = globalDataStore.getChild(id);
    if (!child) return { status: 404, body: { error: 'Child not found' } };
    return { status: 200, body: { child } };
  }

  if (pathname === '/api/children' && method === 'POST') {
    const child = bodyData as ChildProfile;
    if (!child.id) child.id = 'child_' + Date.now();
    const saved = globalDataStore.saveChild(child);
    return { status: 200, body: { success: true, child: saved } };
  }

  // 5. Messages
  if (pathname.startsWith('/api/messages/') && method === 'GET') {
    const childId = pathname.replace('/api/messages/', '');
    const messages = globalDataStore.getMessages(childId);
    return { status: 200, body: { messages } };
  }

  // 6. Observations & Feedback
  if (pathname.startsWith('/api/observations/') && method === 'GET') {
    const childId = pathname.replace('/api/observations/', '');
    const observations = globalDataStore.getObservations(childId);
    return { status: 200, body: { observations } };
  }

  if (pathname === '/api/observations' && method === 'POST') {
    const obs = bodyData;
    if (!obs.id) obs.id = 'obs_' + Date.now();
    if (!obs.timestamp) obs.timestamp = new Date().toISOString();
    globalDataStore.addObservation(obs);
    return { status: 200, body: { success: true, observation: obs } };
  }

  // 7. Therapists & Appointments
  if (pathname === '/api/therapists' && method === 'GET') {
    const location = query.get('location') || undefined;
    const specialty = query.get('specialty') || undefined;
    const therapists = findTherapists({ location, specialty });
    return { status: 200, body: { therapists } };
  }

  if (pathname === '/api/appointments' && method === 'GET') {
    const childId = query.get('childId') || undefined;
    const appointments = globalDataStore.getAppointments(childId);
    return { status: 200, body: { appointments } };
  }

  if (pathname === '/api/appointments' && method === 'POST') {
    const appt = bodyData as TherapistAppointment;
    if (!appt.id) appt.id = 'apt_' + Date.now();
    globalDataStore.addAppointment(appt);
    return { status: 200, body: { success: true, appointment: appt } };
  }

  // 8. RAG Educational Materials
  if (pathname === '/api/materials' && method === 'GET') {
    return { status: 200, body: { materials: VERIFIED_EDUCATIONAL_MATERIALS } };
  }

  // 9. Progress Report Generation (Kinda Care & Specialist Side Only)
  if (pathname === '/api/report/generate' && method === 'POST') {
    const { childId } = bodyData || {};
    const report = await generateDynamicProgressReport(childId || 'child_joash');
    if (!report) return { status: 404, body: { error: 'Child not found for report generation' } };
    return { status: 200, body: { success: true, report } };
  }

  // 9b. Share Progress Report directly with a Specialist
  if (pathname === '/api/report/share' && method === 'POST') {
    const { childId, therapistId, therapistName, handoffNote } = bodyData || {};
    if (!childId || !therapistId || !therapistName) {
      return { status: 400, body: { error: 'childId, therapistId, and therapistName are required' } };
    }
    const shares = globalDataStore.shareReportWithSpecialist(childId, therapistId, therapistName, handoffNote);
    return { status: 200, body: { success: true, sharedWithSpecialists: shares } };
  }

  // 10. Organic / Silence-Based Companion Check-In Trigger
  if (pathname === '/api/nudge/trigger' && method === 'POST') {
    const { childId, nudgeType } = bodyData || {};
    const targetChildId = childId || 'child_joash';
    const child = globalDataStore.getChild(targetChildId);
    if (!child) return { status: 404, body: { error: 'Child not found' } };

    const resolvedType =
      nudgeType === 'quiet_parent_checkin' ? 'quiet_parent_checkin' : 'organic_random_checkin';
    const botMsg = await generateOrganicCheckIn(targetChildId, resolvedType);
    await sendOutboundWhatsAppMessage(child.caregiverPhone, botMsg.text);

    return { status: 200, body: { success: true, nudge: botMsg } };
  }

  // 11. M-Pesa STK Push Simulator & Daraja Webhook
  if (pathname === '/api/daraja/stkpush' && method === 'POST') {
    const { childId, phone, amount } = bodyData || {};
    const child = globalDataStore.getChild(childId || 'child_joash');
    if (child) {
      child.subscriptionTier = 'premium';
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      child.subscriptionExpiry = expiry.toISOString().slice(0, 10);
      child.mpesaPhone = phone || child.caregiverPhone;
      globalDataStore.saveChild(child);

      // Send confirmation message
      const now = new Date();
      const confirmMsg: ChatMessage = {
        id: 'msg_mpesa_' + Date.now(),
        childId: child.id,
        sender: 'kinda_care',
        text: `Asante kwa malipo ya KSh ${amount || 300}, ${child.caregiverName}! 🇰🇪\n\nYour Kinda Care Premium subscription is now ACTIVE until ${child.subscriptionExpiry}. You have unlocked adaptive activity generation, therapist priority scheduling, and full developmental progress tracking!`,
        timestamp: now.toISOString(),
        timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        status: 'delivered'
      };
      globalDataStore.addMessage(confirmMsg);
    }
    return {
      status: 200,
      body: {
        ResponseCode: '0',
        ResponseDescription: 'Success. Request accepted for processing',
        CustomerMessage: 'Success. STK Push sent to customer.',
        CheckoutRequestID: 'ws_CO_' + Date.now()
      }
    };
  }

  // 12. ODPC Data Protection Consent
  if (pathname === '/api/consent' && method === 'POST') {
    const { childId, granted } = bodyData || {};
    const child = globalDataStore.getChild(childId);
    if (!child) return { status: 404, body: { error: 'Child not found' } };
    child.odpcConsent = {
      granted: !!granted,
      grantedAt: new Date().toISOString(),
      parentConfirmedIdentity: true
    };
    globalDataStore.saveChild(child);
    return { status: 200, body: { success: true, consent: child.odpcConsent } };
  }

  return { status: 404, body: { error: `Endpoint ${pathname} not found` } };
}
