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
  ProgressReport
} from '../types';
import { globalDataStore } from './dataStore';
import { searchRAGMaterials } from './knowledgeBase';
import { VERIFIED_THERAPISTS } from './therapistDirectory';

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

// Use Flash Lite as primary cost-effective conversational model, with Flash fallback
const PRIMARY_MODEL = 'gemini-3.1-flash-lite';
const FALLBACK_MODEL = 'gemini-3.8-flash';

function buildChildContextBlock(child: ChildProfile, observations: ObservationFeedback[], queryText: string) {
  const ragMaterials = searchRAGMaterials(queryText + ' ' + child.sensitivities.join(' ') + ' ' + child.strengths.join(' '), child.ageMonths);

  return {
    ragMaterials,
    contextBlock: `
=== CHILD PROFILE ===
Name: ${child.name}
Caregiver: ${child.caregiverName} (${child.caregiverPhone})
Age: ${Math.floor(child.ageMonths / 12)} years ${child.ageMonths % 12 > 0 ? (child.ageMonths % 12) + ' months' : ''}
Developmental Stage: ${child.developmentalStage}
Strengths: ${child.strengths.join(', ')}
Sensory Sensitivities / Triggers: ${child.sensitivities.length > 0 ? child.sensitivities.join(', ') : 'None documented yet'}
Active Kit / Play: ${child.activeKit || 'None / Uses everyday household resources'}
Home Environment: ${child.environmentContext || 'Standard family home in Kenya'}
Available Household & Local Resources: ${(child.availableResources && child.availableResources.length > 0) ? child.availableResources.join(', ') : 'Everyday household items (spoons, cups, cloth, paper, outdoor nature)'}
Care-Team Notes: ${child.notes}
Current Milestones Tracked:
${child.currentMilestones.map(m => `- [${m.domain.toUpperCase()}] ${m.title} (${m.status})`).join('\n')}

=== LONG-TERM STORED PARENT FEEDBACK & OBSERVATIONS ===
${observations.slice(-10).map(o => `- [${o.timestamp.slice(0, 10)}] "${o.rawParentMessage}" -> Insight: ${o.insightSummary}`).join('\n') || 'No previous observations recorded yet.'}

=== VERIFIED RAG CLINICAL LIBRARY (REFERENCE WHEN RELEVANT) ===
${ragMaterials.slice(0, 3).map(m => `### ${m.title} (${m.domain})\n${m.description}\nActivities:\n${m.activities.join('\n')}\nGuidance: ${m.caregiverGuidance}\nRationale: ${m.therapistRationale}`).join('\n\n') || 'No specific library match needed for this turn — feel free to adapt or suggest helpful everyday activities outside the library.'}

=== VERIFIED KENYAN SPECIALISTS DIRECTORY (FOR ESCALATION) ===
${VERIFIED_THERAPISTS.map(t => `- ${t.name} (${t.title}, ${t.specialty}, Location: ${t.location}, Rate: KSh ${t.rateKSh}, Days: ${t.availableDays.join(', ')})`).join('\n')}
`
  };
}

function buildConversationTurns(history: ChatMessage[], currentMessage: string) {
  // Include up to 24 prior turns for long conversation context
  const recent = history.slice(-24);
  const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

  for (const msg of recent) {
    // Skip if it's literally the exact message we just appended
    if (msg.sender === 'parent' && msg.text === currentMessage && msg === recent[recent.length - 1]) {
      continue;
    }
    const role: 'user' | 'model' = msg.sender === 'parent' ? 'user' : 'model';
    // Merge consecutive same-role turns so Gemini turn alternation is valid
    if (contents.length > 0 && contents[contents.length - 1].role === role) {
      contents[contents.length - 1].parts[0].text += `\n${msg.text}`;
    } else {
      contents.push({ role, parts: [{ text: msg.text }] });
    }
  }

  // Append the live incoming parent message as the final user turn
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += `\n${currentMessage}`;
  } else {
    contents.push({ role: 'user', parts: [{ text: currentMessage }] });
  }

  // Gemini requires first turn to be 'user'
  while (contents.length > 0 && contents[0].role !== 'user') {
    contents.shift();
  }

  return contents;
}

function stripJsonFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

async function callGeminiWithRetry(params: any): Promise<string> {
  const ai = getAiClient();
  try {
    const res = await ai.models.generateContent({
      model: PRIMARY_MODEL,
      ...params
    });
    if (res.text) return res.text;
    throw new Error('Empty response from primary model');
  } catch (err: any) {
    console.warn(`[Gemini Primary Model ${PRIMARY_MODEL} warning]:`, err?.message || err);
    const resFallback = await ai.models.generateContent({
      model: FALLBACK_MODEL,
      ...params
    });
    if (resFallback.text) return resFallback.text;
    throw err;
  }
}

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
  const { ragMaterials, contextBlock } = buildChildContextBlock(child, observations, incomingText);

  const adminTriggerRegex = /\b(refund|money back|severe pain|bleeding|emergency|speak to (the )?owner|speak to (the )?manager)\b/i;
  const directAdminAlert = adminTriggerRegex.test(incomingText);

  const exhaustionRegex = /\b(i('?m| am) exhausted|i('?m| am) tired|so tired|am tired|burned out|hard day|too much for me|need a break|tumechoka|nimechoka)\b/i;
  const isCaregiverExhausted = exhaustionRegex.test(incomingText);

  const conversationTurns = buildConversationTurns(allHistory, incomingText);

  const systemInstruction = `
You are Kinda Care AI, a real-time WhatsApp companion simulating an empathetic, knowledgeable Kenyan pediatric Occupational Therapist (OT) and child development specialist.
You are having a LIVE, FLOWING CONVERSATION with ${child.caregiverName} about her child ${child.name}.

CRITICAL CONVERSATIONAL RULES (READ CAREFULLY):
1. ALWAYS REPLY DIRECTLY TO WHAT THE PARENT JUST SAID IN THE CONTEXT OF THE CONVERSATION HISTORY.
   - NEVER repeat a generic template or ignore the parent's question/statement.
   - If the parent corrects a name (e.g. "sorry i meant joash"), acknowledge the correction naturally and warmly ("No worries at all, Mama Brandon! Got it—Joash!") while honoring whatever she just asked before ("let's do it tomorrow").
   - If the parent asks to postpone ("let us do that tomorrow", "can we do this tomorrow"), respect it completely! Say okay warmly, wish them rest, and do NOT push an activity right now.
   - If the parent asks a specific question (e.g. "which song do you recommend i give her to sing in swahili"), answer that exact question directly with concrete, practical suggestions (e.g. specific Kenyan Swahili children's songs like "Kichwa Mabega Magoti na Vidole", "Mimi na Wewe", "Kuku Anaita", "Watoto Wadogo") tailored to ${child.name}'s profile and goals!

2. LANGUAGE ADAPTATION (ENGLISH, SWAHILI, OR SHENG - STRICTLY MIRROR THE PARENT):
   - ALWAYS detect the language of the parent's latest message and reply in that SAME language!
   - If the parent writes primarily in Swahili (e.g., "Asante! Nitajaribu hiyo nyimbo leo jioni..."), write the ENTIRE replyMessageText in warm, natural, everyday Kenyan Swahili (and set languageUsed to "swahili"). Do NOT switch back to English!
   - If the parent writes in Sheng or mixed Swahili/English (e.g., "Hiyo bado, alizipangua maze"), reply naturally in warm Kenyan Sheng/Swahili-English mix (and set languageUsed to "sheng_blended").
   - If the parent writes in English, reply in clear, warm, natural English (and set languageUsed to "english").

3. THE 5 BRAINS:
   - CONVERSATION BRAIN: Warm, human, non-robotic WhatsApp style (concise, natural paragraphs, no markdown headers). If parent or child is tired/exhausted, enter Caregiver Rest Mode—validate them and give permission to rest.
   - MEMORY BRAIN: Use ${child.name}'s profile and past parent feedback naturally. Whenever the parent shares a new observation or win (e.g. "Bravin did a puzzle kit alone", "Sharon has been singing using complete words", "he is tired today"), extract it as a structured insight so it informs future conversations and internal specialist reports.
   - RECOMMENDATION BRAIN: Only suggest activities when appropriate (when parent asks, seems open, or shares a play moment—NEVER when they said they are tired or want to do it tomorrow!). Recommend from the Verified Clinical Library OR creative everyday activities outside the library (reading, spelling, drawing, singing, sensory play, motor play). ALWAYS adapt to the parent's actual home environment and available household resources (${(child.availableResources || []).join(', ')})—never assume they own expensive commercial kits they don't have!
   - ENGAGEMENT BRAIN: Keep it emotionally varied and human, never pushy.
   - ESCALATION BRAIN: Only recommend or schedule a specialist session when genuinely warranted by persistent developmental/sensory hurdles (like recurring red-tile aversion) OR when the parent explicitly asks for a specialist. If the user asks for a refund, reports an emergency/severe pain, or demands a manager, append [ALERT_ADMIN] at the very end of replyMessageText.

${contextBlock}
`;

  let replyText = '';
  let analysis: FiveBrainAnalysis = {
    conversationBrain: {
      detectedIntent: 'Responsive dialogue',
      caregiverTone: isCaregiverExhausted ? 'Tired / seeking rest' : 'Engaged',
      caregiverMode: isCaregiverExhausted ? 'caregiver_rest' : 'standard',
      culturalContext: 'english'
    },
    memoryBrain: {
      childId: child.id,
      childName: child.name,
      recalledMemories: child.sensitivities.concat(child.strengths),
      newFeedbackExtracted: undefined
    },
    recommendationBrain: {
      ragMaterialsRetrieved: ragMaterials.map(m => ({
        id: m.id,
        title: m.title,
        domain: m.domain,
        relevanceScore: 0.9
      })),
      recommendationSource: 'none'
    },
    engagementBrain: {
      nudgeType: isCaregiverExhausted ? 'rest_break' : 'responsive_dialogue',
      emotionalWarmthRating: 9
    },
    escalationBrain: {
      therapistEscalationTriggered: false,
      adminAlertTriggered: directAdminAlert,
      adminAlertReason: directAdminAlert ? 'Admin assistance or critical notice requested' : undefined
    }
  };

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
              description: 'Natural WhatsApp reply directly addressing the parent message in their language (English, Swahili, or Sheng). No markdown headers.'
            },
            intent: {
              type: Type.STRING,
              description: 'Brief summary of what the parent meant/asked.'
            },
            caregiverTone: {
              type: Type.STRING,
              description: 'Observed emotional tone of the caregiver.'
            },
            caregiverMode: {
              type: Type.STRING,
              description: 'One of: standard, caregiver_rest, comfort_first, celebration.'
            },
            languageUsed: {
              type: Type.STRING,
              description: 'One of: english, swahili, sheng_blended.'
            },
            extractedFeedbackInsight: {
              type: Type.STRING,
              description: 'Developmental observation or state worth storing in long-term memory (e.g. child tired today, singing Swahili songs, mastered puzzle alone), or empty string if trivial.'
            },
            feedbackCategory: {
              type: Type.STRING,
              description: 'One of: milestone, sensory, speech, motor, emotional, concern, general.'
            },
            milestoneAchieved: {
              type: Type.STRING,
              description: 'Title of any milestone achieved/emerging, or empty string.'
            },
            recommendationSource: {
              type: Type.STRING,
              description: 'One of: clinical_library, adapted_household_resources, creative_everyday_activity, none.'
            },
            suggestedActivityTitle: {
              type: Type.STRING,
              description: 'Title of activity suggested in reply (if any), or empty string.'
            },
            suggestedActivityDomain: {
              type: Type.STRING,
              description: 'Domain (reading, spelling, drawing, sensory_play, singing, motor), or empty string.'
            },
            suggestedActivitySteps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Short steps if an activity was suggested, otherwise empty array.'
            },
            resourcesUsed: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Household or local resources used in the suggested activity.'
            },
            therapistEscalation: {
              type: Type.BOOLEAN,
              description: 'True ONLY if a specialist consultation should be offered/scheduled based on this turn.'
            },
            therapistRecommendationReason: {
              type: Type.STRING,
              description: 'Reason for therapist escalation, or empty string.'
            },
            suggestedTherapistName: {
              type: Type.STRING,
              description: 'Matched therapist name from directory if escalated, or empty string.'
            },
            adminAlertTriggered: {
              type: Type.BOOLEAN,
              description: 'True if [ALERT_ADMIN] should be triggered.'
            }
          },
          required: ['replyMessageText', 'intent', 'caregiverMode', 'languageUsed']
        }
      }
    });

    let parsed: any = {};
    try {
      parsed = JSON.parse(stripJsonFences(rawJsonText));
    } catch {
      // If model ever returned non-JSON text, ask cleanly for plain text reply instead of falling back to canned strings
      replyText = rawJsonText.trim();
    }

    if (parsed.replyMessageText) {
      replyText = parsed.replyMessageText;
    }

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

      const newObs: ObservationFeedback = {
        id: 'obs_' + Date.now(),
        childId: child.id,
        timestamp: new Date().toISOString(),
        rawParentMessage: incomingText,
        category: (parsed.feedbackCategory as any) || 'general',
        insightSummary: parsed.extractedFeedbackInsight,
        developmentalImpact: parsed.milestoneAchieved
          ? `Milestone progressed: ${parsed.milestoneAchieved}`
          : 'Stored in long-term caregiver memory to guide upcoming conversations & specialist reports.',
        detectedEmotion:
          parsed.caregiverMode === 'celebration'
            ? 'celebratory'
            : parsed.caregiverMode === 'caregiver_rest'
            ? 'exhausted'
            : 'calm'
      };
      globalDataStore.addObservation(newObs);

      if (parsed.milestoneAchieved && parsed.milestoneAchieved.trim().length > 0) {
        const existingMilestone = child.currentMilestones.find(m =>
          m.title.toLowerCase().includes(parsed.milestoneAchieved.toLowerCase())
        );
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

    if (parsed.suggestedActivityTitle && parsed.suggestedActivityTitle.trim().length > 0) {
      analysis.recommendationBrain.recommendationSource = parsed.recommendationSource || 'creative_everyday_activity';
      analysis.recommendationBrain.suggestedActivity = {
        title: parsed.suggestedActivityTitle,
        domain: parsed.suggestedActivityDomain || 'play',
        stepByStep: parsed.suggestedActivitySteps || [],
        parentTip: 'Adapted to child profile, goals, and available home resources.',
        resourcesUsed: parsed.resourcesUsed || []
      };
    } else {
      analysis.recommendationBrain.recommendationSource = 'none';
    }

    if (parsed.therapistEscalation) {
      const recTherapist = parsed.suggestedTherapistName || 'Dr. Wanjiku Mwangi, OTR/L';
      const sessionTopic = parsed.therapistRecommendationReason || 'Targeted Developmental / Sensory Consultation';
      analysis.escalationBrain.therapistEscalationTriggered = true;
      analysis.escalationBrain.recommendedTherapistName = recTherapist;
      analysis.escalationBrain.scheduledSessionTopic = sessionTopic;

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
        sessionTopic,
        status: 'scheduled',
        notes: `Escalated via Kinda Care WhatsApp companion: ${sessionTopic}`
      };
      globalDataStore.addAppointment(appt);
    }

    analysis.conversationBrain.detectedIntent = parsed.intent || 'Contextual conversation';
    analysis.conversationBrain.caregiverTone = parsed.caregiverTone || (isCaregiverExhausted ? 'Tired' : 'Engaged');
    analysis.conversationBrain.caregiverMode = parsed.caregiverMode || 'standard';
    analysis.conversationBrain.culturalContext = parsed.languageUsed || 'english';
  } catch (error: any) {
    console.error('[Gemini Service Error]', error?.message || error);

    // Second chance: Plain-text conversational call without structured JSON schema
    try {
      const plainText = await callGeminiWithRetry({
        contents: conversationTurns,
        config: {
          systemInstruction: `${systemInstruction}\n\nRespond directly as a warm WhatsApp text reply to the parent's latest message.`
        }
      });
      replyText = plainText.trim();
    } catch (plainErr: any) {
      console.error('[Gemini Plain Fallback Error]', plainErr?.message || plainErr);
      // Only reached if API key is missing/invalid or network is completely unreachable
      if (isCaregiverExhausted || /\btomorrow\b/i.test(incomingText)) {
        replyText = `Pole sana, ${child.caregiverName}. Completely understood—let's rest today and pick things up gently tomorrow when you and ${child.name} have fresh energy. 💙`;
        analysis.conversationBrain.caregiverMode = 'caregiver_rest';
      } else if (directAdminAlert) {
        replyText = `Let me check that with our care coordinator right away so we can help you properly.\n\n[ALERT_ADMIN]`;
        analysis.escalationBrain.adminAlertTriggered = true;
      } else {
        throw new Error(`Unable to reach Gemini AI service: ${plainErr?.message || 'Unknown API error'}`);
      }
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

export async function generateOrganicCheckIn(
  childId: string,
  triggerType: 'quiet_parent_checkin' | 'organic_random_checkin'
): Promise<ChatMessage> {
  const child = globalDataStore.getChild(childId);
  if (!child) throw new Error('Child not found');

  const history = globalDataStore.getMessages(childId);
  const observations = globalDataStore.getObservations(childId);
  const { ragMaterials, contextBlock } = buildChildContextBlock(child, observations, child.favoriteActivities.join(' '));

  const scenarioPrompt =
    triggerType === 'quiet_parent_checkin'
      ? `The parent (${child.caregiverName}) has gone quiet for 3-4 days since your last conversation. Craft ONE warm, short, pressure-free WhatsApp check-in referencing something natural from their last conversation or ${child.name}'s profile. Do not sound like an automated alarm or guilt-trip them.`
      : `Send ONE spontaneous, emotionally varied, warm WhatsApp check-in to ${child.caregiverName} about ${child.name}. You might playfully ask how a home activity went using what they have at home (${(child.availableResources || []).join(', ')}), or simply check in on how ${child.caregiverName} herself is holding up today.`;

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
        systemInstruction: `You are Kinda Care AI, a warm Kenyan OT caregiver companion on WhatsApp. Return ONLY the WhatsApp message text (2-3 sentences max, warm, culturally natural, no quotes around the message).\n${contextBlock}`
      }
    });
    nudgeText = raw.trim().replace(/^["']|["']$/g, '');
  } catch (err) {
    console.warn('[Organic CheckIn fallback]', err);
    nudgeText =
      triggerType === 'quiet_parent_checkin'
        ? `Habari ${child.caregiverName}! It's been a few quiet days and I was just thinking about you and ${child.name}. No pressure at all—just checking how you're both doing this week? 💙`
        : `Hey ${child.caregiverName}! Hope today is treating you kindly. Has ${child.name} shown any funny little moments or new curiosity around the house lately?`;
  }

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
        detectedIntent: triggerType === 'quiet_parent_checkin' ? 'Re-engage after multi-day silence' : 'Spontaneous organic warmth check-in',
        caregiverTone: 'Warm & pressure-free',
        caregiverMode: 'standard',
        culturalContext: 'sheng_blended'
      },
      memoryBrain: {
        childId: child.id,
        childName: child.name,
        recalledMemories: child.strengths.concat(child.sensitivities)
      },
      recommendationBrain: {
        ragMaterialsRetrieved: ragMaterials.slice(0, 1).map(m => ({
          id: m.id,
          title: m.title,
          domain: m.domain,
          relevanceScore: 0.85
        })),
        recommendationSource: 'creative_everyday_activity'
      },
      engagementBrain: {
        nudgeType: triggerType,
        nudgeText,
        emotionalWarmthRating: 9
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

  const msgs = globalDataStore.getMessages(childId);
  const obs = globalDataStore.getObservations(childId);

  try {
    const rawJson = await callGeminiWithRetry({
      contents: `Analyze this child's complete longitudinal log and synthesize a clinical progress report for Kinda Care's internal team and external specialists.\n\nChild: ${child.name} (${baseReport.age})\nStage: ${child.developmentalStage}\nSensitivities: ${child.sensitivities.join(', ')}\nAvailable Home Resources: ${(child.availableResources || []).join(', ')}\n\nParent Observations:\n${obs.map(o => `- [${o.timestamp.slice(0, 10)}] "${o.rawParentMessage}" (${o.category})`).join('\n')}\n\nRecent Conversation History:\n${msgs.slice(-15).map(m => `${m.sender}: ${m.text}`).join('\n')}`,
      config: {
        systemInstruction: 'You are a pediatric Occupational Therapist / Developmental Coordinator synthesizing an internal clinical progress report for specialists. Be accurate, grounded strictly in the logged messages and observations.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            clinicalTherapistSummary: { type: Type.STRING },
            upcomingMissionGoals: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ['clinicalTherapistSummary', 'upcomingMissionGoals']
        }
      }
    });

    const parsed = JSON.parse(stripJsonFences(rawJson));
    if (parsed.clinicalTherapistSummary) {
      baseReport.clinicalTherapistSummary = parsed.clinicalTherapistSummary;
    }
    if (Array.isArray(parsed.upcomingMissionGoals) && parsed.upcomingMissionGoals.length > 0) {
      baseReport.upcomingMissionGoals = parsed.upcomingMissionGoals;
    }
  } catch (err) {
    console.warn('[Report synthesis fallback to deterministic summary]', err);
  }

  return baseReport;
}
