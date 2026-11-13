/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from '@google/genai';
import { SentimentAnalysisResult } from '../types';

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

const SENTIMENT_MODEL = 'gemini-3.1-flash-lite';

function buildToneDirective(
  sentiment: SentimentAnalysisResult['sentiment'],
  stressLevel: SentimentAnalysisResult['stressLevel']
): {
  recommendedAiTone: SentimentAnalysisResult['recommendedAiTone'];
  toneDirective: string;
} {
  switch (sentiment) {
    case 'exhausted':
    case 'stressed_overwhelmed':
      return {
        recommendedAiTone: 'deeply_supportive_and_gentle',
        toneDirective:
          `Parent stress level is ${stressLevel.toUpperCase()} (${sentiment.replace('_', ' ')}). Use a deeply supportive, unhurried, and compassionate tone. Validate their emotional load first, keep your reply brief and soothing, and do NOT assign developmental homework or pressure them to do an activity.`
      };
    case 'anxious_worried':
      return {
        recommendedAiTone: 'warm_reassuring_and_calming',
        toneDirective:
          'Parent expresses worry or uncertainty. Adopt a warm, steady, reassuring OT-specialist tone. Normalize their concern gently, offer clear grounding perspective without medical alarmism, and ask one caring check-in question.'
      };
    case 'frustrated':
      return {
        recommendedAiTone: 'patient_and_deescalating',
        toneDirective:
          'Parent sounds frustrated or discouraged. Use a patient, validating, non-judgmental tone. Acknowledge why the moment is tough, lower expectations gently, and suggest only a tiny, low-friction shift if appropriate.'
      };
    case 'celebratory':
      return {
        recommendedAiTone: 'enthusiastic_and_celebratory',
        toneDirective:
          'Parent is sharing a proud win or developmental milestone! Adopt an enthusiastic, celebratory, genuinely joyful tone. Mirror their excitement, name specifically why the milestone matters developmentally, and celebrate their role as caregiver.'
      };
    case 'calm_positive':
      return {
        recommendedAiTone: 'warm_and_encouraging',
        toneDirective:
          'Parent is calm and positively engaged. Use a warm, encouraging, conversational tone with light playful energy suited to collaborative coaching.'
      };
    default:
      return {
        recommendedAiTone: 'neutral_conversational',
        toneDirective:
          'Parent sentiment is neutral/informational. Respond with a warm, attentive, conversational specialist tone directly addressing their question or update.'
      };
  }
}

function heuristicSentimentFallback(messageText: string): SentimentAnalysisResult {
  const lower = messageText.toLowerCase();

  if (/\b(exhausted|tired|burned out|overwhelmed|stressed|hard day|can'?t cope|too much|nimechoka|tumechoka|imelemea|ni ngumu)\b/i.test(lower)) {
    const isExhausted = /\b(exhausted|tired|nimechoka|tumechoka)\b/i.test(lower);
    const sentiment: SentimentAnalysisResult['sentiment'] = isExhausted ? 'exhausted' : 'stressed_overwhelmed';
    const { recommendedAiTone, toneDirective } = buildToneDirective(sentiment, 'high');
    return {
      sentiment,
      polarityScore: -0.65,
      stressLevel: 'high',
      confidence: 0.85,
      emotionalCues: ['Caregiver fatigue or stress expression detected'],
      recommendedAiTone,
      toneDirective
    };
  }

  if (/\b(worried|anxious|scared|afraid|concerned|not improving|regression|wasiwasi|naogopa)\b/i.test(lower)) {
    const { recommendedAiTone, toneDirective } = buildToneDirective('anxious_worried', 'moderate');
    return {
      sentiment: 'anxious_worried',
      polarityScore: -0.45,
      stressLevel: 'moderate',
      confidence: 0.82,
      emotionalCues: ['Caregiver worry or concern detected'],
      recommendedAiTone,
      toneDirective
    };
  }

  if (/\b(frustrated|angry|annoyed|nothing works|refuses|hate this|gave up|nimekasirika)\b/i.test(lower)) {
    const { recommendedAiTone, toneDirective } = buildToneDirective('frustrated', 'high');
    return {
      sentiment: 'frustrated',
      polarityScore: -0.55,
      stressLevel: 'high',
      confidence: 0.8,
      emotionalCues: ['Frustration or discouragement detected'],
      recommendedAiTone,
      toneDirective
    };
  }

  if (/\b(alone|by himself|by herself|complete words|finally|did it|breakthrough|proud|amazing|happy|excited|yay|🎉|🎶|🌟|furaha|ameweza)\b/i.test(lower)) {
    const { recommendedAiTone, toneDirective } = buildToneDirective('celebratory', 'low');
    return {
      sentiment: 'celebratory',
      polarityScore: 0.85,
      stressLevel: 'low',
      confidence: 0.88,
      emotionalCues: ['Milestone win or joyful pride detected'],
      recommendedAiTone,
      toneDirective
    };
  }

  if (/\b(calm|enjoying|good|better|great|thanks|asante|sawa|poa)\b/i.test(lower)) {
    const { recommendedAiTone, toneDirective } = buildToneDirective('calm_positive', 'low');
    return {
      sentiment: 'calm_positive',
      polarityScore: 0.5,
      stressLevel: 'low',
      confidence: 0.78,
      emotionalCues: ['Calm or positive engagement'],
      recommendedAiTone,
      toneDirective
    };
  }

  const { recommendedAiTone, toneDirective } = buildToneDirective('neutral', 'low');
  return {
    sentiment: 'neutral',
    polarityScore: 0.05,
    stressLevel: 'low',
    confidence: 0.72,
    emotionalCues: ['Informational or neutral check-in'],
    recommendedAiTone,
    toneDirective
  };
}

export async function analyzeParentSentiment(
  messageText: string,
  recentConversationSnippet?: string
): Promise<SentimentAnalysisResult> {
  if (!process.env.GEMINI_API_KEY) {
    return heuristicSentimentFallback(messageText);
  }

  try {
    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: SENTIMENT_MODEL,
      contents: `Analyze the emotional sentiment, stress level, and tone needs of this incoming WhatsApp message from a Kenyan parent/caregiver.\n\nRecent Context:\n${recentConversationSnippet || 'None'}\n\nIncoming Parent Message:\n"${messageText}"`,
      config: {
        systemInstruction: `You are a pediatric clinical sentiment analyzer specializing in parent/caregiver emotional states across English, Swahili, and Kenyan Sheng.
Classify the parent's sentiment accurately:
- "celebratory": sharing a child's milestone, breakthrough, pride, or exciting progress (e.g. completing a puzzle alone, singing full words, joyful news).
- "exhausted": expressing physical or mental tiredness/fatigue (e.g. "I'm tired", "exhausted", "nimechoka", postponing due to fatigue).
- "stressed_overwhelmed": expressing stress, burnout, feeling overwhelmed by parenting or daily life.
- "anxious_worried": expressing fear, worry, or anxiety about their child's development or behavior.
- "frustrated": expressing anger, annoyance, or defeat (e.g. "nothing works", "he keeps refusing").
- "calm_positive": calm, appreciative, hopeful, or relaxed sharing.
- "neutral": purely informational question, simple correction ("sorry i meant joash"), or scheduling reply.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sentiment: {
              type: Type.STRING,
              description: 'One of: celebratory, stressed_overwhelmed, exhausted, anxious_worried, frustrated, calm_positive, neutral'
            },
            polarityScore: {
              type: Type.NUMBER,
              description: 'Sentiment polarity from -1.0 (very distressed/stressed) to 1.0 (very joyful/celebratory).'
            },
            stressLevel: {
              type: Type.STRING,
              description: 'One of: low, moderate, high'
            },
            confidence: {
              type: Type.NUMBER,
              description: 'Confidence score between 0.0 and 1.0.'
            },
            emotionalCues: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Short 2-5 word phrases citing the emotional cues found in the message.'
            }
          },
          required: ['sentiment', 'polarityScore', 'stressLevel', 'confidence', 'emotionalCues']
        }
      }
    });

    const raw = (response.text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const parsed = JSON.parse(raw);

    const allowedSentiments: SentimentAnalysisResult['sentiment'][] = [
      'celebratory',
      'stressed_overwhelmed',
      'exhausted',
      'anxious_worried',
      'frustrated',
      'calm_positive',
      'neutral'
    ];
    const sentiment: SentimentAnalysisResult['sentiment'] = allowedSentiments.includes(parsed.sentiment)
      ? parsed.sentiment
      : 'neutral';

    const stressLevel: SentimentAnalysisResult['stressLevel'] =
      parsed.stressLevel === 'high' || parsed.stressLevel === 'moderate' ? parsed.stressLevel : 'low';

    const { recommendedAiTone, toneDirective } = buildToneDirective(sentiment, stressLevel);

    return {
      sentiment,
      polarityScore: Math.max(-1, Math.min(1, Number(parsed.polarityScore) || 0)),
      stressLevel,
      confidence: Math.max(0, Math.min(1, Number(parsed.confidence) || 0.85)),
      emotionalCues: Array.isArray(parsed.emotionalCues) ? parsed.emotionalCues.slice(0, 4) : [],
      recommendedAiTone,
      toneDirective
    };
  } catch (err: any) {
    console.warn('[Sentiment Analyzer fallback]:', err?.message || err);
    return heuristicSentimentFallback(messageText);
  }
}
