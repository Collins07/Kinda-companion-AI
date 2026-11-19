/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChildProfile,
  DetectedMilestoneRecord,
  IndependenceLevel,
  MilestoneDomain
} from '../types';
import { resolveReportedDate } from './metaCompliance';

export interface MilestoneScanCandidate {
  record: DetectedMilestoneRecord;
  isImportantChildObservation: boolean;
}

const HIGH_SIGNAL_INDEPENDENCE_RE =
  /\b(herself|himself|by (her|him)self|on (her|his) own|without (any )?help|without assistance|all alone|did (it|the .+) alone|completed .+ alone|alone today|seamlessly|peke yake|bila msaada|mwenyewe)\b/i;

const HIGH_SIGNAL_FIRSTS_RE =
  /\b(first time|for the first time|mara ya kwanza|brand new word|spoke (her|his) first|took (her|his) first)\b/i;

const HIGH_SIGNAL_BREAKTHROUGH_RE =
  /\b(finally|managed to|like a switch|suddenly|out of nowhere|hatimaye|ameweza|aliweza|ghafla|nailed it|mastered)\b/i;

const ASSISTED_CUES_RE =
  /\b(with (my )?help|assisted|hand[- ]over[- ]hand|guided (her|him)|needed help|held (her|his) hand|na msaada|nikimsaidia)\b/i;

const PARTIAL_CUES_RE =
  /\b(a little help|some help|almost alone|mostly on (her|his) own|tried with|with minimal help|kidogo peke yake|karibu peke yake)\b/i;

const NEGATION_CUES_RE =
  /\b(not yet|hasn'?t|haven'?t|didn'?t|couldn'?t|cannot|can'?t|refused to|still won'?t|unable to|failed to|bado ha|hakuweza|hajafanya|hataki)\b/i;

const AMBIGUOUS_CUES_RE =
  /\b(maybe|not sure if|i think maybe|kind of|hard to tell|half and half|cjui kama|sijui kama)\b/i;

const DOMAIN_RULES: Array<{ domain: MilestoneDomain; pattern: RegExp; skillHints: Array<[RegExp, string]> }> = [
  {
    domain: 'cognitive',
    pattern:
      /\b(puzzle|sort|sorting|match|matching|sequenc|count|counting|shape|shapes|pattern|memory|problem[- ]?solv|categoriz|stacked? cups|blocks)\b/i,
    skillHints: [
      [/puzzle/i, 'puzzle_completion'],
      [/sort|categoriz/i, 'object_sorting'],
      [/match/i, 'shape_color_matching'],
      [/sequenc|pattern/i, 'sequencing_patterns'],
      [/count/i, 'counting_numeracy'],
      [/stack|block|cup/i, 'cup_block_stacking']
    ]
  },
  {
    domain: 'sensory',
    pattern:
      /\b(red tile|red color|red colour|bright color|texture|textures|sand|flour|paint|loud|noise|sound|blender|touched|tolerat|accepted|didn'?t pull away|didn'?t push away|kept playing near)\b/i,
    skillHints: [
      [/red|color|colour|tile/i, 'color_visual_tolerance'],
      [/texture|sand|flour|paint|wet|sticky/i, 'tactile_texture_tolerance'],
      [/noise|sound|loud|blender/i, 'auditory_sound_tolerance']
    ]
  },
  {
    domain: 'speech',
    pattern:
      /\b(word|words|phrase|sentence|sang|singing|song|said|spoke|talk|talking|ask|asked|request|requested|gestur|point|pointing|picture exchange|pecs|called|answered|named|maneno|aliimba|alisema)\b/i,
    skillHints: [
      [/sing|sang|song|aliimba/i, 'singing_complete_words'],
      [/phrase|sentence/i, 'multi_word_phrases'],
      [/word|said|spoke|talk|maneno|alisema/i, 'expressive_words'],
      [/gestur|point|picture/i, 'gestures_picture_communication'],
      [/request|ask/i, 'functional_requesting']
    ]
  },
  {
    domain: 'motor',
    pattern:
      /\b(grip|crayon|pencil|draw|drew|trace|traced|cut|scissors|climb|climbed|walk|walked|run|ran|jump|jumped|throw|caught|catch|kick|kicked|balance|coordinat|picked up|beads|button|spoon hold)\b/i,
    skillHints: [
      [/grip|crayon|pencil|draw|trace/i, 'fine_motor_grip_drawing'],
      [/climb|jump|walk|run|balance/i, 'gross_motor_mobility'],
      [/throw|catch|kick/i, 'ball_motor_coordination'],
      [/bead|button|pinch|pick/i, 'bilateral_finger_coordination']
    ]
  },
  {
    domain: 'social',
    pattern:
      /\b(turn[- ]taking|took turns|my turn|shared|sharing|eye contact|looked at me|joint attention|smiled back|played with (another|other|sibling|friend)|calm(ed)? down together|co-?regulat|waited (her|his) turn|alicheza na)\b/i,
    skillHints: [
      [/turn/i, 'turn_taking'],
      [/eye contact|looked at me|joint attention/i, 'joint_attention_eye_contact'],
      [/shar/i, 'peer_sibling_sharing'],
      [/calm|regulat/i, 'co_regulation_calming']
    ]
  },
  {
    domain: 'independence',
    pattern:
      /\b(dress|dressed|dressing|shirt|shoes|socks|fed (her|him)self|ate (alone|by |on (her|his) own|without help)|drink(ing)? from cup|toilet|potty|washed (her|his) hands|brushed (her|his) teeth|alivaa|alikula|choo)\b/i,
    skillHints: [
      [/dress|shirt|shoes|socks|alivaa/i, 'independent_dressing'],
      [/fed|ate|eat|drink|cup|alikula/i, 'independent_feeding'],
      [/toilet|potty|choo/i, 'toileting_routine'],
      [/wash|brush/i, 'personal_hygiene_self_care']
    ]
  }
];

export function normalizeSkillKey(domain: MilestoneDomain, text: string, fallbackLabel?: string): string {
  const combined = `${fallbackLabel || ''} ${text}`.toLowerCase();
  const domainCfg = DOMAIN_RULES.find(r => r.domain === domain);
  if (domainCfg) {
    for (const [re, key] of domainCfg.skillHints) {
      if (re.test(combined)) return `${domain}:${key}`;
    }
  }
  const cleanTokens = (fallbackLabel || text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 3 && !['the', 'and', 'with', 'she', 'him', 'her', 'his', 'did', 'today', 'yesterday', 'alone', 'finally', 'first', 'time', 'nancy', 'john', 'stacy'].includes(w))
    .slice(0, 4);
  return `${domain}:${cleanTokens.join('_') || 'general_skill'}`;
}

export function inferDomainFromText(text: string): MilestoneDomain {
  for (const rule of DOMAIN_RULES) {
    if (rule.pattern.test(text)) {
      return rule.domain;
    }
  }
  return 'cognitive';
}

export function inferIndependenceLevel(text: string): IndependenceLevel {
  if (HIGH_SIGNAL_INDEPENDENCE_RE.test(text) && !PARTIAL_CUES_RE.test(text) && !ASSISTED_CUES_RE.test(text)) {
    return 'independent';
  }
  if (PARTIAL_CUES_RE.test(text)) {
    return 'partial';
  }
  if (ASSISTED_CUES_RE.test(text)) {
    return 'assisted';
  }
  // If breakthrough / first time without noting assistance, default to independent unless assisted stated
  if (HIGH_SIGNAL_FIRSTS_RE.test(text) || HIGH_SIGNAL_BREAKTHROUGH_RE.test(text)) {
    return 'independent';
  }
  return 'partial';
}

export function isImportantChildObservationText(text: string, childName: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;
  const lower = trimmed.toLowerCase();

  // Exclude pure scheduling/meta logistics or greetings
  if (
    /^(hi|hello|hey|habari|mambo|ok|okay|sawa|asante|thanks|thank you|yes|no|yes, i consent|ndio)\b[!.]*$/i.test(lower)
  ) {
    return false;
  }
  if (/^\s*(can i book|i need a therapist|schedule a therapist|when is the appointment)\b/i.test(lower)) {
    return false;
  }

  // Child behavioral/skill/preference/trigger/routine signals
  const childSignals =
    new RegExp(`\\b(${childName.toLowerCase()}|he|she|him|her|child|mtoto|ali|ana)\\b`, 'i').test(lower) ||
    DOMAIN_RULES.some(r => r.pattern.test(lower)) ||
    HIGH_SIGNAL_INDEPENDENCE_RE.test(lower) ||
    HIGH_SIGNAL_FIRSTS_RE.test(lower) ||
    HIGH_SIGNAL_BREAKTHROUGH_RE.test(lower) ||
    /\b(cry|cried|tantrum|sleep|slept|ate|eat|calm|enjoy|afraid|scared|tired|restless|happy|laughed|sang|played|refused)\b/i.test(lower);

  return childSignals;
}

export function detectInterventionReference(
  text: string,
  child: ChildProfile
): { interventionRef: string | null; isSuccessOutcome: boolean } {
  const lower = text.toLowerCase();
  const pending = child.lastSuggestedProtocol;
  const mentionsOutcome =
    /\b(tried|did (the|that|your)|worked|went well|enjoyed|succeeded|completed|finished|managed|alifanya|imefanya kazi|ilifanya kazi|tumejaribu)\b/i.test(
      lower
    ) && !NEGATION_CUES_RE.test(lower);

  if (pending && (pending.status === 'pending_feedback' || mentionsOutcome)) {
    const titleWords = pending.title
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(w => w.length >= 4);
    const matchesPendingTopic =
      titleWords.some(w => lower.includes(w)) ||
      /\b(the activity|that activity|the game|that exercise|your suggestion|what you suggested|protocol)\b/i.test(lower);

    if (matchesPendingTopic && mentionsOutcome) {
      return {
        interventionRef: pending.cardId || pending.title,
        isSuccessOutcome: true
      };
    }
  }

  if (/\b(therapist|specialist|ot|doctor|dr\.?\s*wanjiku|brian|faith)\b/i.test(lower) && mentionsOutcome) {
    return {
      interventionRef: 'specialist_recommended_activity',
      isSuccessOutcome: true
    };
  }

  return { interventionRef: null, isSuccessOutcome: false };
}

export function scanCaregiverMessageForMilestones(params: {
  child: ChildProfile;
  incomingText: string;
  messageId: string;
  modelProposals?: Array<{
    fact?: string;
    domain?: string;
    evidence_quote?: string;
    status?: string;
    confidence?: number;
    needs_confirmation?: boolean;
    skill_summary?: string;
    independence_level?: string;
    reported_date?: string;
    is_milestone?: boolean;
    is_intervention_outcome?: boolean;
    needs_review?: boolean;
  }>;
  referenceNow?: Date;
}): {
  milestones: DetectedMilestoneRecord[];
  ambiguousForSilentReview: DetectedMilestoneRecord[];
} {
  const { child, incomingText, messageId, modelProposals = [], referenceNow = new Date() } = params;
  const trimmed = incomingText.trim();
  const { isoDate: resolvedIsoDate, displayDate: resolvedDisplayDate } = resolveReportedDate(trimmed, referenceNow);
  const { interventionRef, isSuccessOutcome } = detectInterventionReference(trimmed, child);

  const hasIndependenceCue = HIGH_SIGNAL_INDEPENDENCE_RE.test(trimmed);
  const hasFirstsCue = HIGH_SIGNAL_FIRSTS_RE.test(trimmed);
  const hasBreakthroughCue = HIGH_SIGNAL_BREAKTHROUGH_RE.test(trimmed);
  const hasNegation = NEGATION_CUES_RE.test(trimmed);
  const isAmbiguousWording = AMBIGUOUS_CUES_RE.test(trimmed);

  const milestones: DetectedMilestoneRecord[] = [];
  const ambiguousForSilentReview: DetectedMilestoneRecord[] = [];

  const validDomains: MilestoneDomain[] = ['cognitive', 'motor', 'speech', 'sensory', 'social', 'independence'];

  // 1. Check high-signal deterministic milestone cues across clauses (confidence >= 0.9)
  const clauses = trimmed
    .split(/(?:\s+(?:and also|plus|then she|then he|pia)\s+|[.;]\s+)/i)
    .map(c => c.trim())
    .filter(c => c.length >= 6);
  const scanUnits = clauses.length > 1 ? clauses : [trimmed];
  const seenDomainsInTurn = new Set<string>();

  for (const unit of scanUnits) {
    const unitIndep = HIGH_SIGNAL_INDEPENDENCE_RE.test(unit);
    const unitFirst = HIGH_SIGNAL_FIRSTS_RE.test(unit);
    const unitBreak = HIGH_SIGNAL_BREAKTHROUGH_RE.test(unit);
    const unitNeg = NEGATION_CUES_RE.test(unit);
    const unitAmbig = AMBIGUOUS_CUES_RE.test(unit);
    const unitOutcome = unit === trimmed ? isSuccessOutcome : detectInterventionReference(unit, child).isSuccessOutcome;

    if (!unitNeg && (unitIndep || unitFirst || unitBreak || unitOutcome)) {
      const inferredDomain = inferDomainFromText(unit);
      if (seenDomainsInTurn.has(inferredDomain)) continue;
      seenDomainsInTurn.add(inferredDomain);

      const matchingModelProp = modelProposals.find(
        p => (p.domain === inferredDomain && (p.fact || p.skill_summary)) || (scanUnits.length === 1 && (p.fact || p.skill_summary))
      );
      const domain: MilestoneDomain =
        matchingModelProp?.domain && validDomains.includes(matchingModelProp.domain as MilestoneDomain)
          ? (matchingModelProp.domain as MilestoneDomain)
          : inferredDomain;

      const quote =
        scanUnits.length === 1 &&
        matchingModelProp?.evidence_quote &&
        trimmed.toLowerCase().includes(matchingModelProp.evidence_quote.trim().toLowerCase())
          ? matchingModelProp.evidence_quote.trim()
          : unit;

      const independenceLevel = inferIndependenceLevel(unit);
      const summary =
        matchingModelProp?.skill_summary ||
        matchingModelProp?.fact ||
        unit.slice(0, 110);

      const unitIntervention =
        unit === trimmed ? { interventionRef, isSuccessOutcome } : detectInterventionReference(unit, child);

      const record: DetectedMilestoneRecord = {
        id: 'ms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        child_id: child.id,
        domain,
        skillKey: normalizeSkillKey(domain, unit, summary),
        skillSummary: summary,
        milestone: true,
        verbatim_quote: quote,
        reported_date: resolvedIsoDate,
        reportedDateDisplay: resolvedDisplayDate,
        independence_level: independenceLevel,
        intervention_ref: unitIntervention.interventionRef,
        is_intervention_outcome: unitIntervention.isSuccessOutcome,
        is_progression: false,
        confidence: unitAmbig || isAmbiguousWording ? 0.72 : 0.94,
        needs_review: unitAmbig || isAmbiguousWording,
        message_id: messageId,
        createdAt: referenceNow.toISOString()
      };

      if (record.needs_review) {
        ambiguousForSilentReview.push(record);
      } else {
        milestones.push(record);
      }
    }
  }

  if (milestones.length > 0 || ambiguousForSilentReview.length > 0) {
    return { milestones, ambiguousForSilentReview };
  }

  // 2. Otherwise inspect Gemini structured detections (catches subtle gains without fixed keywords)
  for (const prop of modelProposals) {
    if (!prop) continue;
    const flaggedMilestone = prop.is_milestone === true || prop.status === 'milestone';
    if (!flaggedMilestone && !isSuccessOutcome) continue;

    const domain: MilestoneDomain =
      prop.domain && validDomains.includes(prop.domain as MilestoneDomain)
        ? (prop.domain as MilestoneDomain)
        : inferDomainFromText(trimmed);

    const quote =
      prop.evidence_quote && trimmed.toLowerCase().includes(prop.evidence_quote.trim().toLowerCase())
        ? prop.evidence_quote.trim()
        : trimmed;

    const summary = prop.skill_summary || prop.fact || trimmed.slice(0, 110);
    const confidence = Number(prop.confidence) || 0.85;
    const needsReview = Boolean(prop.needs_review || prop.needs_confirmation || isAmbiguousWording || confidence < 0.7);

    const indep: IndependenceLevel =
      prop.independence_level === 'assisted' ||
      prop.independence_level === 'partial' ||
      prop.independence_level === 'independent'
        ? prop.independence_level
        : inferIndependenceLevel(trimmed);

    const reportedIso =
      prop.reported_date && /^\d{4}-\d{2}-\d{2}$/.test(prop.reported_date)
        ? prop.reported_date
        : resolvedIsoDate;

    const record: DetectedMilestoneRecord = {
      id: 'ms_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      child_id: child.id,
      domain,
      skillKey: normalizeSkillKey(domain, trimmed, summary),
      skillSummary: summary,
      milestone: true,
      verbatim_quote: quote,
      reported_date: reportedIso,
      reportedDateDisplay: resolvedDisplayDate,
      independence_level: indep,
      intervention_ref: interventionRef,
      is_intervention_outcome: Boolean(prop.is_intervention_outcome || isSuccessOutcome),
      is_progression: false,
      confidence,
      needs_review: needsReview,
      message_id: messageId,
      createdAt: referenceNow.toISOString()
    };

    if (needsReview) {
      ambiguousForSilentReview.push(record);
    } else {
      milestones.push(record);
    }
  }

  return { milestones, ambiguousForSilentReview };
}
