/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalDataStore } from './dataStore';
import { processCaregiverMessage } from './geminiService';
import { ChatMessage } from '../types';

export const DEFAULT_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kinda_care_webhook_secret_2026';

export interface WhatsAppWebhookEvent {
  object: string;
  entry?: Array<{
    id: string;
    changes?: Array<{
      value?: {
        messaging_product: string;
        metadata?: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          type: string;
          text?: { body: string };
          interactive?: {
            type: string;
            button_reply?: { id: string; title: string };
            list_reply?: { id: string; title: string; description?: string };
          };
        }>;
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

export async function sendOutboundWhatsAppMessage(toPhone: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Outbound Mock/Dev] To: ${toPhone} | Message: ${text.slice(0, 80)}...`);
    return true;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { preview_url: false, body: text }
      })
    });

    const resData = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp Cloud API Error]', resData);
      return false;
    }
    console.log('[WhatsApp Cloud API Success]', resData);
    return true;
  } catch (err) {
    console.error('[WhatsApp Cloud API Network Error]', err);
    return false;
  }
}

export async function handleWhatsAppIncomingWebhook(payload: WhatsAppWebhookEvent): Promise<{
  success: boolean;
  repliesGenerated: number;
  details: string[];
}> {
  const details: string[] = [];
  let repliesCount = 0;

  if (payload.object !== 'whatsapp_business_account' || !payload.entry) {
    return { success: false, repliesGenerated: 0, details: ['Ignored non-whatsapp event'] };
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages;
      if (!messages || messages.length === 0) continue;

      for (const msg of messages) {
        const from = msg.from;
        let incomingText = msg.text?.body || '';

        if (msg.interactive?.button_reply) {
          incomingText = msg.interactive.button_reply.title;
        } else if (msg.interactive?.list_reply) {
          incomingText = msg.interactive.list_reply.title;
        }

        if (!incomingText.trim()) continue;

        // Find child profile by sender phone
        let child = globalDataStore.getChildByPhone(from);
        if (!child) {
          // Default to Joash or create new child
          child = globalDataStore.getChild('child_joash') || globalDataStore.getAllChildren()[0];
        }

        const now = new Date();
        const parentMsg: ChatMessage = {
          id: msg.id || 'msg_parent_' + Date.now(),
          childId: child.id,
          sender: 'parent',
          text: incomingText,
          timestamp: now.toISOString(),
          timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          status: 'read'
        };

        globalDataStore.addMessage(parentMsg);

        // Process message through 5-brain engine
        const { replyMessage, fiveBrainAnalysis } = await processCaregiverMessage(child.id, incomingText, parentMsg.id);
        repliesCount++;

        // Send via WhatsApp Cloud API
        await sendOutboundWhatsAppMessage(child.caregiverPhone || from, replyMessage.text);

        // If admin alert triggered, simulate SMS/WhatsApp to admin
        if (fiveBrainAnalysis.escalationBrain.adminAlertTriggered && process.env.ADMIN_ALERT_PHONE) {
          await sendOutboundWhatsAppMessage(
            process.env.ADMIN_ALERT_PHONE,
            `⚠️ [ALERT_ADMIN] Kinda Care Escalation Alert!\nParent: ${child.caregiverName} (${from})\nChild: ${child.name}\nMessage: "${incomingText}"`
          );
        }

        details.push(`Processed message from ${from} for child ${child.name}. Reply sent.`);
      }
    }
  }

  return { success: true, repliesGenerated: repliesCount, details };
}
