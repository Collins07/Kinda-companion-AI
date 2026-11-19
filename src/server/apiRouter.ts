/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalDataStore, CONSENT_VERSION, CONSENT_SCOPE } from './dataStore';
import {
  processCaregiverMessage,
  handleMediaAttachmentAttempt,
  generateOrganicCheckIn,
  generateDynamicProgressReport
} from './geminiService';
import { analyzeParentSentiment } from './sentimentAnalyzer';
import { handleWhatsAppIncomingWebhook, DEFAULT_VERIFY_TOKEN, sendOutboundWhatsAppMessage } from './whatsappWebhook';
import { VERIFIED_EDUCATIONAL_MATERIALS } from './knowledgeBase';
import { VERIFIED_THERAPISTS, findTherapists } from './therapistDirectory';
import { getAdminRoutingPhone, getNextCalendarDateForDay } from './metaCompliance';
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
  if (pathname === '/api/health' && method === 'GET') {
    return {
      status: 200,
      body: {
        status: 'online',
        service: 'Kinda Care - WhatsApp Companion Backend',
        timestamp: new Date().toISOString(),
        geminiConfigured: !!process.env.GEMINI_API_KEY,
        whatsAppConfigured: !!(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID),
        adminRoutingPhone: getAdminRoutingPhone(),
        verifyToken: DEFAULT_VERIFY_TOKEN,
        webhookUrl: '/api/webhook/whatsapp',
        activeChildrenCount: globalDataStore.getAllChildren().length
      }
    };
  }

  // 1. WhatsApp Webhook Verification (GET)
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
    return { status: 403, body: { error: 'Verification failed. Hub token mismatch.' } };
  }

  // 2. WhatsApp Inbound Webhook (POST)
  if (pathname === '/api/webhook/whatsapp' && method === 'POST') {
    const result = await handleWhatsAppIncomingWebhook(bodyData);
    return { status: 200, body: result };
  }

  // 3. Chat / Interactive Simulator (POST /api/chat)
  if (pathname === '/api/chat' && method === 'POST') {
    const { childId, message, replyToId, mediaType } = bodyData || {};
    if (!childId) {
      return { status: 400, body: { error: 'childId required' } };
    }

    const now = new Date();
    const timeDisplay = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

    // Media / Document upload attempt -> reject warmly, do NOT call Gemini or log observation
    if (mediaType && ['image', 'audio', 'video', 'document'].includes(mediaType)) {
      const parentMsg: ChatMessage = {
        id: 'msg_p_media_' + Date.now(),
        childId,
        sender: 'parent',
        text: `[Attempted to upload ${mediaType}]`,
        mediaType,
        timestamp: now.toISOString(),
        timeDisplay,
        replyToId,
        status: 'read'
      };
      globalDataStore.addMessage(parentMsg);

      const { replyMessage, fiveBrainAnalysis } = await handleMediaAttachmentAttempt(childId, mediaType, parentMsg.id);
      return {
        status: 200,
        body: {
          success: true,
          parentMessage: parentMsg,
          replyMessage,
          fiveBrainAnalysis
        }
      };
    }

    if (typeof message !== 'string' || !message.trim()) {
      return { status: 400, body: { error: 'Non-empty message string required' } };
    }

    const cleanMessage = message.trim();
    const parentMsg: ChatMessage = {
      id: 'msg_p_' + Date.now(),
      childId,
      sender: 'parent',
      text: cleanMessage,
      timestamp: now.toISOString(),
      timeDisplay,
      replyToId,
      status: 'read'
    };
    globalDataStore.addMessage(parentMsg);

    const { replyMessage, fiveBrainAnalysis } = await processCaregiverMessage(
      childId,
      cleanMessage,
      parentMsg.id,
      async (resolvedChild, delayedMsg) => {
        await sendOutboundWhatsAppMessage(resolvedChild.caregiverPhone, delayedMsg.text);
      }
    );

    if (fiveBrainAnalysis.escalationBrain.adminAlertTriggered) {
      const child = globalDataStore.getChild(childId);
      if (child) {
        await sendOutboundWhatsAppMessage(
          getAdminRoutingPhone(),
          `[KINDA CARE ADMIN ROUTING]\nParent: ${child.caregiverName} (${child.caregiverPhone})\nChild: ${child.name}\nReason: ${
            fiveBrainAnalysis.escalationBrain.adminAlertReason || 'Follow-up required'
          }\nMessage: "${cleanMessage}"`
        );
      }
    }

    return {
      status: 200,
      body: {
        success: true,
        parentMessage: parentMsg,
        replyMessage,
        sentimentAnalysis: fiveBrainAnalysis.conversationBrain.sentimentAnalysis,
        domainScopeStatus: fiveBrainAnalysis.conversationBrain.domainScopeStatus,
        fiveBrainAnalysis
      }
    };
  }

  // 3b. Standalone Sentiment Analysis Endpoint
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
    return { status: 200, body: { success: true, sentimentAnalysis } };
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
    const result = globalDataStore.addObservation(obs);
    return { status: 200, body: { success: true, added: result.added, observation: result.observation } };
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
    if (appt.date && /next\s+/i.test(appt.date)) {
      appt.date = getNextCalendarDateForDay(appt.date);
    }
    if (!appt.date || !appt.date.trim()) {
      appt.date = 'To be chosen by therapist';
    }
    if (!appt.time || !appt.time.trim()) {
      appt.time = 'To be chosen by therapist';
    }
    appt.status = 'requested_awaiting_confirmation';
    appt.statusLabel = 'Requested, awaiting therapist confirmation';
    const { appointment: saved, created } = globalDataStore.addAppointment(appt);

    if (created) {
      const child = globalDataStore.getChild(appt.childId);
      globalDataStore.addAdminAlert({
        childId: appt.childId,
        childName: appt.childName || child?.name || 'Child',
        caregiverName: appt.caregiverName || child?.caregiverName || 'Caregiver',
        caregiverPhone: appt.caregiverPhone || child?.caregiverPhone || '',
        reason: `Consultation request with ${appt.therapistName} (therapist to choose available time)`,
        urgency: 'booking_confirmation',
        messageSummary: appt.sessionTopic
      });

      await sendOutboundWhatsAppMessage(
        getAdminRoutingPhone(),
        `[BOOKING REQUEST] ${appt.caregiverName} requested ${appt.therapistName}. Please ask the therapist to choose an available date and time.`
      );
    }

    return { status: 200, body: { success: true, created, appointment: saved } };
  }

  // 7b. Admin / Therapist Chooses Date & Time and Confirms Appointment
  if (pathname === '/api/appointments/confirm' && method === 'POST') {
    const { appointmentId, confirmedDate, confirmedTime } = bodyData || {};
    if (!appointmentId) {
      return { status: 400, body: { error: 'appointmentId required' } };
    }
    const cleanDate = typeof confirmedDate === 'string' ? confirmedDate.trim() : '';
    const cleanTime = typeof confirmedTime === 'string' ? confirmedTime.trim() : '';
    if (
      !cleanDate ||
      !cleanTime ||
      /to be chosen/i.test(cleanDate) ||
      /to be chosen/i.test(cleanTime)
    ) {
      return {
        status: 400,
        body: { error: 'Please choose a specific available date and time before confirming.' }
      };
    }

    const updated = globalDataStore.confirmAppointment(appointmentId, cleanDate, cleanTime);
    if (!updated) {
      return { status: 404, body: { error: 'Appointment not found' } };
    }

    const now = new Date();
    const confirmText = `Good news, ${updated.caregiverName}! Your virtual consultation for ${updated.childName} with ${updated.therapistName} is now CONFIRMED for ${updated.date} at ${updated.time}.`;
    const confirmMsg: ChatMessage = {
      id: 'msg_apt_conf_' + Date.now(),
      childId: updated.childId,
      sender: 'kinda_care',
      text: confirmText,
      timestamp: now.toISOString(),
      timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      status: 'delivered'
    };
    globalDataStore.addMessage(confirmMsg);
    await sendOutboundWhatsAppMessage(updated.caregiverPhone, confirmText);

    return { status: 200, body: { success: true, appointment: updated, notificationMessage: confirmMsg } };
  }

  // 7d. Reset a child's live session (messages, observations, milestones, bookings)
  if (pathname === '/api/reset' && method === 'POST') {
    const { childId } = bodyData || {};
    if (!childId) {
      return { status: 400, body: { error: 'childId required' } };
    }
    const resetChild = globalDataStore.resetChildSession(childId);
    if (!resetChild) {
      return { status: 404, body: { error: 'Child not found' } };
    }
    return { status: 200, body: { success: true, child: resetChild } };
  }

  // 7c. Admin Escalation & Routing Feed
  if (pathname === '/api/admin/alerts' && method === 'GET') {
    const childId = query.get('childId') || undefined;
    return {
      status: 200,
      body: {
        adminRoutingPhone: getAdminRoutingPhone(),
        alerts: globalDataStore.getAdminAlerts(childId)
      }
    };
  }

  // 8. RAG Educational Materials
  if (pathname === '/api/materials' && method === 'GET') {
    return { status: 200, body: { materials: VERIFIED_EDUCATIONAL_MATERIALS } };
  }

  // 9. Progress Report Generation (Internal / Specialist Side Only)
  if (pathname === '/api/report/generate' && method === 'POST') {
    const { childId } = bodyData || {};
    const report = await generateDynamicProgressReport(childId || 'child_nancy');
    if (!report) return { status: 404, body: { error: 'Child not found for report generation' } };
    return { status: 200, body: { success: true, report } };
  }

  // 9b. Share Progress Report with Specialist
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
    const targetChildId = childId || 'child_nancy';
    const child = globalDataStore.getChild(targetChildId);
    if (!child) return { status: 404, body: { error: 'Child not found' } };

    if (!child.odpcConsent?.granted) {
      return {
        status: 400,
        body: {
          success: false,
          error: `${child.caregiverName} has not granted data consent yet. Ask them to confirm consent in chat first.`
        }
      };
    }

    if (child.nudgesOptedOut) {
      return {
        status: 400,
        body: {
          success: false,
          optedOut: true,
          error: `${child.caregiverName} paused proactive check-ins.`
        }
      };
    }

    const resolvedType =
      nudgeType === 'quiet_parent_checkin' ? 'quiet_parent_checkin' : 'organic_random_checkin';
    const botMsg = await generateOrganicCheckIn(targetChildId, resolvedType);
    await sendOutboundWhatsAppMessage(child.caregiverPhone, botMsg.text);

    return { status: 200, body: { success: true, nudge: botMsg } };
  }

  // 11. M-Pesa STK Push Simulator
  if (pathname === '/api/daraja/stkpush' && method === 'POST') {
    const { childId, phone, amount } = bodyData || {};
    const child = globalDataStore.getChild(childId || 'child_nancy');
    if (child) {
      child.subscriptionTier = 'premium';
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 30);
      child.subscriptionExpiry = expiry.toISOString().slice(0, 10);
      child.mpesaPhone = phone || child.caregiverPhone;
      globalDataStore.saveChild(child);

      const confirmMsg: ChatMessage = {
        id: 'msg_mpesa_' + Date.now(),
        childId: child.id,
        sender: 'kinda_care',
        text: `Asante kwa malipo ya KSh ${amount || 300}, ${child.caregiverName}! Your Kinda Care Premium subscription is active until ${child.subscriptionExpiry}.`,
        timestamp: nowTime(),
        timeDisplay: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
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
      grantedAt: granted ? new Date().toISOString() : undefined,
      parentConfirmedIdentity: !!granted,
      consentVersion: CONSENT_VERSION,
      consentScope: CONSENT_SCOPE
    };
    globalDataStore.saveChild(child);
    return { status: 200, body: { success: true, consent: child.odpcConsent } };
  }

  return { status: 404, body: { error: `Endpoint ${pathname} not found` } };
}

function nowTime(): string {
  return new Date().toISOString();
}
