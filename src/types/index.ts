/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MilestoneDomain =
  | 'cognitive'
  | 'motor'
  | 'speech'
  | 'sensory'
  | 'social'
  | 'independence';

export type IndependenceLevel = 'assisted' | 'partial' | 'independent';

export interface DetectedMilestoneRecord {
  id: string;
  child_id: string;
  domain: MilestoneDomain;
  skillKey: string;
  skillSummary: string;
  milestone: true;
  verbatim_quote: string;
  reported_date: string; // YYYY-MM-DD
  reportedDateDisplay: string; // e.g. "Nov 14, 2026"
  independence_level: IndependenceLevel;
  intervention_ref: string | null;
  is_intervention_outcome: boolean;
  is_progression: boolean;
  progression_note?: string;
  confidence: number;
  needs_review: boolean;
  message_id: string;
  createdAt: string;
}

export interface ChildProfile {
  id: string;
  name: string;
  caregiverName: string; // e.g. "Mama Nancy"
  caregiverPhone: string; // e.g. "+254711223344"
  ageMonths: number;
  gender: 'boy' | 'girl' | 'other';
  developmentalStage: string;
  strengths: string[];
  sensitivities: string[]; // External stimuli/triggers ONLY (e.g. "loud sudden blender noises", "direct questioning")
  currentMilestones: {
    domain: MilestoneDomain;
    title: string;
    skillKey?: string;
    independenceLevel?: IndependenceLevel;
    status: 'in_progress' | 'achieved' | 'emerging';
    updatedAt: string;
  }[];
  favoriteActivities: string[];
  activeKit?: string;
  environmentContext?: string;
  availableResources?: string[];
  subscriptionTier: 'free' | 'premium';
  subscriptionExpiry?: string;
  mpesaPhone?: string;
  nudgesOptedOut?: boolean;
  lastSuggestedProtocol?: {
    cardId: string;
    title: string;
    domain: string;
    suggestedAt: string;
    status: 'pending_feedback' | 'completed' | 'needs_retry' | 'skipped';
  };
  odpcConsent: {
    granted: boolean;
    grantedAt?: string;
    parentConfirmedIdentity: boolean;
    consentVersion: string;
    consentScope: string;
  };
  notes: string;
}

export interface ProfileUpdateProposal {
  fact: string;
  domain: MilestoneDomain | 'routine' | 'general';
  evidence_quote: string;
  status: 'new' | 'update' | 'contradiction' | 'milestone';
  confidence: number;
  needs_confirmation: boolean;
  clarifying_question?: string;
}

export interface ObservationFeedback {
  id: string;
  childId: string;
  timestamp: string;
  reportedDate?: string; // YYYY-MM-DD (handles retrospective cues like "yesterday" / "jana")
  reportedDateDisplay?: string; // e.g. "Nov 14, 2026"
  rawParentMessage: string;
  englishTranslation?: string;
  category: 'milestone' | 'sensory' | 'speech' | 'motor' | 'emotional' | 'concern' | 'general' | 'cognitive' | 'independence';
  domain?: MilestoneDomain;
  insightSummary: string;
  whyThisMatters: string;
  detectedEmotion: 'celebratory' | 'calm' | 'anxious' | 'exhausted' | 'frustrated' | 'neutral';
  sourceMessageId?: string;
  independenceLevel?: IndependenceLevel;
  interventionRef?: string | null;
  isInterventionOutcome?: boolean;
  isProgression?: boolean;
  needsConfirmation?: boolean;
  needsReview?: boolean;
  clarifyingQuestion?: string;
  isContradiction?: boolean;
  verifiedByTherapist?: boolean;
}

export interface SentimentAnalysisResult {
  sentiment: 'celebratory' | 'stressed_overwhelmed' | 'exhausted' | 'anxious_worried' | 'frustrated' | 'calm_positive' | 'neutral';
  polarityScore: number; // -1.0 to 1.0
  stressLevel: 'low' | 'moderate' | 'high';
  confidence: number; // 0 to 1
  emotionalCues: string[];
  recommendedAiTone:
    | 'deeply_supportive_and_gentle'
    | 'warm_reassuring_and_calming'
    | 'enthusiastic_and_celebratory'
    | 'patient_and_deescalating'
    | 'warm_and_encouraging'
    | 'neutral_conversational';
  toneDirective: string;
}

export interface FiveBrainAnalysis {
  conversationBrain: {
    detectedIntent: string;
    caregiverTone: string;
    caregiverMode: 'standard' | 'caregiver_rest' | 'comfort_first' | 'celebration';
    culturalContext: 'english' | 'swahili' | 'sheng_blended';
    sentimentAnalysis?: SentimentAnalysisResult;
    domainScopeStatus?: 'in_scope' | 'out_of_scope_declined';
    outOfScopeReason?: string;
    isQueuedRetry?: boolean;
  };
  memoryBrain: {
    childId: string;
    childName: string;
    recalledMemories: string[];
    newFeedbackExtracted?: string;
    milestoneUpdateDetected?: string;
    profileUpdateProposals?: ProfileUpdateProposal[];
    detectedMilestones?: DetectedMilestoneRecord[];
  };
  recommendationBrain: {
    ragMaterialsRetrieved: {
      id: string;
      title: string;
      domain: string;
      relevanceScore: number;
    }[];
    recommendationSource?: 'clinical_library' | 'adapted_household_resources' | 'none';
    noCardAvailableReason?: string;
    suggestedActivity?: {
      title: string;
      domain: string;
      stepByStep: string[];
      parentTip: string;
      resourcesUsed?: string[];
    };
  };
  engagementBrain: {
    nudgeType?: 'quiet_parent_checkin' | 'organic_random_checkin' | 'responsive_dialogue' | 'rest_break';
    nudgeText?: string;
  };
  escalationBrain: {
    therapistEscalationTriggered: boolean;
    urgentRedFlagTriggered?: boolean;
    therapistSpecialtyNeeded?: string;
    recommendedTherapistName?: string;
    scheduledSessionTopic?: string;
    appointmentStatus?: string;
    requestedDate?: string;
    requestedTime?: string;
    adminAlertTriggered: boolean;
    adminAlertReason?: string;
    routedAdminContact?: string;
  };
}

export interface ChatMessage {
  id: string;
  childId: string;
  sender: 'parent' | 'kinda_care' | 'therapist' | 'system';
  text: string;
  timestamp: string;
  timeDisplay: string;
  replyToId?: string;
  replyToText?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  audioNote?: {
    durationSec: number;
    audioUrl?: string;
  };
  fiveBrainAnalysis?: FiveBrainAnalysis;
  status?: 'sent' | 'delivered' | 'read';
}

export interface EducationalMaterial {
  id: string;
  title: string;
  domain:
    | 'reading'
    | 'spelling'
    | 'drawing'
    | 'sensory_play'
    | 'singing'
    | 'motor'
    | 'caregiver_wellness'
    | 'protection_referral';
  sourceFramework?: string;
  referralStandard?: string;
  ageRange: string;
  description: string;
  activities: string[];
  caregiverGuidance: string;
  sensoryTips?: string;
  therapistRationale: string;
  keywords: string[];
}

export interface Therapist {
  id: string;
  name: string;
  title: string;
  specialty: 'Occupational Therapy (Sensory)' | 'Speech & Language Pathology' | 'Child & Adolescent Psychology' | 'Pediatric Physiotherapy' | 'Developmental Behavioral Pediatrics';
  location: string;
  languages: string[];
  onlineOrInPerson: 'Both' | 'Virtual Only' | 'In-Person Only';
  rateKSh: number;
  experienceYears: number;
  credentials: string;
  bio: string;
  availableDays: string[];
  avatar: string;
}

export interface TherapistAppointment {
  id: string;
  childId: string;
  childName: string;
  caregiverName: string;
  caregiverPhone: string;
  therapistId: string;
  therapistName: string;
  date: string; // e.g. "To be chosen by therapist" or chosen calendar date
  time: string; // e.g. "To be chosen by therapist" or chosen time
  mode: 'virtual_zoom' | 'whatsapp_call' | 'in_person';
  sessionTopic: string;
  status: 'requested_awaiting_confirmation' | 'confirmed' | 'completed' | 'cancelled';
  statusLabel?: string; // e.g. "Requested, awaiting therapist confirmation"
  notes?: string;
}

export interface AdminEscalationAlert {
  id: string;
  childId: string;
  childName: string;
  caregiverName: string;
  caregiverPhone: string;
  routedToPhone: string;
  reason: string;
  urgency: 'urgent_red_flag' | 'admin_action_required' | 'booking_confirmation';
  messageSummary: string;
  timestampEAT: string;
}

export type DomainObservationLevel =
  | 'Not enough information yet'
  | 'Emerging'
  | 'Practising'
  | 'Consistent';

export interface ProgressReport {
  snapshotId: string;
  childId: string;
  childName: string;
  age: string;
  caregiverName: string;
  reportingPeriod: string;
  generatedAt: string;
  generatedAtEAT: string;
  totalConversations: number;
  totalObservationsLogged: number;
  summaryParagraphs: string[]; // Max 200 words total, every sentence ends with [Date]
  executiveSummaryParagraphs: string[]; // Shorter summary version, also strict [Date] cited
  domainProgress: {
    domain: string;
    observationCount: number;
    status: DomainObservationLevel;
    notes: string; // Neutral descriptions with [Date] citations
  }[];
  caregiverReportedMilestones: {
    date: string;
    domain: string;
    milestone: string;
    quote: string;
    independenceLevel?: IndependenceLevel;
    interventionRef?: string | null;
    isProgression?: boolean;
    progressionNote?: string;
  }[];
  parentFeedbackHighlights: {
    date: string;
    parentQuote: string;
    englishTranslation?: string;
    whyThisMatters: string;
    interventionRef?: string | null;
    isInterventionOutcome?: boolean;
    needsReview?: boolean;
  }[];
  sensoryProfileEvolution: {
    stimulus: string;
    initialReaction: string;
    currentReaction: string;
    nextSteps: string;
    citationDates: string[];
  }[];
  openQuestionsForSpecialist: string[];
  consentsOnFile: {
    granted: boolean;
    consentVersion: string;
    consentDateEAT: string;
    consentScope: string;
    parentConfirmedIdentity: boolean;
  };
  appointmentsOnFile: {
    id: string;
    therapistName: string;
    requestedDate: string;
    time: string;
    topic: string;
    status: string; // Matches APPOINTMENTS verbatim e.g. "Requested, awaiting therapist confirmation"
  }[];
  standingFooter: string;
  sharedWithSpecialists?: {
    therapistId: string;
    therapistName: string;
    sharedAt: string;
    handoffNote?: string;
  }[];
}

export interface NudgeSchedule {
  id: string;
  childId: string;
  title: string;
  type: 'quiet_parent_checkin' | 'organic_random_checkin';
  messageTemplate: string;
  active: boolean;
}
