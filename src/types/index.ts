/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ChildProfile {
  id: string;
  name: string;
  caregiverName: string; // e.g. "Mama Brandon"
  caregiverPhone: string; // e.g. "+254712345678"
  ageMonths: number; // e.g. 48 (4 years)
  gender: 'boy' | 'girl' | 'other';
  developmentalStage: string; // e.g. "Early Preschool / Sensory Processing & Speech"
  strengths: string[];
  sensitivities: string[]; // e.g. ["red-coded tiles aversion", "loud auditory transitions"]
  currentMilestones: {
    domain: 'cognitive' | 'speech' | 'motor' | 'sensory' | 'social';
    title: string;
    status: 'in_progress' | 'achieved' | 'emerging';
    updatedAt: string;
  }[];
  favoriteActivities: string[];
  activeKit?: string; // e.g. "Color & Shape Discovery Kit"
  environmentContext?: string; // e.g. "Home in Kiambu with small veranda; limited commercial toys"
  availableResources?: string[]; // e.g. ["Plastic bottle caps", "Maize flour", "Wooden spoons", "Cardboard boxes"]
  subscriptionTier: 'free' | 'premium';
  subscriptionExpiry?: string;
  mpesaPhone?: string;
  odpcConsent: {
    granted: boolean;
    grantedAt?: string;
    parentConfirmedIdentity: boolean;
  };
  notes: string;
}

export interface ObservationFeedback {
  id: string;
  childId: string;
  timestamp: string;
  rawParentMessage: string;
  category: 'milestone' | 'sensory' | 'speech' | 'motor' | 'emotional' | 'concern' | 'general';
  insightSummary: string;
  developmentalImpact: string;
  detectedEmotion: 'celebratory' | 'calm' | 'anxious' | 'exhausted' | 'frustrated' | 'neutral';
  verifiedByTherapist?: boolean;
}

export interface FiveBrainAnalysis {
  conversationBrain: {
    detectedIntent: string;
    caregiverTone: string;
    caregiverMode: 'standard' | 'caregiver_rest' | 'comfort_first' | 'celebration';
    culturalContext: 'english' | 'swahili' | 'sheng_blended';
  };
  memoryBrain: {
    childId: string;
    childName: string;
    recalledMemories: string[];
    newFeedbackExtracted?: string;
    milestoneUpdateDetected?: string;
  };
  recommendationBrain: {
    ragMaterialsRetrieved: {
      id: string;
      title: string;
      domain: string;
      relevanceScore: number;
    }[];
    recommendationSource?: 'clinical_library' | 'adapted_household_resources' | 'creative_everyday_activity' | 'none';
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
    emotionalWarmthRating: number; // 1-10
  };
  escalationBrain: {
    therapistEscalationTriggered: boolean;
    therapistSpecialtyNeeded?: string;
    recommendedTherapistName?: string;
    scheduledSessionTopic?: string;
    adminAlertTriggered: boolean;
    adminAlertReason?: string;
  };
}

export interface ChatMessage {
  id: string;
  childId: string;
  sender: 'parent' | 'kinda_care' | 'therapist' | 'system';
  text: string;
  timestamp: string;
  timeDisplay: string; // e.g. "6:58 PM"
  replyToId?: string;
  replyToText?: string;
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
  domain: 'reading' | 'spelling' | 'drawing' | 'sensory_play' | 'singing' | 'motor';
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
  location: string; // e.g. "Kiambu", "Nairobi - Kilimani", "Thika Road"
  languages: string[];
  onlineOrInPerson: 'Both' | 'Virtual Only' | 'In-Person Only';
  rateKSh: number; // e.g. 2500
  experienceYears: number;
  credentials: string; // e.g. "MSc Paediatric OT (KU), Reg. KOTPA"
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
  date: string;
  time: string;
  mode: 'virtual_zoom' | 'whatsapp_call' | 'in_person';
  sessionTopic: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ProgressReport {
  childId: string;
  childName: string;
  age: string;
  caregiverName: string;
  reportingPeriod: string;
  totalConversations: number;
  totalObservationsLogged: number;
  domainProgress: {
    domain: string;
    masteryPercentage: number;
    status: 'Excelling' | 'On Track' | 'Needs Targeted Play' | 'Therapist Guided';
    notes: string;
  }[];
  keyMilestonesAchieved: string[];
  parentFeedbackHighlights: {
    date: string;
    parentQuote: string;
    developmentalSignificance: string;
  }[];
  sensoryProfileEvolution: {
    trigger: string;
    initialReaction: string;
    currentReaction: string;
    nextSteps: string;
  }[];
  clinicalTherapistSummary: string;
  upcomingMissionGoals: string[];
  generatedAt?: string;
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
