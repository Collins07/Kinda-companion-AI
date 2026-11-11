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
  TherapistAppointment
} from '../types';
import { globalDataStore } from './dataStore';
import { searchRAGMaterials } from './knowledgeBase';
import { VERIFIED_THERAPISTS } from './therapistDirectory';

// Initialize the shared server-side Gemini client as instructed in the gemini-api skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build'
    }
  }
});

export async function processCaregiverMessage(
  childId: string,
  incomingText: string,
  replyToMessageId?: string
): Promise<{ replyMessage: ChatMessage; fiveBrainAnalysis: FiveBrainAnalysis }> {
  const child = globalDataStore.getChild(childId) || {
    id: childId,
    name: 'Your Child',
    caregiverName: 'Caregiver',
    caregiverPhone: '+254700000000',
    ageMonths: 48,
    gender: 'other',
    developmentalStage: 'Early Childhood',
    strengths: ['Playful'],
    sensitivities: [],
    currentMilestones: [],
    favoriteActivities: [],
    subscriptionTier: 'free',
    odpcConsent: { granted: true, parentConfirmedIdentity: true },
    notes: ''
  };

  const allHistory = globalDataStore.getMessages(childId);
  const observations = globalDataStore.getObservations(childId);
  const ragMaterials = searchRAGMaterials(incomingText, child.ageMonths);

  // Check for admin escalation triggers directly
  const adminTriggerRegex = /(refund|money back|severe pain|bleeding|emergency|speak to (the )?owner|speak to (the )?manager)/i;
  const directAdminAlert = adminTriggerRegex.test(incomingText);

  // Check for caregiver exhaustion
  const exhaustionRegex = /(i('?m| am) exhausted|i('?m| am) tired|burned out|hard day|too much for me|need a break)/i;
  const isCaregiverExhausted = exhaustionRegex.test(incomingText);

  // Construct comprehensive prompt for Gemini
  const promptContext = `
=== CHILD PROFILE ===
Name: ${child.name}
Caregiver: ${child.caregiverName} (${child.caregiverPhone})
Age: ${Math.floor(child.ageMonths / 12)} years ${child.ageMonths % 12 > 0 ? (child.ageMonths % 12) + ' months' : ''}
Developmental Stage: ${child.developmentalStage}
Strengths: ${child.strengths.join(', ')}
Sensory Sensitivities / Triggers: ${child.sensitivities.length > 0 ? child.sensitivities.join(', ') : 'None documented yet'}
Active Kit / Play: ${child.activeKit || 'General Home Play Materials'}
Current Milestones Tracked:
${child.currentMilestones.map(m => `- [${m.domain.toUpperCase()}] ${m.title} (${m.status})`).join('\n')}

=== PREVIOUS LONG-TERM PARENT FEEDBACK & OBSERVATIONS STORED ===
${observations.slice(-5).map(o => `- [${o.timestamp.slice(0, 10)}] "${o.rawParentMessage}" -> Impact: ${o.insightSummary}`).join('\n') || 'No previous observations recorded yet.'}

=== VERIFIED RAG KNOWLEDGE BASE ARTICLES RETRIEVED ===
${ragMaterials.slice(0, 3).map(m => `### ${m.title} (${m.domain})\n${m.description}\nRecommended Activities:\n${m.activities.join('\n')}\nCaregiver Guidance: ${m.caregiverGuidance}\nTherapist Rationale: ${m.therapistRationale}`).join('\n\n')}

=== VERIFIED KENYAN SPECIALISTS (ESCALATION DIRECTORY) ===
${VERIFIED_THERAPISTS.map(t => `- ${t.name} (${t.title}, ${t.specialty}, Location: ${t.location}, Rate: KSh ${t.rateKSh}, Avail: ${t.availableDays.join(', ')})`).join('\n')}

=== RECENT CONVERSATION HISTORY ===
${allHistory.slice(-8).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join('\n')}

=== INCOMING PARENT MESSAGE ===
PARENT: "${incomingText}"
`;

  const systemInstruction = `
You are Kinda Care AI, a warm, emotionally intelligent, culturally attuned WhatsApp companion for Kenyan parents and caregivers of young children.
You sit between the parent, the child's daily activities, and qualified pediatric therapists.

CORE PRINCIPLES (THE 5 BRAINS):
1. CONVERSATION BRAIN:
   - Speak naturally like a supportive, knowledgeable friend. Blend warmth with Kenyan context (understands Sheng, Swahili phrases like "Hiyo bado", "alizipangua", "habari", "mambo", "asante").
   - CAREGIVER REST MODE: If the parent says they are exhausted ("I'm exhausted", "too tired", etc.), NEVER push a lesson or activity! Validate them warmly: "That sounds like a hard day. You don't have to do an activity right now. Would you prefer to take a break or do a 2-minute calming breathing?"
   - Ask caring, curious questions to deepen understanding or provide emotional comfort.

2. MEMORY BRAIN:
   - You know ${child.name}'s specific profile, sensory sensitivities, and developmental history.
   - When the parent shares a win (e.g. "Today Bravin really did a puzzle kit alone" or "Sharon has been singing using complete words"), celebrate enthusiastically, explain the developmental milestone significance, and store it.

3. RECOMMENDATION BRAIN:
   - Provide gentle, flexible play ideas (Reading, Spelling, Drawing, Sensory Play, Singing, Gross/Fine Motor) grounded in verified materials. Activities are NEVER restricted to a single toy kit.

4. ENGAGEMENT BRAIN:
   - Keep interactions low-pressure, micro-actionable, and emotionally restorative.

5. ESCALATION BRAIN:
   - If the parent reports persistent sensory resistance (e.g., Joash refusing red tiles: "Hiyo bado. Alizipangua kwanza..."), offer to schedule a virtual session with our therapist (e.g., Dr. Wanjiku Mwangi, OTR/L).
   - If the user asks for a refund, expresses severe distress/physical pain, or demands a manager, answer courteously and append [ALERT_ADMIN] at the very end.

OUTPUT FORMAT REQUIREMENTS:
Provide your response in JSON format matching the schema so we can execute the 5-brain analysis and store observations accurately.
`;

  let replyText = '';
  let analysis: FiveBrainAnalysis = {
    conversationBrain: {
      detectedIntent: 'Parent check-in and conversation',
      caregiverTone: isCaregiverExhausted ? 'Exhausted / seeking relief' : 'Engaged',
      caregiverMode: isCaregiverExhausted ? 'caregiver_rest' : 'standard',
      culturalContext: 'kenyan_sheng_swahili'
    },
    memoryBrain: {
      childId: child.id,
      childName: child.name,
      recalledMemories: child.sensitivities.concat(child.strengths),
      newFeedbackExtracted: incomingText.length > 15 ? incomingText : undefined
    },
    recommendationBrain: {
      ragMaterialsRetrieved: ragMaterials.map(m => ({
        id: m.id,
        title: m.title,
        domain: m.domain,
        relevanceScore: 0.9
      })),
      suggestedActivity: ragMaterials[0] ? {
        title: ragMaterials[0].title,
        domain: ragMaterials[0].domain,
        stepByStep: ragMaterials[0].activities.slice(0, 3),
        parentTip: ragMaterials[0].caregiverGuidance
      } : undefined
    },
    engagementBrain: {
      nudgeType: isCaregiverExhausted ? 'rest_break' : 'checkin',
      emotionalWarmthRating: 9
    },
    escalationBrain: {
      therapistEscalationTriggered: false,
      adminAlertTriggered: directAdminAlert,
      adminAlertReason: directAdminAlert ? 'User requested admin / refund / emergency' : undefined
    }
  };

  try {
    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptContext,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            replyMessageText: {
              type: Type.STRING,
              description: 'The natural, empathetic WhatsApp message reply sent to the parent (no markdown headers, suitable for WhatsApp).'
            },
            intent: {
              type: Type.STRING,
              description: 'Brief summary of the caregiver intent.'
            },
            caregiverMode: {
              type: Type.STRING,
              description: 'Mode: standard, caregiver_rest, comfort_first, or celebration.'
            },
            extractedFeedbackInsight: {
              type: Type.STRING,
              description: 'If the parent shared an observation/feedback (e.g., Bravin puzzle alone or Sharon singing complete words), summarize the developmental insight. Otherwise empty string.'
            },
            feedbackCategory: {
              type: Type.STRING,
              description: 'Category: milestone, sensory, speech, motor, emotional, concern, or general.'
            },
            milestoneAchieved: {
              type: Type.STRING,
              description: 'Title of any milestone achieved or emerging, or empty string.'
            },
            therapistEscalation: {
              type: Type.BOOLEAN,
              description: 'Whether a specialist consultation is recommended or scheduled in this turn.'
            },
            therapistRecommendationReason: {
              type: Type.STRING,
              description: 'Reason for therapist escalation (e.g. sensory desensitization ladder or speech evaluation).'
            },
            suggestedTherapistName: {
              type: Type.STRING,
              description: 'Name of the therapist to recommend, e.g. Dr. Wanjiku Mwangi, OTR/L.'
            },
            adminAlertTriggered: {
              type: Type.BOOLEAN,
              description: 'True if [ALERT_ADMIN] code should be appended.'
            }
          },
          required: ['replyMessageText', 'intent', 'caregiverMode']
        }
      }
    });

    const parsed = JSON.parse(geminiResponse.text || '{}');
    replyText = parsed.replyMessageText || '';

    // If admin alert triggered or found in text
    if (parsed.adminAlertTriggered || directAdminAlert) {
      if (!replyText.includes('[ALERT_ADMIN]')) {
        replyText += '\n\n[ALERT_ADMIN]';
      }
      analysis.escalationBrain.adminAlertTriggered = true;
      analysis.escalationBrain.adminAlertReason = 'Admin assistance or critical notice requested';
    }

    if (parsed.extractedFeedbackInsight && parsed.extractedFeedbackInsight.trim().length > 0) {
      analysis.memoryBrain.newFeedbackExtracted = parsed.extractedFeedbackInsight;
      analysis.memoryBrain.milestoneUpdateDetected = parsed.milestoneAchieved || undefined;

      // Save observation to data store
      const newObs: ObservationFeedback = {
        id: 'obs_' + Date.now(),
        childId: child.id,
        timestamp: new Date().toISOString(),
        rawParentMessage: incomingText,
        category: (parsed.feedbackCategory as any) || 'milestone',
        insightSummary: parsed.extractedFeedbackInsight,
        developmentalImpact: parsed.milestoneAchieved ? `Milestone progressed: ${parsed.milestoneAchieved}` : 'Parent observation recorded for progress tracking.',
        detectedEmotion: parsed.caregiverMode === 'celebration' ? 'celebratory' : isCaregiverExhausted ? 'exhausted' : 'calm'
      };
      globalDataStore.addObservation(newObs);

      // If milestone was achieved, update child profile milestone list
      if (parsed.milestoneAchieved && parsed.milestoneAchieved.trim().length > 0) {
        const existingMilestone = child.currentMilestones.find(m => m.title.toLowerCase().includes(parsed.milestoneAchieved.toLowerCase()));
        if (existingMilestone) {
          existingMilestone.status = 'achieved';
          existingMilestone.updatedAt = new Date().toISOString().slice(0, 10);
        } else {
          child.currentMilestones.push({
            domain: (parsed.feedbackCategory as any) || 'cognitive',
            title: parsed.milestoneAchieved,
            status: 'achieved',
            updatedAt: new Date().toISOString().slice(0, 10)
          });
        }
        globalDataStore.saveChild(child);
      }
    }

    // Therapist escalation detection
    if (parsed.therapistEscalation) {
      const recTherapist = parsed.suggestedTherapistName || 'Dr. Wanjiku Mwangi, OTR/L';
      const sessionTopic = parsed.therapistRecommendationReason || 'Targeted Developmental / Sensory Consultation';
      analysis.escalationBrain.therapistEscalationTriggered = true;
      analysis.escalationBrain.recommendedTherapistName = recTherapist;
      analysis.escalationBrain.scheduledSessionTopic = sessionTopic;

      // Auto-schedule an appointment for Saturday
      const appt: TherapistAppointment = {
        id: 'apt_' + Date.now(),
        childId: child.id,
        childName: child.name,
        caregiverName: child.caregiverName,
        caregiverPhone: child.caregiverPhone,
        therapistId: 'therapist_dr_wanjiku',
        therapistName: recTherapist,
        date: 'Next Saturday',
        time: '10:00 AM (EAT)',
        mode: 'virtual_zoom',
        sessionTopic: sessionTopic,
        status: 'scheduled',
        notes: `Auto-escalated via Kinda Care WhatsApp companion: ${sessionTopic}`
      };
      globalDataStore.addAppointment(appt);
    }

    analysis.conversationBrain.detectedIntent = parsed.intent;
    analysis.conversationBrain.caregiverMode = parsed.caregiverMode || 'standard';

  } catch (error) {
    console.warn('Gemini API call warning, utilizing resilient fallback engine:', error);
    // Intelligent rule-based fallback maintaining the 5-brain principles
    if (isCaregiverExhausted) {
      replyText = `That sounds like a hard day, ${child.caregiverName}. You don't have to do any developmental activity right now. 💙\n\nWould you prefer to take a quiet break for yourself, or shall we just do a 2-minute calming breathing together? Your rest comes first.`;
      analysis.conversationBrain.caregiverMode = 'caregiver_rest';
    } else if (incomingText.toLowerCase().includes('puzzle') && incomingText.toLowerCase().includes('alone')) {
      replyText = `What a huge milestone for ${child.name}! 🎉 Doing a puzzle kit completely alone shows incredible spatial reasoning, problem-solving confidence, and focus.\n\nWhen he placed that last piece, how did his face look? That sense of mastery is so rewarding!`;
      analysis.memoryBrain.newFeedbackExtracted = 'Child completed entire puzzle kit independently';
      globalDataStore.addObservation({
        id: 'obs_' + Date.now(),
        childId: child.id,
        timestamp: new Date().toISOString(),
        rawParentMessage: incomingText,
        category: 'milestone',
        insightSummary: 'Independent completion of puzzle kit without assistance.',
        developmentalImpact: 'Executive function & fine motor spatial mastery.',
        detectedEmotion: 'celebratory'
      });
    } else if (incomingText.toLowerCase().includes('singing') || incomingText.toLowerCase().includes('words')) {
      replyText = `That is fantastic news, ${child.caregiverName}! 🎶 Singing with complete words means her brain is connecting musical melody with expressive speech pathways. Melody makes speech easier and more joyful for young children.\n\nWhat song has she been loving to sing the most?`;
      analysis.memoryBrain.newFeedbackExtracted = 'Child singing with complete words instead of hums';
      globalDataStore.addObservation({
        id: 'obs_' + Date.now(),
        childId: child.id,
        timestamp: new Date().toISOString(),
        rawParentMessage: incomingText,
        category: 'speech',
        insightSummary: 'Singing with complete articulated words; expressive language leap.',
        developmentalImpact: 'Speech sound consolidation via melodic intonation.',
        detectedEmotion: 'celebratory'
      });
    } else if (incomingText.toLowerCase().includes('hiyo bado') || incomingText.toLowerCase().includes('alizipangua') || incomingText.toLowerCase().includes('red')) {
      replyText = `Okay on Saturday I'll schedule a 30 minute virtual session with our therapist to guide you on how ${child.name} can be helped build tolerance to the red color. In the meantime, no pressure on the red tiles—just let him enjoy the colors he feels safe with! 🧩`;
      analysis.escalationBrain.therapistEscalationTriggered = true;
      analysis.escalationBrain.recommendedTherapistName = 'Dr. Wanjiku Mwangi, OTR/L';
      analysis.escalationBrain.scheduledSessionTopic = 'Sensory Ladder for Visual / Red Color Tolerance';
      globalDataStore.addAppointment({
        id: 'apt_' + Date.now(),
        childId: child.id,
        childName: child.name,
        caregiverName: child.caregiverName,
        caregiverPhone: child.caregiverPhone,
        therapistId: 'therapist_dr_wanjiku',
        therapistName: 'Dr. Wanjiku Mwangi, OTR/L',
        date: 'This Saturday',
        time: '10:00 AM (EAT)',
        mode: 'virtual_zoom',
        sessionTopic: 'Sensory Ladder for Visual / Red Color Tolerance',
        status: 'scheduled'
      });
    } else if (directAdminAlert) {
      replyText = `Let me check that with the manager right away so we can assist you properly.\n\n[ALERT_ADMIN]`;
      analysis.escalationBrain.adminAlertTriggered = true;
    } else {
      replyText = `Thank you for sharing that with me, ${child.caregiverName}! Every little moment and observation helps us support ${child.name}'s journey. Would you like a playful 5-minute activity suggestion for today, or how is ${child.name}'s mood feeling right now?`;
    }
  }

  const now = new Date();
  const timeDisplay = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const replyMessage: ChatMessage = {
    id: 'msg_bot_' + Date.now(),
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

  return { replyMessage, fiveBrainAnalysis: analysis };
}
