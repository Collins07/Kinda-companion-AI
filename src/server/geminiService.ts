/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import {
  ChildProfile,
  ChatMessage,
  ObservationFeedback,
  FiveBrainAnalysis,
  TherapistAppointment,
  ProgressReport,
  ProfileUpdateProposal,
  DetectedMilestoneRecord
} from '../types';
import { globalDataStore, CONSENT_VERSION, CONSENT_SCOPE } from './dataStore';
import { searchRAGMaterials, VERIFIED_EDUCATIONAL_MATERIALS } from './knowledgeBase';
import { VERIFIED_THERAPISTS } from './therapistDirectory';
import { analyzeParentSentiment } from './sentimentAnalyzer';
import {
  META_WHATSAPP_POLICY_PROMPT_BLOCK,
  checkDomainAndOptOutGuardrail,
  buildPoliteOutOfScopeReply,
  enforceMetaComplianceOnOutput,
  detectUrgentRedFlag,
  getNextCalendarDateForDay,
  getAdminRoutingPhone,
  formatShortDateEAT,
  resolveReportedDate
} from './metaCompliance';
import {
  scanCaregiverMessageForMilestones,
  isImportantChildObservationText,
  inferDomainFromText
} from './milestoneScanner';

function getAiClient(): GoogleGenAI {
  return new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-4-hydrogen';
const REQUEST_TIMEOUT_MS = 25000;
const RETRY_DELAYS_MS = [1000, 3000, 9000];

const completedRetryMessageIds = new Set<string>();
const activeQueuedMessageIds = new Set<string>();

function detectLanguageQuick(text: string): 'english' | 'swahili' | 'sheng_blended' {
  const lower = text.toLowerCase();
  if (
    /\b(habari|mambo|sawa|asante|nimechoka|tumechoka|mtoto|leo|kesho|jana|juzi|bado|huyo|nyumbani|pole|ndio|nakubali|peke yake|bila msaada|mwenyewe|mara ya kwanza|hatimaye|ameweza)\b/i.test(
      lower
    )
  ) {
    const hasEnglish = /\b(the|and|with|today|yesterday|for|is|are|she|he|we|let|can|you|how|what|please|puzzle|cups|red)\b/i.test(
      lower
    );
    if (
      hasEnglish ||
      /\b(maze|buda|msee|poa|fiti|riz|hizo|alizipangua|uko aje|niaje|sasa)\b/i.test(lower)
    ) {
      return hasEnglish ? 'sheng_blended' : 'swahili';
    }
    return 'swahili';
  }
  return 'english';
}

function isSimpleGreetingOrNoise(text: string): boolean {
  const cleaned = text.trim().toLowerCase().replace(/[!?.🙏😊💙👋❤️]+/g, '').trim();
  const noiseSet = new Set([
    'hi',
    'hello',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'morning',
    'evening',
    'habari',
    'mambo',
    'sasa',
    'niaje',
    'vipi',
    'ok',
    'okay',
    'sawa',
    'asante',
    'thanks',
    'thank you',
    'poa',
    'bye',
    'kwaheri'
  ]);
  return cleaned.length <= 24 && noiseSet.has(cleaned);
}

function isConsentConfirmationText(text: string): boolean {
  const cleaned = text.trim().toLowerCase();
  return /^(yes|yeah|yep|i consent|consent|i agree|agree|agreed|nakubali|nimekubali|ndio|ndiyo|sawa nakubali|yes i consent|yes i agree)\b/i.test(
    cleaned
  );
}

function isAskingWhatsNext(text: string): boolean {
  return /\b(what'?s next|what next|next activity|another activity|something else|nini sasa|tucheze nini|ingine|what should we do)\b/i.test(
    text
  );
}

function isSkippingPrevious(text: string): boolean {
  return /\b(skip|just give me|another one please|let'?s move on|already tried|didn'?t do it|forget that one|tuachane na hiyo)\b/i.test(
    text
  );
}

function buildHoldingMessage(caregiverName: string, lang: 'english' | 'swahili' | 'sheng_blended'): string {
  if (lang === 'swahili') {
    return `Samahani ${caregiverName}, ujumbe wako umefika salama! Ninachukua sekunde chache kuandaa jibu zuri litakalowasaidia—nitakutumia jibu kamili hapa hapa punde tu.`;
  }
  if (lang === 'sheng_blended') {
    return `Sawa ${caregiverName}, nimepata message yako! Nipe muda mfupi niandae jibu poa la kukusaidia na nitalituma hapa hapa mara moja.`;
  }
  return `Thank you for your message, ${caregiverName}. I've received it safely and I'm taking just a moment to put together a thoughtful response—I'll send it right here shortly.`;
}

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function generateWithTimeout(ai: GoogleGenAI, model: string, params: any, timeoutMs = REQUEST_TIMEOUT_MS) {
  return Promise.race([
    ai.models.generateContent({
      model,
      ...params
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Request timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

async function callGeminiWithRetry(params: any): Promise<string> {
  const ai = getAiClient();
  let lastErr: any;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    const modelToUse = attempt < 2 ? PRIMARY_MODEL : FALLBACK_MODEL;
    try {
      const res = await generateWithTimeout(ai, modelToUse, params, REQUEST_TIMEOUT_MS);
      if (res.text) return res.text;
      throw new Error('Empty model response');
    } catch (err: any) {
      lastErr = err;
      const msg = String(err?.message || err);
      const isRetryable = /503|429|timeout|timed out|unavailable|overloaded|resource_exhausted|empty model/i.test(
        msg
      );
      if (!isRetryable || attempt === RETRY_DELAYS_MS.length) {
        break;
      }
      const jitter = Math.floor(Math.random() * 450);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAYS_MS[attempt] + jitter));
    }
  }
  throw lastErr || new Error('Service temporarily busy');
}

function buildChildContextBlock(
  child: ChildProfile,
  observations: ObservationFeedback[],
  appointments: TherapistAppointment[],
  milestones: DetectedMilestoneRecord[],
  queryText: string,
  extraRagHints = ''
) {
  const ragMaterials = searchRAGMaterials(
    `${queryText} ${extraRagHints} ${child.sensitivities.join(' ')} ${child.strengths.join(' ')}`,
    child.ageMonths
  );

  const pendingProtocolBlock =
    child.lastSuggestedProtocol && child.lastSuggestedProtocol.status === 'pending_feedback'
      ? `Pending Previous Activity Awaiting Feedback: "${child.lastSuggestedProtocol.title}" (Card ID: ${child.lastSuggestedProtocol.cardId}, Domain: ${child.lastSuggestedProtocol.domain}, Suggested at: ${child.lastSuggestedProtocol.suggestedAt}).
PROTOCOL CONTINUITY RULE: If the parent asks "what's next?" or asks for a new activity WITHOUT sharing how this previous activity went, gently ask how "${child.lastSuggestedProtocol.title}" went first (noting kindly that retrying or finishing a step builds familiarity). If they report it succeeded, treat it as BOTH a milestone AND an intervention outcome. If they explicitly want to skip or switch now, respect their choice smoothly.`
      : 'No pending prior activity awaiting feedback.';

  const pendingAppts = appointments.filter(a => a.status === 'requested_awaiting_confirmation');
  const existingApptsBlock =
    pendingAppts.length > 0
      ? pendingAppts
          .map(
            a =>
              `- ALREADY PENDING: ${a.therapistName} (Status: ${a.statusLabel || 'Requested, awaiting therapist confirmation'}, Date: ${a.date}, Time: ${a.time}). DO NOT create a duplicate booking request!`
          )
          .join('\n')
      : 'No pending specialist booking requests on file yet.';

  const eatTodayIso = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });

  return {
    ragMaterials,
    contextBlock: `
=== CHILD PROFILE (CONFIDENTIAL TO THIS FAMILY ONLY) ===
Today's Date (Kenya EAT): ${eatTodayIso} (${formatShortDateEAT(eatTodayIso)})
Name: ${child.name}
Caregiver: ${child.caregiverName}
Age: ${Math.floor(child.ageMonths / 12)} years ${child.ageMonths % 12 > 0 ? (child.ageMonths % 12) + ' months' : ''}
Developmental Stage: ${child.developmentalStage}
Sensory Triggers / Stimuli: ${child.sensitivities.length > 0 ? child.sensitivities.join(', ') : 'None documented yet'}
Home Environment: ${child.environmentContext || 'Family home in Kenya'}
Available Household & Local Resources: ${
      child.availableResources && child.availableResources.length > 0
        ? child.availableResources.join(', ')
        : 'Everyday household items (cups, spoons, cloth, paper)'
    }
${pendingProtocolBlock}

=== LOGGED CAREGIVER OBSERVATIONS (LATEST) ===
${
  observations
    .slice(-10)
    .map(
      o =>
        `- [${o.reportedDateDisplay || formatShortDateEAT(o.reportedDate || o.timestamp)}] "${o.rawParentMessage}" -> ${o.insightSummary}`
    )
    .join('\n') || 'None logged yet.'
}

=== LOGGED MILESTONES ON FILE ===
${
  milestones
    .slice(-8)
    .map(m => `- [${m.reportedDateDisplay} | ${m.domain} | ${m.independence_level}] ${m.skillSummary}`)
    .join('\n') || 'None logged yet.'
}

=== EXISTING SPECIALIST BOOKING REQUESTS ===
${existingApptsBlock}

=== RETRIEVED VERIFIED RAG LIBRARY CARDS (STRICT SOURCE OF ACTIVITIES) ===
${
  ragMaterials.length > 0
    ? ragMaterials
        .slice(0, 3)
        .map(
          m =>
            `[CARD_ID: ${m.id}] ${m.title} (${m.sourceFramework || m.domain})\nDescription: ${m.description}\nSteps:\n${m.activities.join('\n')}\nCaregiver Guidance: ${m.caregiverGuidance}`
        )
        .join('\n\n')
    : 'NO_MATCHING_CARD_FOUND: Do NOT invent any clinical, WHO, UNICEF, or Kenya DCS protocol or unverified activities. Honestly inform the caregiver if no verified card matches their specific request yet.'
}

=== VERIFIED SPECIALIST DIRECTORY (FOR REQUESTING CONSULTATIONS) ===
${VERIFIED_THERAPISTS.map(t => `- ${t.name} (${t.specialty}, ${t.location}, KSh ${t.rateKSh}, Available: ${t.availableDays.join(', ')})`).join('\n')}
`
  };
}

function buildConversationTurns(history: ChatMessage[], currentMessage: string) {
  const recent = history.slice(-24);
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of recent) {
    if (msg.sender === 'parent' && msg.text === currentMessage && msg === recent[recent.length - 1]) {
      continue;
    }
    const role: 'user' | 'model' = msg.sender === 'parent' ? 'user' : 'model';
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${msg.text}`;
    } else {
      contents.push({ role, parts: [{ text: msg.text }] });
    }
  }

  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n${currentMessage}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: currentMessage }] });
  }

  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  return contents;
}

function enqueueBackgroundRetry(
  child: ChildProfile,
  incomingText: string,
  replyToMessageId: string,
  holdingMessageId: string,
  systemInstruction: string,
  conversationTurns: any[],
  sentimentResult: any,
  ragMaterials: any[],
  isCaregiverExhausted: boolean,
  onCompleted?: (child: ChildProfile, botMsg: ChatMessage, analysis: FiveBrainAnalysis) => Promise<void>
) {
  const dedupKey = `${child.id}:${replyToMessageId}`;
  if (completedRetryMessageIds.has(dedupKey) || activeQueuedMessageIds.has(dedupKey)) {
    return;
  }
  activeQueuedMessageIds.add(dedupKey);

  setTimeout(async () => {
    try {
      const rawJson = await callGeminiWithRetry({
        contents: conversationTurns,
        config: { systemInstruction }
      });

      let replyText = rawJson.trim();
      try {
        const parsed = JSON.parse(stripJsonFences(rawJson));
        if (parsed.replyMessageText) replyText = parsed.replyMessageText;
      } catch {
        // plain text
      }

      const compliance = enforceMetaComplianceOnOutput(replyText, {
        isCheckIn: false,
        activeChildName: child.name
      });

      const now = new Date();
      const analysis: FiveBrainAnalysis = {
        conversationBrain: {
          detectedIntent: 'Delayed response delivered from retry queue',
          caregiverTone: `${sentimentResult.sentiment}`,
          caregiverMode: isCaregiverExhausted ? 'caregiver_rest' : 'standard',
          culturalContext: detectLanguageQuick(incomingText),
          sentimentAnalysis: sentimentResult,
          domainScopeStatus: 'in_scope',
          isQueuedRetry: true
        },
        memoryBrain: {
          childId: child.id,
          childName: child.name,
          recalledMemories: child.sensitivities
        },
        recommendationBrain: {
          ragMaterialsRetrieved: ragMaterials.slice(0, 3).map(m => ({
            id: m.id,
            title: m.title,
            domain: m.domain,
            relevanceScore: 0.9
          })),
          recommendationSource: 'none'
        },
        engagementBrain: {
          nudgeType: 'responsive_dialogue'
        },
        escalationBrain: {
          therapistEscalationTriggered: false,
          adminAlertTriggered: false
        }
      };

      const delayedMsg: ChatMessage = {
        id: `msg_retry_${replyToMessageId}`,
        childId: child.id,
        sender: 'kinda_care',
        text: compliance.compliantText,
        timestamp: now.toISOString(),
        timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        replyToId: replyToMessageId,
        fiveBrainAnalysis: analysis,
        status: 'delivered'
      };

      // Replace holding message cleanly so message counts remain exact
      globalDataStore.replaceMessage(holdingMessageId, delayedMsg);
      completedRetryMessageIds.add(dedupKey);
      if (onCompleted) {
        await onCompleted(child, delayedMsg, analysis);
      }
    } catch (err) {
      console.error('[Background Retry Queue Failed]:', err instanceof Error ? err.message : err);
    } finally {
      activeQueuedMessageIds.delete(dedupKey);
    }
  }, 4000);
}

export async function handleMediaAttachmentAttempt(
  childId: string,
  mediaType: 'image' | 'audio' | 'video' | 'document',
  replyToMessageId?: string
): Promise<{ replyMessage: ChatMessage; fiveBrainAnalysis: FiveBrainAnalysis }> {
  const child = globalDataStore.getChild(childId);
  const caregiverName = child?.caregiverName || 'Caregiver';
  const childName = child?.name || 'your child';

  const mediaLabel =
    mediaType === 'document'
      ? 'documents or files'
      : mediaType === 'audio'
      ? 'voice notes'
      : mediaType === 'video'
      ? 'videos'
      : 'images or photos';

  const replyText = `Hi ${caregiverName}—this WhatsApp chat can only read typed text messages and cannot process ${mediaLabel} directly.\n\nIf it is very important and you need our team to look it up or review it with you, just reply "Please have your team follow up" and I will send a note straight to our care coordinator.`;

  const now = new Date();
  const analysis: FiveBrainAnalysis = {
    conversationBrain: {
      detectedIntent: `Unsupported media upload attempted (${mediaType})`,
      caregiverTone: 'Caregiver attempted attachment',
      caregiverMode: 'standard',
      culturalContext: 'english',
      domainScopeStatus: 'in_scope'
    },
    memoryBrain: {
      childId,
      childName,
      recalledMemories: []
    },
    recommendationBrain: {
      ragMaterialsRetrieved: [],
      recommendationSource: 'none'
    },
    engagementBrain: {
      nudgeType: 'responsive_dialogue'
    },
    escalationBrain: {
      therapistEscalationTriggered: false,
      adminAlertTriggered: false
    }
  };

  const replyMessage: ChatMessage = {
    id: 'msg_media_' + Date.now(),
    childId,
    sender: 'kinda_care',
    text: replyText,
    timestamp: now.toISOString(),
    timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    replyToId: replyToMessageId,
    fiveBrainAnalysis: analysis,
    status: 'delivered'
  };

  globalDataStore.addMessage(replyMessage);
  return { replyMessage, fiveBrainAnalysis: analysis };
}

export async function processCaregiverMessage(
  childId: string,
  incomingText: string,
  replyToMessageId?: string,
  onBackgroundRetrySuccess?: (child: ChildProfile, botMsg: ChatMessage, analysis: FiveBrainAnalysis) => Promise<void>
): Promise<{ replyMessage: ChatMessage; fiveBrainAnalysis: FiveBrainAnalysis }> {
  const child = globalDataStore.getChild(childId) || {
    id: childId,
    name: 'Your Child',
    caregiverName: 'Caregiver',
    caregiverPhone: '+254700000000',
    ageMonths: 48,
    gender: 'other',
    developmentalStage: 'Early Childhood',
    strengths: [],
    sensitivities: [],
    currentMilestones: [],
    favoriteActivities: [],
    subscriptionTier: 'free',
    odpcConsent: {
      granted: false,
      parentConfirmedIdentity: false,
      consentVersion: CONSENT_VERSION,
      consentScope: CONSENT_SCOPE
    },
    notes: ''
  };

  const now = new Date();
  const timeDisplay = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const msgLang = detectLanguageQuick(incomingText);
  const messageId = replyToMessageId || `msg_p_${Date.now()}`;

  // 0a. SELECTIVE URGENT RED-FLAG TRIAGE
  const redFlag = detectUrgentRedFlag(incomingText, child.name);
  if (redFlag.triggered) {
    const adminPhone = getAdminRoutingPhone();
    globalDataStore.addAdminAlert({
      childId: child.id,
      childName: child.name,
      caregiverName: child.caregiverName,
      caregiverPhone: child.caregiverPhone,
      reason: `Urgent Red Flag: ${redFlag.category}`,
      urgency: 'urgent_red_flag',
      messageSummary: incomingText
    });

    const urgentAnalysis: FiveBrainAnalysis = {
      conversationBrain: {
        detectedIntent: `Urgent Safety / Medical Red Flag (${redFlag.category})`,
        caregiverTone: 'Urgent distress',
        caregiverMode: 'comfort_first',
        culturalContext: msgLang,
        domainScopeStatus: 'in_scope'
      },
      memoryBrain: {
        childId: child.id,
        childName: child.name,
        recalledMemories: []
      },
      recommendationBrain: {
        ragMaterialsRetrieved: [],
        recommendationSource: 'none'
      },
      engagementBrain: {
        nudgeType: 'rest_break'
      },
      escalationBrain: {
        therapistEscalationTriggered: false,
        urgentRedFlagTriggered: true,
        adminAlertTriggered: true,
        adminAlertReason: `Urgent Red Flag: ${redFlag.category}`,
        routedAdminContact: adminPhone
      }
    };

    const replyMessage: ChatMessage = {
      id: 'msg_urgent_' + Date.now(),
      childId: child.id,
      sender: 'kinda_care',
      text: redFlag.guidance,
      timestamp: now.toISOString(),
      timeDisplay,
      replyToId: replyToMessageId,
      fiveBrainAnalysis: urgentAnalysis,
      status: 'delivered'
    };
    globalDataStore.addMessage(replyMessage);
    return { replyMessage, fiveBrainAnalysis: urgentAnalysis };
  }

  // 0b. Opt-Out & Domain Boundary Guardrail
  const preCheck = checkDomainAndOptOutGuardrail(incomingText);
  if (preCheck.isOptOut) {
    child.nudgesOptedOut = true;
    globalDataStore.saveChild(child);

    const optOutReply = `Understood, ${child.caregiverName}. I have paused proactive check-in messages right away. You can always message back anytime you need caregiver support for ${child.name}. Take care.`;
    const optOutAnalysis: FiveBrainAnalysis = {
      conversationBrain: {
        detectedIntent: 'Pause / Opt-Out Request',
        caregiverTone: 'Direct pause request',
        caregiverMode: 'standard',
        culturalContext: msgLang,
        domainScopeStatus: 'in_scope'
      },
      memoryBrain: { childId: child.id, childName: child.name, recalledMemories: [] },
      recommendationBrain: { ragMaterialsRetrieved: [], recommendationSource: 'none' },
      engagementBrain: { nudgeType: 'rest_break' },
      escalationBrain: { therapistEscalationTriggered: false, adminAlertTriggered: false }
    };
    const replyMessage: ChatMessage = {
      id: 'msg_opt_' + Date.now(),
      childId: child.id,
      sender: 'kinda_care',
      text: optOutReply,
      timestamp: now.toISOString(),
      timeDisplay,
      replyToId: replyToMessageId,
      fiveBrainAnalysis: optOutAnalysis,
      status: 'delivered'
    };
    globalDataStore.addMessage(replyMessage);
    return { replyMessage, fiveBrainAnalysis: optOutAnalysis };
  }

  if (preCheck.isClearlyOutOfScope) {
    const declineReply = buildPoliteOutOfScopeReply(
      child.caregiverName,
      child.name,
      incomingText,
      preCheck.outOfScopeCategory
    );
    const declineAnalysis: FiveBrainAnalysis = {
      conversationBrain: {
        detectedIntent: `Off-topic request declined (${preCheck.outOfScopeCategory})`,
        caregiverTone: 'Off-topic',
        caregiverMode: 'standard',
        culturalContext: msgLang,
        domainScopeStatus: 'out_of_scope_declined',
        outOfScopeReason: `Outside Kinda Care caregiver support purpose (${preCheck.outOfScopeCategory})`
      },
      memoryBrain: { childId: child.id, childName: child.name, recalledMemories: [] },
      recommendationBrain: { ragMaterialsRetrieved: [], recommendationSource: 'none' },
      engagementBrain: { nudgeType: 'responsive_dialogue' },
      escalationBrain: { therapistEscalationTriggered: false, adminAlertTriggered: false }
    };
    const replyMessage: ChatMessage = {
      id: 'msg_oos_' + Date.now(),
      childId: child.id,
      sender: 'kinda_care',
      text: declineReply,
      timestamp: now.toISOString(),
      timeDisplay,
      replyToId: replyToMessageId,
      fiveBrainAnalysis: declineAnalysis,
      status: 'delivered'
    };
    globalDataStore.addMessage(replyMessage);
    return { replyMessage, fiveBrainAnalysis: declineAnalysis };
  }

  // 0c. CONSENT FIRST GATE
  if (!child.odpcConsent?.granted) {
    if (isConsentConfirmationText(incomingText)) {
      child.odpcConsent = {
        granted: true,
        grantedAt: now.toISOString(),
        parentConfirmedIdentity: true,
        consentVersion: CONSENT_VERSION,
        consentScope: CONSENT_SCOPE
      };
      globalDataStore.saveChild(child);

      const consentConfirmedReply =
        msgLang === 'swahili'
          ? `Asante sana, ${child.caregiverName}! Ridhaa yako ya kuhifadhi kumbukumbu za michezo na maendeleo ya ${child.name} imehifadhiwa (${CONSENT_VERSION}). Unaweza kusitisha wakati wowote.\n\n${child.name} anaendeleaje leo, na wewe mwenyewe unajisikiaje?`
          : msgLang === 'sheng_blended'
          ? `Asante sana ${child.caregiverName}! Consent yako (${CONSENT_VERSION}) iko sawa sasa, na unaweza kusimamisha wakati wowote.\n\n${child.name} ako aje leo, na wewe mwenyewe unaendelea aje?`
          : `Thank you, ${child.caregiverName}. Your consent (${CONSENT_VERSION}) is now on file, and you can pause or withdraw it anytime.\n\nHow is ${child.name} doing today, and how are you holding up?`;

      const consentAnalysis: FiveBrainAnalysis = {
        conversationBrain: {
          detectedIntent: 'Caregiver Data Consent Granted',
          caregiverTone: 'Cooperative',
          caregiverMode: 'standard',
          culturalContext: msgLang,
          domainScopeStatus: 'in_scope'
        },
        memoryBrain: { childId: child.id, childName: child.name, recalledMemories: [] },
        recommendationBrain: { ragMaterialsRetrieved: [], recommendationSource: 'none' },
        engagementBrain: { nudgeType: 'responsive_dialogue' },
        escalationBrain: { therapistEscalationTriggered: false, adminAlertTriggered: false }
      };

      const replyMessage: ChatMessage = {
        id: 'msg_consent_' + Date.now(),
        childId: child.id,
        sender: 'kinda_care',
        text: consentConfirmedReply,
        timestamp: now.toISOString(),
        timeDisplay,
        replyToId: replyToMessageId,
        fiveBrainAnalysis: consentAnalysis,
        status: 'delivered'
      };
      globalDataStore.addMessage(replyMessage);
      return { replyMessage, fiveBrainAnalysis: consentAnalysis };
    }

    const askConsentReply =
      msgLang === 'swahili'
        ? `Karibu Kinda Care, ${child.caregiverName}. Mimi ni msaidizi wako wa malezi (sio daktari).\n\nKabla sijahifadhi taarifa au maendeleo yoyote kuhusu ${child.name}, naomba ridhaa yako ya kutumia kumbukumbu za mazungumzo yetu kupendekeza michezo ya nyumbani na kuandaa muhtasari kwa mtaalamu utakapohitaji (${CONSENT_VERSION}). Je, unakubali tuendelee? (Jibu "Ndiyo" au "Yes")`
        : `Welcome to Kinda Care, ${child.caregiverName}. I'm your caregiver-support companion (not a clinician).\n\nBefore I save any observations or updates about ${child.name}, please confirm you consent to our storing notes from this chat to tailor home play ideas and prepare specialist summaries when needed (${CONSENT_VERSION}). Reply "Yes, I consent" to begin.`;

    const askConsentAnalysis: FiveBrainAnalysis = {
      conversationBrain: {
        detectedIntent: 'Awaiting Caregiver Consent Before Data Logging',
        caregiverTone: 'Onboarding / Consent required',
        caregiverMode: 'standard',
        culturalContext: msgLang,
        domainScopeStatus: 'in_scope'
      },
      memoryBrain: { childId: child.id, childName: child.name, recalledMemories: [] },
      recommendationBrain: { ragMaterialsRetrieved: [], recommendationSource: 'none' },
      engagementBrain: { nudgeType: 'responsive_dialogue' },
      escalationBrain: { therapistEscalationTriggered: false, adminAlertTriggered: false }
    };

    const replyMessage: ChatMessage = {
      id: 'msg_ask_consent_' + Date.now(),
      childId: child.id,
      sender: 'kinda_care',
      text: askConsentReply,
      timestamp: now.toISOString(),
      timeDisplay,
      replyToId: replyToMessageId,
      fiveBrainAnalysis: askConsentAnalysis,
      status: 'delivered'
    };
    globalDataStore.addMessage(replyMessage);
    return { replyMessage, fiveBrainAnalysis: askConsentAnalysis };
  }

  // Explicit team follow-up requests
  const adminTriggerRegex =
    /\b(refund|money back|speak to (the )?owner|speak to (the )?manager|team follow\s*up|have your team|look it up)\b/i;
  if (adminTriggerRegex.test(incomingText)) {
    const adminPhone = getAdminRoutingPhone();
    globalDataStore.addAdminAlert({
      childId: child.id,
      childName: child.name,
      caregiverName: child.caregiverName,
      caregiverPhone: child.caregiverPhone,
      reason: 'Caregiver requested admin / human team follow-up',
      urgency: 'admin_action_required',
      messageSummary: incomingText
    });

    const teamReply = `Thank you, ${child.caregiverName}. I have forwarded your note directly to our Kinda Care coordinator (${adminPhone}) so a member of our team can follow up with you personally.`;
    const adminAnalysis: FiveBrainAnalysis = {
      conversationBrain: {
        detectedIntent: 'Human Team Follow-Up / Admin Request',
        caregiverTone: 'Direct request',
        caregiverMode: 'standard',
        culturalContext: msgLang,
        domainScopeStatus: 'in_scope'
      },
      memoryBrain: { childId: child.id, childName: child.name, recalledMemories: [] },
      recommendationBrain: { ragMaterialsRetrieved: [], recommendationSource: 'none' },
      engagementBrain: { nudgeType: 'responsive_dialogue' },
      escalationBrain: {
        therapistEscalationTriggered: false,
        adminAlertTriggered: true,
        adminAlertReason: 'Caregiver requested admin/team follow-up',
        routedAdminContact: adminPhone
      }
    };
    const replyMessage: ChatMessage = {
      id: 'msg_adm_' + Date.now(),
      childId: child.id,
      sender: 'kinda_care',
      text: teamReply,
      timestamp: now.toISOString(),
      timeDisplay,
      replyToId: replyToMessageId,
      fiveBrainAnalysis: adminAnalysis,
      status: 'delivered'
    };
    globalDataStore.addMessage(replyMessage);
    return { replyMessage, fiveBrainAnalysis: adminAnalysis };
  }

  // Step 1: Sentiment analysis, deterministic milestone pre-scan & RAG retrieval
  const allHistory = globalDataStore.getMessages(childId);
  const observations = globalDataStore.getObservations(childId);
  const appointments = globalDataStore.getAppointments(childId);
  const existingMilestones = globalDataStore.getMilestones(childId);
  const recentSnippet = allHistory
    .slice(-4)
    .map(m => `${m.sender.toUpperCase()}: ${m.text}`)
    .join('\n');

  const sentimentResult = await analyzeParentSentiment(incomingText, recentSnippet);

  const exhaustionRegex =
    /\b(i('?m| am) exhausted|i('?m| am) tired|so tired|am tired|burned out|hard day|too much for me|need a break|tumechoka|nimechoka)\b/i;
  const isCaregiverExhausted =
    exhaustionRegex.test(incomingText) ||
    sentimentResult.sentiment === 'exhausted' ||
    sentimentResult.sentiment === 'stressed_overwhelmed';

  const preScan = scanCaregiverMessageForMilestones({
    child,
    incomingText,
    messageId,
    referenceNow: now
  });
  const hasPreDetectedMilestone = preScan.milestones.length > 0;

  const derivedMode: FiveBrainAnalysis['conversationBrain']['caregiverMode'] =
    isCaregiverExhausted
      ? 'caregiver_rest'
      : hasPreDetectedMilestone || sentimentResult.sentiment === 'celebratory'
      ? 'celebration'
      : sentimentResult.sentiment === 'anxious_worried' || sentimentResult.sentiment === 'frustrated'
      ? 'comfort_first'
      : 'standard';

  const extraRagHints = isCaregiverExhausted
    ? 'unicef cfc burnout caregiver stress resilience rest'
    : child.lastSuggestedProtocol?.status === 'pending_feedback'
    ? child.lastSuggestedProtocol.domain
    : '';

  const { ragMaterials, contextBlock } = buildChildContextBlock(
    child,
    observations,
    appointments,
    existingMilestones,
    incomingText,
    extraRagHints
  );

  const askingNextWithoutSkip =
    child.lastSuggestedProtocol?.status === 'pending_feedback' &&
    isAskingWhatsNext(incomingText) &&
    !isSkippingPrevious(incomingText);

  if (child.lastSuggestedProtocol?.status === 'pending_feedback' && isSkippingPrevious(incomingText)) {
    child.lastSuggestedProtocol.status = 'skipped';
    globalDataStore.saveChild(child);
  }

  const conversationTurns = buildConversationTurns(allHistory, incomingText);

  const systemInstruction = `
You are Kinda Care, a caregiver-support companion on WhatsApp for ${child.caregiverName} (caring for ${child.name}). You are NOT a clinician.

${META_WHATSAPP_POLICY_PROMPT_BLOCK}

=== REAL-TIME SENTIMENT & TONE CALIBRATION ===
Sentiment: ${sentimentResult.sentiment.toUpperCase()} | Stress: ${sentimentResult.stressLevel.toUpperCase()}
Tone Directive: ${sentimentResult.toneDirective}
${
  hasPreDetectedMilestone
    ? 'DEVELOPMENTAL MILESTONE WIN DETECTED: Celebrate this win warmly and genuinely in the caregiver’s language FIRST before moving on! NEVER ask the parent to confirm the milestone.'
    : ''
}
${
  isCaregiverExhausted
    ? 'CAREGIVER EXHAUSTION PRIORITY: Caregiver wellness and rest come FIRST. Focus strictly on validating and offering the UNICEF CFC / Rest card BEFORE suggesting any child activity (and do NOT assign child tasks today).'
    : ''
}
${
  askingNextWithoutSkip
    ? `PREVIOUS PROTOCOL PENDING FEEDBACK: You previously suggested "${child.lastSuggestedProtocol?.title}". Because the caregiver just asked what is next, politely ask FIRST how that activity went (mentioning warmly that revisiting or completing a step helps build familiarity), while letting them know you can share another idea anytime if they prefer to switch.`
    : ''
}

=== CONVERSATIONAL & RAG GROUNDING RULES ===
1. REPLY CONCISELY TO WHAT WAS ACTUALLY ASKED: Match your length to the parent's message. Do not pad replies with unrelated tips. No markdown headers.
2. LANGUAGE MATCHING: Strictly reply in the parent's language (${
    msgLang === 'swahili' ? 'Kiswahili' : msgLang === 'sheng_blended' ? 'Kenyan Sheng/Swahili-English mix' : 'English'
  }).
3. STRICT RAG GROUNDING: Every activity you recommend MUST come directly from one of the RETRIEVED VERIFIED RAG LIBRARY CARDS in the context below (you may adapt materials to household items at home while keeping the exact card goal). If NO_MATCHING_CARD_FOUND or none fits what was asked, say so honestly instead of inventing unretrieved content!
4. AUTOMATIC ALL-DOMAIN MILESTONE & IMPORTANT OBSERVATION EXTRACTION:
   - Scan EVERY caregiver message for developmental milestones across ALL 6 domains: "cognitive" (puzzles, sorting, matching, sequencing), "motor" (grip, coordination, climbing, walking), "speech" (words, singing, gestures, picture exchange, requests), "sensory" (tolerating previously avoided colors/textures/sounds), "social" (turn-taking, joint attention, co-regulation), and "independence" (dressing, feeding, toileting).
   - NEVER require the word "milestone". Infer from developmental significance!
   - High-signal cues ("herself", "himself", "on her own", "without help", "alone", "seamlessly", "peke yake", "bila msaada", "mwenyewe", "first time", "mara ya kwanza", "finally", "managed to", "like a switch", "suddenly") -> set status="milestone", is_milestone=true, confidence >= 0.9.
   - Retrospective reports ("yesterday", "last week", "jana", etc.): set reported_date to the REPORTED YYYY-MM-DD date in EAT, not today's message timestamp.
   - If a specialist/companion-recommended activity succeeded, mark BOTH is_milestone=true AND is_intervention_outcome=true!
   - NEVER ask the caregiver to confirm a milestone! If a developmental note is genuinely ambiguous, set needs_review=true silently for the OT review queue and set needs_confirmation=false in conversation (do NOT interrogate the parent!).
   - Extract ONLY important child-associated observations/gains/triggers/routines. Ignore greetings ("hi", "habari", "thanks") and chitchat -> return [].
   - Copy "evidence_quote" VERBATIM from the parent's latest message.
5. SPECIALIST BOOKING GUARD (ONE REQUEST ONLY & THERAPIST CHOOSES TIME):
   - If you are ONLY ASKING permission to reach out (e.g., "Would you like me to reach out to Dr. Wanjiku?"), set "therapistEscalation": false! Wait for the caregiver to reply yes.
   - If EXISTING SPECIALIST BOOKING REQUESTS already shows an open pending request for that specialist, set "therapistEscalation": false and reassure the caregiver their single request is already waiting on the specialist to propose a time!
   - Set "therapistEscalation": true ONLY when creating the first/single active request after caregiver asks or approves connecting.
   - Do NOT invent or pre-choose a time! Leave "preferredBookingDay" and "preferredBookingTime" as empty strings "" unless the caregiver explicitly specified a day/time. Tell the caregiver the specialist will choose and confirm an available time.
6. SELECTIVE RED-FLAG TRIAGE: Ordinary crying or fussing is NOT an urgent emergency—comfort calmly without alarmist escalation.

${contextBlock}
`;

  let replyText = '';
  const analysis: FiveBrainAnalysis = {
    conversationBrain: {
      detectedIntent: 'Caregiver conversation',
      caregiverTone: `${sentimentResult.sentiment.replace(/_/g, ' ')}`,
      caregiverMode: derivedMode,
      culturalContext: msgLang,
      sentimentAnalysis: sentimentResult,
      domainScopeStatus: 'in_scope'
    },
    memoryBrain: {
      childId: child.id,
      childName: child.name,
      recalledMemories: child.sensitivities,
      profileUpdateProposals: [],
      detectedMilestones: []
    },
    recommendationBrain: {
      ragMaterialsRetrieved: ragMaterials.slice(0, 3).map(m => ({
        id: m.id,
        title: m.title,
        domain: m.domain,
        relevanceScore: 0.9
      })),
      recommendationSource: 'none'
    },
    engagementBrain: {
      nudgeType: isCaregiverExhausted ? 'rest_break' : 'responsive_dialogue'
    },
    escalationBrain: {
      therapistEscalationTriggered: false,
      adminAlertTriggered: false
    }
  };

  let holdingMessageId: string | null = null;

  try {
    const rawJsonText = await callGeminiWithRetry({
      contents: conversationTurns,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyMessageText: {
              type: Type.STRING,
              description: 'Concise, warm WhatsApp reply directly answering the caregiver in their language.'
            },
            intent: { type: Type.STRING },
            caregiverTone: { type: Type.STRING },
            caregiverMode: { type: Type.STRING },
            languageUsed: { type: Type.STRING },
            isOutOfScope: { type: Type.BOOLEAN },
            outOfScopeCategory: { type: Type.STRING },
            matchedCardId: {
              type: Type.STRING,
              description: 'Exact CARD_ID from retrieved RAG cards used in reply, or empty string if none.'
            },
            recommendationSource: {
              type: Type.STRING,
              description: 'One of: clinical_library, adapted_household_resources, none.'
            },
            noCardAvailableReason: {
              type: Type.STRING,
              description: 'Reason if no retrieved RAG card matches the caregiver question.'
            },
            suggestedActivityTitle: { type: Type.STRING },
            suggestedActivityDomain: { type: Type.STRING },
            suggestedActivitySteps: { type: Type.ARRAY, items: { type: Type.STRING } },
            resourcesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
            englishTranslationOfCaregiverMessage: {
              type: Type.STRING,
              description: 'Accurate English translation if parent wrote in Swahili/Sheng, else empty.'
            },
            profileUpdateProposals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  fact: { type: Type.STRING },
                  skill_summary: { type: Type.STRING },
                  domain: { type: Type.STRING },
                  evidence_quote: { type: Type.STRING },
                  status: { type: Type.STRING },
                  is_milestone: { type: Type.BOOLEAN },
                  independence_level: { type: Type.STRING },
                  reported_date: { type: Type.STRING },
                  is_intervention_outcome: { type: Type.BOOLEAN },
                  confidence: { type: Type.NUMBER },
                  needs_confirmation: { type: Type.BOOLEAN },
                  needs_review: { type: Type.BOOLEAN },
                  clarifying_question: { type: Type.STRING }
                },
                required: ['fact', 'domain', 'evidence_quote', 'status', 'confidence']
              }
            },
            therapistEscalation: { type: Type.BOOLEAN },
            preferredBookingDay: { type: Type.STRING },
            preferredBookingTime: { type: Type.STRING },
            therapistRecommendationReason: { type: Type.STRING },
            suggestedTherapistName: { type: Type.STRING }
          },
          required: ['replyMessageText', 'intent', 'caregiverMode', 'languageUsed', 'isOutOfScope', 'profileUpdateProposals']
        }
      }
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(stripJsonFences(rawJsonText));
    } catch {
      replyText = rawJsonText.trim();
    }

    if (parsed.replyMessageText) {
      replyText = parsed.replyMessageText;
    }

    if (parsed.isOutOfScope) {
      analysis.conversationBrain.domainScopeStatus = 'out_of_scope_declined';
      analysis.conversationBrain.outOfScopeReason = parsed.outOfScopeCategory || 'Off-topic outside Kinda Care';
    }

    // 1. Run integrated Milestone & Intervention Outcome Scanner (deterministic + Gemini structured)
    const resolvedDateInfo = resolveReportedDate(incomingText, now);
    const milestoneScan = !parsed.isOutOfScope && !isSimpleGreetingOrNoise(incomingText)
      ? scanCaregiverMessageForMilestones({
          child,
          incomingText,
          messageId,
          modelProposals: Array.isArray(parsed.profileUpdateProposals) ? parsed.profileUpdateProposals : [],
          referenceNow: now
        })
      : { milestones: [], ambiguousForSilentReview: [] };

    let loggedMilestoneOrIntervention = false;
    const emotionTag: ObservationFeedback['detectedEmotion'] =
      sentimentResult.sentiment === 'celebratory'
        ? 'celebratory'
        : isCaregiverExhausted
        ? 'exhausted'
        : sentimentResult.sentiment === 'anxious_worried'
        ? 'anxious'
        : sentimentResult.sentiment === 'frustrated'
        ? 'frustrated'
        : sentimentResult.sentiment === 'calm_positive'
        ? 'calm'
        : 'neutral';

    for (const msRecord of milestoneScan.milestones) {
      const promoResult = globalDataStore.addOrProgressMilestone(msRecord);
      analysis.memoryBrain.detectedMilestones = [
        ...(analysis.memoryBrain.detectedMilestones || []),
        promoResult.record
      ];
      analysis.memoryBrain.milestoneUpdateDetected = promoResult.record.is_progression
        ? `${promoResult.record.skillSummary} (${promoResult.record.progression_note})`
        : promoResult.record.skillSummary;
      analysis.conversationBrain.caregiverMode = 'celebration';

      if (promoResult.status !== 'deduped') {
        const milestoneObs: ObservationFeedback = {
          id: 'obs_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
          childId: child.id,
          timestamp: now.toISOString(),
          reportedDate: promoResult.record.reported_date,
          reportedDateDisplay: promoResult.record.reportedDateDisplay,
          rawParentMessage: promoResult.record.verbatim_quote,
          englishTranslation: parsed.englishTranslationOfCaregiverMessage || undefined,
          category: 'milestone',
          domain: promoResult.record.domain,
          insightSummary: promoResult.record.is_progression
            ? `${promoResult.record.skillSummary} (${promoResult.record.progression_note})`
            : promoResult.record.skillSummary,
          whyThisMatters: promoResult.record.intervention_ref
            ? `Milestone achieved during guided activity (${promoResult.record.intervention_ref}).`
            : `Caregiver-reported developmental gain in ${promoResult.record.domain}.`,
          detectedEmotion: 'celebratory',
          sourceMessageId: messageId,
          independenceLevel: promoResult.record.independence_level,
          interventionRef: promoResult.record.intervention_ref,
          isProgression: promoResult.record.is_progression
        };
        globalDataStore.addObservation(milestoneObs);

        // If specialist/companion-recommended activity performed successfully: log BOTH milestone AND intervention outcome
        if (promoResult.record.is_intervention_outcome && promoResult.record.intervention_ref) {
          if (child.lastSuggestedProtocol) {
            child.lastSuggestedProtocol.status = 'completed';
            globalDataStore.saveChild(child);
          }
          const outcomeObs: ObservationFeedback = {
            id: 'obs_int_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
            childId: child.id,
            timestamp: now.toISOString(),
            reportedDate: promoResult.record.reported_date,
            reportedDateDisplay: promoResult.record.reportedDateDisplay,
            rawParentMessage: promoResult.record.verbatim_quote,
            englishTranslation: parsed.englishTranslationOfCaregiverMessage || undefined,
            category:
              promoResult.record.domain === 'speech'
                ? 'speech'
                : promoResult.record.domain === 'motor'
                ? 'motor'
                : promoResult.record.domain === 'sensory'
                ? 'sensory'
                : promoResult.record.domain === 'social'
                ? 'emotional'
                : promoResult.record.domain === 'independence'
                ? 'independence'
                : 'cognitive',
            domain: promoResult.record.domain,
            insightSummary: `Intervention outcome (${promoResult.record.intervention_ref}): ${promoResult.record.skillSummary}`,
            whyThisMatters: `Guided intervention outcome recorded alongside developmental milestone for specialist review.`,
            detectedEmotion: 'celebratory',
            sourceMessageId: messageId,
            independenceLevel: promoResult.record.independence_level,
            interventionRef: promoResult.record.intervention_ref,
            isInterventionOutcome: true,
            isProgression: promoResult.record.is_progression
          };
          globalDataStore.addObservation(outcomeObs);
        }

        loggedMilestoneOrIntervention = true;
      }
    }

    // 2. Ambiguous notes -> silent OT queue (needs_review: true, DO NOT ask parent to confirm!)
    for (const ambigRecord of milestoneScan.ambiguousForSilentReview) {
      analysis.memoryBrain.detectedMilestones = [
        ...(analysis.memoryBrain.detectedMilestones || []),
        ambigRecord
      ];
      const silentObs: ObservationFeedback = {
        id: 'obs_rev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 5),
        childId: child.id,
        timestamp: now.toISOString(),
        reportedDate: ambigRecord.reported_date,
        reportedDateDisplay: ambigRecord.reportedDateDisplay,
        rawParentMessage: ambigRecord.verbatim_quote,
        englishTranslation: parsed.englishTranslationOfCaregiverMessage || undefined,
        category: 'general',
        domain: ambigRecord.domain,
        insightSummary: `Silent OT review note: ${ambigRecord.skillSummary}`,
        whyThisMatters: 'Logged silently for occupational therapist / specialist review due to ambiguous wording.',
        detectedEmotion: emotionTag,
        sourceMessageId: messageId,
        needsReview: true
      };
      globalDataStore.addObservation(silentObs);
      loggedMilestoneOrIntervention = true;
    }

    // 3. Log other important child-associated observations from model proposals (when not already logged above)
    const shouldInspectProposals =
      !parsed.isOutOfScope &&
      !isSimpleGreetingOrNoise(incomingText) &&
      Array.isArray(parsed.profileUpdateProposals) &&
      parsed.profileUpdateProposals.length > 0;

    if (shouldInspectProposals) {
      const validatedProposals: ProfileUpdateProposal[] = [];
      for (const prop of parsed.profileUpdateProposals) {
        if (!prop?.fact || !prop?.evidence_quote) continue;
        const quoteLower = String(prop.evidence_quote).trim().toLowerCase();
        const verbatimQuote = incomingText.toLowerCase().includes(quoteLower)
          ? String(prop.evidence_quote).trim()
          : incomingText.trim();

        const validStatuses = ['new', 'update', 'contradiction', 'milestone'];
        const safeStatus: ProfileUpdateProposal['status'] = validStatuses.includes(prop.status) ? prop.status : 'new';

        validatedProposals.push({
          fact: String(prop.fact),
          domain: (prop.domain as any) || inferDomainFromText(incomingText),
          evidence_quote: verbatimQuote,
          status: safeStatus,
          confidence: Math.max(0, Math.min(1, Number(prop.confidence) || 0.85)),
          needs_confirmation: Boolean(prop.needs_review || prop.needs_confirmation),
          clarifying_question: prop.clarifying_question ? String(prop.clarifying_question) : undefined
        });
      }

      if (validatedProposals.length > 0) {
        analysis.memoryBrain.profileUpdateProposals = validatedProposals;
        analysis.memoryBrain.newFeedbackExtracted = validatedProposals.map(p => p.fact).join('; ');

        if (!loggedMilestoneOrIntervention && isImportantChildObservationText(incomingText, child.name)) {
          const primary = validatedProposals[0];
          const categoryMap: Record<string, ObservationFeedback['category']> = {
            cognitive: 'cognitive',
            speech: 'speech',
            motor: 'motor',
            sensory: 'sensory',
            social: 'emotional',
            independence: 'independence',
            routine: 'general',
            general: 'general'
          };

          const silentNeedsReview = Boolean(primary.needs_confirmation);
          const obs: ObservationFeedback = {
            id: 'obs_' + Date.now(),
            childId: child.id,
            timestamp: now.toISOString(),
            reportedDate: resolvedDateInfo.isoDate,
            reportedDateDisplay: resolvedDateInfo.displayDate,
            rawParentMessage: primary.evidence_quote,
            englishTranslation: parsed.englishTranslationOfCaregiverMessage || undefined,
            category: primary.status === 'milestone' ? 'milestone' : categoryMap[primary.domain] || 'general',
            domain: (['cognitive', 'motor', 'speech', 'sensory', 'social', 'independence'].includes(primary.domain)
              ? primary.domain
              : inferDomainFromText(incomingText)) as any,
            insightSummary: primary.fact,
            whyThisMatters:
              primary.status === 'contradiction'
                ? `Caregiver note differs from earlier record (${primary.fact}); worth revisiting gently.`
                : silentNeedsReview
                ? `Queued silently for specialist review (${primary.clarifying_question || 'ambiguous phrasing'}).`
                : `Important child observation logged to tailor home play and inform specialist reports.`,
            detectedEmotion: emotionTag,
            sourceMessageId: messageId,
            needsReview: silentNeedsReview,
            needsConfirmation: silentNeedsReview,
            clarifyingQuestion: primary.clarifying_question,
            isContradiction: primary.status === 'contradiction'
          };
          globalDataStore.addObservation(obs);
        }
      }
    }

    // 4. Strict RAG Card Activity Validation
    const verifiedCard =
      VERIFIED_EDUCATIONAL_MATERIALS.find(m => m.id === parsed.matchedCardId) ||
      (parsed.suggestedActivityTitle
        ? ragMaterials.find(m =>
            String(parsed.suggestedActivityTitle)
              .toLowerCase()
              .split(/\s+/)
              .some(w => w.length >= 4 && m.title.toLowerCase().includes(w))
          ) || ragMaterials[0]
        : undefined);
    if (!parsed.isOutOfScope && !askingNextWithoutSkip && verifiedCard && parsed.suggestedActivityTitle) {
      analysis.recommendationBrain.recommendationSource =
        parsed.recommendationSource === 'adapted_household_resources'
          ? 'adapted_household_resources'
          : 'clinical_library';
      analysis.recommendationBrain.suggestedActivity = {
        title: parsed.suggestedActivityTitle,
        domain: verifiedCard.domain,
        stepByStep: Array.isArray(parsed.suggestedActivitySteps) ? parsed.suggestedActivitySteps : verifiedCard.activities.slice(0, 2),
        parentTip: verifiedCard.caregiverGuidance,
        resourcesUsed: Array.isArray(parsed.resourcesUsed) ? parsed.resourcesUsed : []
      };

      child.lastSuggestedProtocol = {
        cardId: verifiedCard.id,
        title: parsed.suggestedActivityTitle,
        domain: verifiedCard.domain,
        suggestedAt: now.toISOString(),
        status: 'pending_feedback'
      };
      globalDataStore.saveChild(child);
    } else if (parsed.noCardAvailableReason) {
      analysis.recommendationBrain.recommendationSource = 'none';
      analysis.recommendationBrain.noCardAvailableReason = parsed.noCardAvailableReason;
    }

    // 5. Specialist Booking Request Guard:
    //    - Never trigger if AI is only asking permission ("would you like me to reach out...?")
    //    - Never create duplicates (strict single pending request per child + therapist)
    //    - Never pre-choose 10:00 AM EAT or a date unless caregiver explicitly requested one!
    const isAskingPermissionToReachOut =
      /\b(can i reach out|would you like me to reach out|shall i reach out|should i reach out|may i reach out|would you like me to contact|want me to connect you)\b/i.test(
        replyText
      );

    if (!parsed.isOutOfScope && parsed.therapistEscalation && !isAskingPermissionToReachOut) {
      const matchedTherapist =
        VERIFIED_THERAPISTS.find(t =>
          t.name.toLowerCase().includes(String(parsed.suggestedTherapistName || '').toLowerCase())
        ) || VERIFIED_THERAPISTS[0];

      const requestedDate =
        parsed.preferredBookingDay && String(parsed.preferredBookingDay).trim()
          ? getNextCalendarDateForDay(parsed.preferredBookingDay)
          : 'To be chosen by therapist';
      const requestedTime =
        parsed.preferredBookingTime && String(parsed.preferredBookingTime).trim()
          ? String(parsed.preferredBookingTime).trim()
          : 'To be chosen by therapist';
      const sessionTopic =
        parsed.therapistRecommendationReason || 'Caregiver-requested specialist consultation';
      const adminPhone = getAdminRoutingPhone();

      const appt: TherapistAppointment = {
        id: 'apt_' + Date.now(),
        childId: child.id,
        childName: child.name,
        caregiverName: child.caregiverName,
        caregiverPhone: child.caregiverPhone,
        therapistId: matchedTherapist.id,
        therapistName: matchedTherapist.name,
        date: requestedDate,
        time: requestedTime,
        mode: 'virtual_zoom',
        sessionTopic,
        status: 'requested_awaiting_confirmation',
        statusLabel: 'Requested, awaiting therapist confirmation',
        notes: 'Submitted via Kinda Care WhatsApp; therapist will choose and confirm an available date & time.'
      };

      const { appointment: savedAppt, created: isNewBooking } = globalDataStore.addAppointment(appt);

      if (isNewBooking) {
        globalDataStore.addAdminAlert({
          childId: child.id,
          childName: child.name,
          caregiverName: child.caregiverName,
          caregiverPhone: child.caregiverPhone,
          reason: `New consultation request with ${matchedTherapist.name} (therapist to choose available time)`,
          urgency: 'booking_confirmation',
          messageSummary: sessionTopic
        });
      }

      analysis.escalationBrain.therapistEscalationTriggered = true;
      analysis.escalationBrain.recommendedTherapistName = savedAppt.therapistName;
      analysis.escalationBrain.scheduledSessionTopic = savedAppt.sessionTopic;
      analysis.escalationBrain.appointmentStatus = savedAppt.statusLabel || 'Requested, awaiting therapist confirmation';
      analysis.escalationBrain.requestedDate = savedAppt.date;
      analysis.escalationBrain.requestedTime = savedAppt.time;
      analysis.escalationBrain.adminAlertTriggered = isNewBooking;
      analysis.escalationBrain.adminAlertReason = isNewBooking
        ? 'Single request sent — specialist to choose time and confirm'
        : 'Existing booking request already awaiting therapist time selection';
      analysis.escalationBrain.routedAdminContact = adminPhone;
    }

    analysis.conversationBrain.detectedIntent = parsed.intent || 'Caregiver conversation';
    analysis.conversationBrain.caregiverTone = parsed.caregiverTone || sentimentResult.sentiment;
    analysis.conversationBrain.caregiverMode =
      hasPreDetectedMilestone
        ? 'celebration'
        : parsed.caregiverMode === 'caregiver_rest' ||
          parsed.caregiverMode === 'comfort_first' ||
          parsed.caregiverMode === 'celebration'
        ? parsed.caregiverMode
        : derivedMode;
    analysis.conversationBrain.culturalContext =
      parsed.languageUsed === 'swahili' || parsed.languageUsed === 'sheng_blended'
        ? parsed.languageUsed
        : msgLang;
  } catch (error: any) {
    console.warn('[Gemini Foreground Retries Exhausted — Queuing Background Retry]:', error?.message || error);
    replyText = buildHoldingMessage(child.caregiverName, msgLang);
    analysis.conversationBrain.detectedIntent = 'Queued for retry after temporary service busy delay';
    analysis.conversationBrain.isQueuedRetry = true;
    holdingMessageId = 'msg_holding_' + Date.now();
  }

  const compliance = enforceMetaComplianceOnOutput(replyText, {
    isCheckIn: false,
    activeChildName: child.name
  });
  replyText = compliance.compliantText;

  const replyId = holdingMessageId || 'msg_bot_' + Date.now();
  const replyMessage: ChatMessage = {
    id: replyId,
    childId: child.id,
    sender: 'kinda_care',
    text: replyText,
    timestamp: now.toISOString(),
    timeDisplay,
    replyToId: replyToMessageId,
    fiveBrainAnalysis: analysis,
    status: 'delivered'
  };

  globalDataStore.addMessage(replyMessage);

  if (holdingMessageId && replyToMessageId) {
    enqueueBackgroundRetry(
      child,
      incomingText,
      replyToMessageId,
      holdingMessageId,
      systemInstruction,
      conversationTurns,
      sentimentResult,
      ragMaterials,
      isCaregiverExhausted,
      onBackgroundRetrySuccess
    );
  }

  return { replyMessage, fiveBrainAnalysis: analysis };
}

export async function generateOrganicCheckIn(
  childId: string,
  triggerType: 'quiet_parent_checkin' | 'organic_random_checkin'
): Promise<ChatMessage> {
  const child = globalDataStore.getChild(childId);
  if (!child) throw new Error('Child not found');

  const history = globalDataStore.getMessages(childId);
  const observations = globalDataStore.getObservations(childId);
  const appointments = globalDataStore.getAppointments(childId);
  const milestones = globalDataStore.getMilestones(childId);
  const { ragMaterials, contextBlock } = buildChildContextBlock(
    child,
    observations,
    appointments,
    milestones,
    child.favoriteActivities.join(' ')
  );

  const scenarioPrompt =
    triggerType === 'quiet_parent_checkin'
      ? `The parent (${child.caregiverName}) has gone quiet for a few days. Craft ONE brief, warm, pressure-free WhatsApp check-in asking how they and ${child.name} are doing.`
      : `Send ONE brief, warm, organic WhatsApp check-in to ${child.caregiverName} asking how ${child.name} or they are holding up today.`;

  let nudgeText = '';
  try {
    const raw = await callGeminiWithRetry({
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: `${scenarioPrompt}\n\nRecent messages:\n${history.slice(-6).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}`
            }
          ]
        }
      ],
      config: {
        systemInstruction: `You are Kinda Care, a warm caregiver-support companion on WhatsApp (NOT a clinician). Return ONLY 2 short natural sentences. Non-promotional, no diagnosis, no outcome promises.\n${contextBlock}`
      }
    });
    nudgeText = raw.trim().replace(/^["']|["']$/g, '');
  } catch {
    nudgeText =
      triggerType === 'quiet_parent_checkin'
        ? `Habari ${child.caregiverName}! It's been a few quiet days and I wanted to check in—no pressure at all, just wishing you and ${child.name} a gentle week.`
        : `Hi ${child.caregiverName}! Hope today is treating you kindly. How are you and ${child.name} doing today?`;
  }

  const checkInCompliance = enforceMetaComplianceOnOutput(nudgeText, {
    isCheckIn: true,
    activeChildName: child.name
  });
  nudgeText = checkInCompliance.compliantText;

  const now = new Date();
  const botMsg: ChatMessage = {
    id: 'nudge_' + Date.now(),
    childId: child.id,
    sender: 'kinda_care',
    text: nudgeText,
    timestamp: now.toISOString(),
    timeDisplay: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
    status: 'delivered',
    fiveBrainAnalysis: {
      conversationBrain: {
        detectedIntent: triggerType === 'quiet_parent_checkin' ? 'Quiet-parent warm check-in' : 'Organic check-in',
        caregiverTone: 'Warm & pressure-free',
        caregiverMode: 'standard',
        culturalContext: 'sheng_blended',
        domainScopeStatus: 'in_scope'
      },
      memoryBrain: {
        childId: child.id,
        childName: child.name,
        recalledMemories: child.sensitivities
      },
      recommendationBrain: {
        ragMaterialsRetrieved: ragMaterials.slice(0, 1).map(m => ({
          id: m.id,
          title: m.title,
          domain: m.domain,
          relevanceScore: 0.85
        })),
        recommendationSource: 'none'
      },
      engagementBrain: {
        nudgeType: triggerType,
        nudgeText
      },
      escalationBrain: {
        therapistEscalationTriggered: false,
        adminAlertTriggered: false
      }
    }
  };

  globalDataStore.addMessage(botMsg);
  return botMsg;
}

export async function generateDynamicProgressReport(childId: string): Promise<ProgressReport | null> {
  const baseReport = globalDataStore.generateProgressReport(childId);
  const child = globalDataStore.getChild(childId);
  if (!baseReport || !child) return null;

  const obs = globalDataStore.getObservations(childId).filter(o => !o.needsReview);
  if (obs.length === 0 || !process.env.GEMINI_API_KEY) {
    return baseReport;
  }

  try {
    const validDates = new Set(
      obs.map(o => o.reportedDateDisplay || formatShortDateEAT(o.reportedDate || o.timestamp))
    );
    const observationsPayload = obs.map(o => ({
      date: o.reportedDateDisplay || formatShortDateEAT(o.reportedDate || o.timestamp),
      original_quote: o.rawParentMessage,
      translation: o.englishTranslation || null,
      note: o.insightSummary
    }));

    const rawJson = await callGeminiWithRetry({
      contents: `Write an evidence-only caregiver observation summary using ONLY these OBSERVATIONS and APPOINTMENTS.\n\nOBSERVATIONS:\n${JSON.stringify(observationsPayload, null, 2)}\n\nAPPOINTMENTS:\n${JSON.stringify(baseReport.appointmentsOnFile, null, 2)}`,
      config: {
        systemInstruction: `Write a developmental progress summary using ONLY the OBSERVATIONS provided (each has date and original_quote).
STRICT RULES:
- Every sentence in summaryParagraphs and executiveSummaryParagraphs MUST end with the observation date in brackets right before the period, e.g. "Caregiver reported Nancy placed the red tiles calmly [Nov 15, 2026]."
- NEVER include raw internal IDs such as [obs_...] or [ms_...]. Always use the observation date [Mon DD, YYYY].
- Max 200 words total across summaryParagraphs (split into 2-3 distinct paragraphs).
- Do NOT add strengths, scores, or percentages.
- Use neutral, behavioral descriptions ("pushed tiles away"), NEVER labels like aggression or dysregulation, unless the caregiver used those exact words in original_quote.
- Do NOT diagnose or promise outcomes.
- Also provide 1-3 concise neutral "openQuestionsForSpecialist" grounded strictly in the observations.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summaryParagraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            executiveSummaryParagraphs: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            openQuestionsForSpecialist: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['summaryParagraphs', 'executiveSummaryParagraphs', 'openQuestionsForSpecialist']
        }
      }
    });

    const parsed = JSON.parse(stripJsonFences(rawJson));
    const cleanParagraph = (p: string) =>
      String(p)
        .replace(/%/g, ' percent')
        .replace(/\[obs_[^\]]+\]/gi, `[${Array.from(validDates)[0] || formatShortDateEAT()}]`)
        .trim();

    if (Array.isArray(parsed.summaryParagraphs) && parsed.summaryParagraphs.length > 0) {
      const sanitized = parsed.summaryParagraphs
        .map(cleanParagraph)
        .filter((p: string) => Array.from(validDates).some(d => p.includes(`[${d}]`)));
      if (sanitized.length > 0) {
        baseReport.summaryParagraphs = sanitized;
      }
    }
    if (Array.isArray(parsed.executiveSummaryParagraphs) && parsed.executiveSummaryParagraphs.length > 0) {
      const sanitizedExec = parsed.executiveSummaryParagraphs
        .map(cleanParagraph)
        .filter((p: string) => Array.from(validDates).some(d => p.includes(`[${d}]`)));
      if (sanitizedExec.length > 0) {
        baseReport.executiveSummaryParagraphs = sanitizedExec;
      }
    }
    if (Array.isArray(parsed.openQuestionsForSpecialist) && parsed.openQuestionsForSpecialist.length > 0) {
      baseReport.openQuestionsForSpecialist = parsed.openQuestionsForSpecialist.map(
        (q: string) => String(q).replace(/\[?obs_[0-9_a-z]+\]?/gi, '').trim()
      );
    }
  } catch (err) {
    console.warn('[Report synthesis using deterministic evidence-only paragraphs]:', err instanceof Error ? err.message : err);
  }

  return baseReport;
}
