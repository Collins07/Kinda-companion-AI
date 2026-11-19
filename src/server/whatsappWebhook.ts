/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { globalDataStore } from './dataStore';
import { processCaregiverMessage, handleMediaAttachmentAttempt } from './geminiService';
import { enforceMetaComplianceOnOutput, getAdminRoutingPhone } from './metaCompliance';
import { ChatMessage } from '../types';

export const DEFAULT_VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'kinda_care_webhook_secret_2026';

// Deduplicate retried Meta WhatsApp webhook deliveries by wamid
const processedMessageIds = new Set<string>();
function markMessageProcessed(messageId: string): boolean {
  if (!messageId) return true;
  if (processedMessageIds.has(messageId)) return false;
  processedMessageIds.add(messageId);
  if (processedMessageIds.size > 1000) {
    const oldest = processedMessageIds.values().next().value;
    if (oldest) processedMessageIds.delete(oldest);
  }
  return true;
}

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
  const { compliantText } = enforceMetaComplianceOnOutput(text, { stripInternalTagsForWhatsApp: true });

  if (!token || !phoneNumberId) {
    console.log(`[WhatsApp Outbound Dev] To: ${toPhone} | Message: ${compliantText.slice(0, 90)}...`);
    return true;
  }

  try {
    const url = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: toPhone.replace(/[^0-9]/g, ''),
        type: 'text',
        text: { preview_url: false, body: compliantText }
      }),
      signal: AbortSignal.timeout(10000)
    });

    const resData = await response.json();
    if (!response.ok) {
      console.error('[WhatsApp Cloud API Error]', resData);
      return false;
    }
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

  if (!payload || payload.object !== 'whatsapp_business_account' || !Array.isArray(payload.entry)) {
    return { success: false, repliesGenerated: 0, details: ['Ignored non-whatsapp event'] };
  }

  for (const entry of payload.entry) {
    for (const change of entry.changes || []) {
      const messages = change.value?.messages;
      if (!messages || messages.length === 0) continue;

      for (const msg of messages) {
        if (msg.id && !markMessageProcessed(msg.id)) {
          details.push(`Skipped duplicate webhook message ${msg.id}`);
          continue;
        }

        const from = msg.from;
        let child = globalDataStore.getChildByPhone(from);
        if (!child) {
          child = globalDataStore.getChild('child_nancy') || globalDataStore.getAllChildren()[0];
        }

        const now = new Date();
        const mediaTypes = ['image', 'audio', 'voice', 'video', 'document', 'sticker'];
        if (mediaTypes.includes(msg.type)) {
          const mappedType: 'image' | 'audio' | 'video' | 'document' =
            msg.type === 'audio' || msg.type === 'voice'
              ? 'audio'
              : msg.type === 'video'
              ? 'video'
              : msg.type === 'document'
              ? 'document'
              : 'image';

          const parentMsg: ChatMessage = {
            id: msg.id || 'msg_media_in_' + Date.now(),
            childId: child.id,
            sender: 'parent',
            text: `[Attempted to send ${mappedType} attachment]`,
            mediaType: mappedType,
            timestamp: now.toISOString(),
            timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            status: 'read'
          };
          globalDataStore.addMessage(parentMsg);

          const { replyMessage } = await handleMediaAttachmentAttempt(child.id, mappedType, parentMsg.id);
          await sendOutboundWhatsAppMessage(child.caregiverPhone || from, replyMessage.text);
          repliesCount++;
          details.push(`Rejected unsupported media (${msg.type}) from ${from} for ${child.name}.`);
          continue;
        }

        let incomingText = msg.text?.body || '';
        if (msg.interactive?.button_reply) {
          incomingText = msg.interactive.button_reply.title;
        } else if (msg.interactive?.list_reply) {
          incomingText = msg.interactive.list_reply.title;
        }

        if (!incomingText.trim()) continue;

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

        const { replyMessage, fiveBrainAnalysis } = await processCaregiverMessage(
          child.id,
          incomingText,
          parentMsg.id,
          async (resolvedChild, delayedMsg) => {
            await sendOutboundWhatsAppMessage(resolvedChild.caregiverPhone || from, delayedMsg.text);
          }
        );
        repliesCount++;

        await sendOutboundWhatsAppMessage(child.caregiverPhone || from, replyMessage.text);

        // Route ALL admin-needed messages to separate Admin WhatsApp contact
        if (fiveBrainAnalysis.escalationBrain.adminAlertTriggered) {
          const adminPhone = getAdminRoutingPhone();
          await sendOutboundWhatsAppMessage(
            adminPhone,
            `[KINDA CARE ADMIN ROUTING]\nUrgency: ${
              fiveBrainAnalysis.escalationBrain.urgentRedFlagTriggered ? 'URGENT RED FLAG' : 'Admin Action Required'
            }\nParent: ${child.caregiverName} (${child.caregiverPhone})\nChild: ${child.name}\nReason: ${
              fiveBrainAnalysis.escalationBrain.adminAlertReason || 'Follow-up required'
            }\nCaregiver message: "${incomingText}"`
          );
        }

        details.push(`Processed message from ${from} for ${child.name}.`);
      }
    }
  }

  return { success: true, repliesGenerated: repliesCount, details };
}
