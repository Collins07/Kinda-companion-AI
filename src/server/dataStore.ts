/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  ChildProfile,
  ObservationFeedback,
  ChatMessage,
  TherapistAppointment,
  NudgeSchedule,
  ProgressReport,
  AdminEscalationAlert,
  DomainObservationLevel,
  DetectedMilestoneRecord,
  IndependenceLevel,
  MilestoneDomain
} from '../types';
import { formatEatTimestamp, formatShortDateEAT, getAdminRoutingPhone } from './metaCompliance';

export const STANDING_REPORT_FOOTER =
  'Kinda Care is a caregiver-support tool. This report summarises caregiver-reported observations and is not a diagnosis or a substitute for professional evaluation.';

export const CONSENT_VERSION = 'ODPC-KE-v2.1-2026';
export const CONSENT_SCOPE =
  'Caregiver developmental support, observation logging & specialist referral handoff';

const INDEPENDENCE_RANK: Record<IndependenceLevel, number> = {
  assisted: 1,
  partial: 2,
  independent: 3
};

export class KindaCareDataStore {
  private children: Map<string, ChildProfile> = new Map();
  private messages: Map<string, ChatMessage[]> = new Map();
  private observations: Map<string, ObservationFeedback[]> = new Map();
  private milestones: Map<string, DetectedMilestoneRecord[]> = new Map();
  private appointments: Map<string, TherapistAppointment[]> = new Map();
  private nudges: Map<string, NudgeSchedule[]> = new Map();
  private adminAlerts: AdminEscalationAlert[] = [];
  private reportShares: Map<string, NonNullable<ProgressReport['sharedWithSpecialists']>> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private createFreshSeedProfile(childId: string): ChildProfile | null {
    if (childId === 'child_nancy') {
      return {
        id: 'child_nancy',
        name: 'Nancy',
        caregiverName: 'Mama Nancy',
        caregiverPhone: '+254711223344',
        ageMonths: 42,
        gender: 'girl',
        developmentalStage: 'Early Preschool — Sensory Play & Everyday Communication',
        strengths: ['Curious about music and rhythm', 'Enjoys sorting household cups', 'Warm eye contact during co-play'],
        sensitivities: ['Bright red puzzle tiles', 'Loud sudden blender noises'],
        currentMilestones: [
          {
            domain: 'sensory',
            title: 'Comfortable play near high-contrast red items',
            skillKey: 'sensory:color_visual_tolerance',
            independenceLevel: 'assisted',
            status: 'emerging',
            updatedAt: '2026-11-15'
          },
          {
            domain: 'speech',
            title: 'Using short 2–3 word phrases during daily routines',
            skillKey: 'speech:multi_word_phrases',
            independenceLevel: 'partial',
            status: 'in_progress',
            updatedAt: '2026-11-15'
          }
        ],
        favoriteActivities: ['Clapping songs', 'Water pouring with cups', 'Picture books'],
        activeKit: 'Everyday Household Play & Color Sorting',
        environmentContext: 'Family home in Kiambu with living room mat and veranda space.',
        availableResources: ['Plastic cups & water', 'Wooden spoons', 'Leso / cloth for peekaboo', 'Color tiles'],
        subscriptionTier: 'free',
        odpcConsent: {
          granted: false,
          parentConfirmedIdentity: false,
          consentVersion: CONSENT_VERSION,
          consentScope: CONSENT_SCOPE
        },
        notes: 'Fresh profile ready for live caregiver onboarding and consent.'
      };
    }

    if (childId === 'child_john') {
      return {
        id: 'child_john',
        name: 'John',
        caregiverName: 'Baba John',
        caregiverPhone: '+254722334455',
        ageMonths: 54,
        gender: 'boy',
        developmentalStage: 'Preschool — Fine Motor & Turn-Taking',
        strengths: ['Loves stacking blocks and containers', 'Enjoys outdoor pebble counting', 'Persistent with hands-on tasks'],
        sensitivities: ['Tight scratchy shirt collars', 'Crowded noisy rooms'],
        currentMilestones: [
          {
            domain: 'motor',
            title: 'Completing simple construction or puzzle sets calmly',
            skillKey: 'cognitive:puzzle_completion',
            independenceLevel: 'partial',
            status: 'in_progress',
            updatedAt: '2026-11-15'
          },
          {
            domain: 'social',
            title: 'Taking turns with household members during play',
            skillKey: 'social:turn_taking',
            independenceLevel: 'assisted',
            status: 'emerging',
            updatedAt: '2026-11-15'
          }
        ],
        favoriteActivities: ['Stacking tins', 'Outdoor leaf & pebble sorting', 'Toy cars'],
        environmentContext: 'Suburban home with small backyard compound; plays actively with Baba John in evenings.',
        availableResources: ['Cardboard boxes', 'Bottle tops', 'Crayons & manila paper', 'Fallen leaves & pebbles'],
        subscriptionTier: 'free',
        odpcConsent: {
          granted: false,
          parentConfirmedIdentity: false,
          consentVersion: CONSENT_VERSION,
          consentScope: CONSENT_SCOPE
        },
        notes: 'Fresh profile ready for live caregiver onboarding and consent.'
      };
    }

    if (childId === 'child_stacy') {
      return {
        id: 'child_stacy',
        name: 'Stacy',
        caregiverName: 'Karen',
        caregiverPhone: '+254733445566',
        ageMonths: 36,
        gender: 'girl',
        developmentalStage: 'Toddler — Expressive Language & Tactile Exploration',
        strengths: ['Loves Swahili & English rhymes', 'Expressive facial gestures', 'Enjoys doll care play'],
        sensitivities: ['Direct questioning from unfamiliar adults', 'Sticky wet finger-paint textures'],
        currentMilestones: [
          {
            domain: 'speech',
            title: 'Joining familiar call-and-response rhymes',
            skillKey: 'speech:singing_complete_words',
            independenceLevel: 'assisted',
            status: 'emerging',
            updatedAt: '2026-11-15'
          },
          {
            domain: 'cognitive',
            title: 'Matching everyday kitchen items by shape or size',
            skillKey: 'cognitive:object_sorting',
            independenceLevel: 'partial',
            status: 'in_progress',
            updatedAt: '2026-11-15'
          }
        ],
        favoriteActivities: ['Singing nursery songs', 'Sufuria & spoon drumming', 'Storybook pointing'],
        environmentContext: 'Apartment home with musical routines; uses everyday household items rather than commercial kits.',
        availableResources: ['Sufuria & wooden spoon', 'Rolled cardboard tube', 'Khanga / scarf', 'Picture storybooks', 'Maize flour tray'],
        subscriptionTier: 'free',
        odpcConsent: {
          granted: false,
          parentConfirmedIdentity: false,
          consentVersion: CONSENT_VERSION,
          consentScope: CONSENT_SCOPE
        },
        notes: 'Fresh profile ready for live caregiver onboarding and consent.'
      };
    }

    return null;
  }

  private seedInitialData() {
    for (const id of ['child_nancy', 'child_john', 'child_stacy']) {
      const profile = this.createFreshSeedProfile(id);
      if (profile) {
        this.children.set(id, profile);
        this.messages.set(id, []);
        this.observations.set(id, []);
        this.milestones.set(id, []);
        this.appointments.set(id, []);
      }
    }
  }

  resetChildSession(childId: string): ChildProfile | null {
    const fresh = this.createFreshSeedProfile(childId);
    if (!fresh) return null;
    this.children.set(childId, fresh);
    this.messages.set(childId, []);
    this.observations.set(childId, []);
    this.milestones.set(childId, []);
    this.appointments.set(childId, []);
    this.adminAlerts = this.adminAlerts.filter(a => a.childId !== childId);
    this.reportShares.delete(childId);
    return fresh;
  }

  // Children
  getAllChildren(): ChildProfile[] {
    return Array.from(this.children.values());
  }

  getChild(id: string): ChildProfile | undefined {
    return this.children.get(id);
  }

  getChildByPhone(phone: string): ChildProfile | undefined {
    const clean = phone.replace(/[^0-9]/g, '');
    if (!clean) return undefined;
    for (const child of this.children.values()) {
      const childClean = child.caregiverPhone.replace(/[^0-9]/g, '');
      if (childClean && (childClean.endsWith(clean) || clean.endsWith(childClean))) {
        return child;
      }
    }
    return undefined;
  }

  saveChild(child: ChildProfile): ChildProfile {
    this.children.set(child.id, child);
    return child;
  }

  // Messages
  getMessages(childId: string): ChatMessage[] {
    return (this.messages.get(childId) || []).filter(m => m.childId === childId);
  }

  addMessage(message: ChatMessage): ChatMessage {
    const list = this.messages.get(message.childId) || [];
    if (list.some(m => m.id === message.id)) {
      return message;
    }
    list.push(message);
    if (list.length > 250) {
      list.splice(0, list.length - 250);
    }
    this.messages.set(message.childId, list);
    return message;
  }

  replaceMessage(replaceId: string, newMessage: ChatMessage): ChatMessage {
    const list = this.messages.get(newMessage.childId) || [];
    const idx = list.findIndex(m => m.id === replaceId);
    if (idx !== -1) {
      list[idx] = newMessage;
      this.messages.set(newMessage.childId, list);
      return newMessage;
    }
    return this.addMessage(newMessage);
  }

  // Observations & Parent Feedback Store (with duplicate suppression)
  getObservations(childId: string): ObservationFeedback[] {
    return (this.observations.get(childId) || []).filter(o => o.childId === childId);
  }

  addObservation(obs: ObservationFeedback): { added: boolean; observation: ObservationFeedback } {
    const list = this.observations.get(obs.childId) || [];
    const normalizedQuote = obs.rawParentMessage.trim().toLowerCase();

    const nowMs = new Date(obs.timestamp).getTime();
    const obsDomain = obs.domain || obs.category;
    const isDuplicate = list.some(existing => {
      const existingDomain = existing.domain || existing.category;
      if (
        obs.sourceMessageId &&
        existing.sourceMessageId === obs.sourceMessageId &&
        existingDomain === obsDomain &&
        Boolean(obs.isInterventionOutcome) === Boolean(existing.isInterventionOutcome)
      ) {
        return true;
      }
      const existingNorm = existing.rawParentMessage.trim().toLowerCase();
      const diffMs = Math.abs(nowMs - new Date(existing.timestamp).getTime());
      return (
        existingNorm === normalizedQuote &&
        existingDomain === obsDomain &&
        diffMs < 5 * 60 * 1000 &&
        Boolean(obs.isInterventionOutcome) === Boolean(existing.isInterventionOutcome)
      );
    });

    if (isDuplicate) {
      return { added: false, observation: obs };
    }

    if (!obs.reportedDate) {
      obs.reportedDate = obs.timestamp.slice(0, 10);
    }
    if (!obs.reportedDateDisplay) {
      obs.reportedDateDisplay = formatShortDateEAT(obs.reportedDate);
    }

    list.push(obs);
    this.observations.set(obs.childId, list);
    return { added: true, observation: obs };
  }

  // Milestones Store (Dedupe by (child, skill, reported_date) + Progression Tracking)
  getMilestones(childId: string): DetectedMilestoneRecord[] {
    return (this.milestones.get(childId) || []).filter(m => m.child_id === childId);
  }

  addOrProgressMilestone(record: DetectedMilestoneRecord): {
    status: 'added' | 'progressed' | 'deduped' | 'queued_for_review';
    record: DetectedMilestoneRecord;
  } {
    if (record.needs_review) {
      return { status: 'queued_for_review', record };
    }

    const list = this.milestones.get(record.child_id) || [];
    const sameSkillEntries = list.filter(m => m.skillKey === record.skillKey);

    // 1. Check exact (child, skill, reported_date) match -> dedupe unless independence_level upgraded
    const sameDateMatchIdx = list.findIndex(
      m => m.skillKey === record.skillKey && m.reported_date === record.reported_date
    );

    if (sameDateMatchIdx !== -1) {
      const existing = list[sameDateMatchIdx];
      if (INDEPENDENCE_RANK[record.independence_level] > INDEPENDENCE_RANK[existing.independence_level]) {
        const progressed: DetectedMilestoneRecord = {
          ...record,
          is_progression: true,
          progression_note: `PROGRESSION (${existing.independence_level} -> ${record.independence_level})`
        };
        list[sameDateMatchIdx] = progressed;
        this.milestones.set(record.child_id, list);
        this.syncMilestoneToChildProfile(progressed);
        return { status: 'progressed', record: progressed };
      }
      // Dedupe identical (child, skill, reported_date)
      return { status: 'deduped', record: existing };
    }

    // 2. Same skill on a later/different reported_date -> log as PROGRESSION, not a plain duplicate!
    if (sameSkillEntries.length > 0) {
      const latestPrev = sameSkillEntries[sameSkillEntries.length - 1];
      const rankDiff =
        INDEPENDENCE_RANK[record.independence_level] - INDEPENDENCE_RANK[latestPrev.independence_level];
      const progressionNote =
        rankDiff > 0
          ? `PROGRESSION: ${latestPrev.independence_level} -> ${record.independence_level}`
          : `PROGRESSION: Growing consistency (${sameSkillEntries.length + 1}x reported)`;

      const progressedRecord: DetectedMilestoneRecord = {
        ...record,
        is_progression: true,
        progression_note: progressionNote
      };
      list.push(progressedRecord);
      this.milestones.set(record.child_id, list);
      this.syncMilestoneToChildProfile(progressedRecord);
      return { status: 'progressed', record: progressedRecord };
    }

    // 3. Brand new milestone
    list.push(record);
    this.milestones.set(record.child_id, list);
    this.syncMilestoneToChildProfile(record);
    return { status: 'added', record };
  }

  private syncMilestoneToChildProfile(record: DetectedMilestoneRecord) {
    const child = this.getChild(record.child_id);
    if (!child) return;

    const existingIdx = child.currentMilestones.findIndex(
      m => m.skillKey === record.skillKey || m.title.toLowerCase() === record.skillSummary.toLowerCase()
    );

    if (existingIdx !== -1) {
      child.currentMilestones[existingIdx] = {
        ...child.currentMilestones[existingIdx],
        domain: record.domain,
        title: record.skillSummary,
        skillKey: record.skillKey,
        independenceLevel: record.independence_level,
        status: record.independence_level === 'independent' ? 'achieved' : 'emerging',
        updatedAt: record.reported_date
      };
    } else {
      child.currentMilestones.push({
        domain: record.domain,
        title: record.skillSummary,
        skillKey: record.skillKey,
        independenceLevel: record.independence_level,
        status: record.independence_level === 'independent' ? 'achieved' : 'emerging',
        updatedAt: record.reported_date
      });
    }
    this.saveChild(child);
  }

  // Appointments (Strict single-pending-request deduplication)
  getAppointments(childId?: string): TherapistAppointment[] {
    if (childId) {
      return this.appointments.get(childId) || [];
    }
    const all: TherapistAppointment[] = [];
    for (const appts of this.appointments.values()) {
      all.push(...appts);
    }
    return all;
  }

  addAppointment(appt: TherapistAppointment): { appointment: TherapistAppointment; created: boolean } {
    const list = this.appointments.get(appt.childId) || [];

    // Prevent duplicate pending booking prompts/requests for the same child & therapist (or pending consultation)
    const existingPending = list.find(
      a =>
        a.status === 'requested_awaiting_confirmation' &&
        (a.therapistId === appt.therapistId || a.therapistName === appt.therapistName)
    );
    if (existingPending) {
      return { appointment: existingPending, created: false };
    }

    const cleanDate = appt.date && appt.date.trim() ? appt.date.trim() : 'To be chosen by therapist';
    const cleanTime = appt.time && appt.time.trim() ? appt.time.trim() : 'To be chosen by therapist';

    const normalized: TherapistAppointment = {
      ...appt,
      date: cleanDate,
      time: cleanTime,
      status: appt.status || 'requested_awaiting_confirmation',
      statusLabel:
        appt.status === 'confirmed'
          ? 'Confirmed'
          : appt.status === 'completed'
          ? 'Completed'
          : appt.status === 'cancelled'
          ? 'Cancelled'
          : 'Requested, awaiting therapist confirmation'
    };
    list.push(normalized);
    this.appointments.set(normalized.childId, list);
    return { appointment: normalized, created: true };
  }

  confirmAppointment(
    appointmentId: string,
    confirmedDate?: string,
    confirmedTime?: string
  ): TherapistAppointment | null {
    for (const [childId, appts] of this.appointments.entries()) {
      const idx = appts.findIndex(a => a.id === appointmentId);
      if (idx !== -1) {
        const updated: TherapistAppointment = {
          ...appts[idx],
          date: confirmedDate && confirmedDate.trim() ? confirmedDate.trim() : appts[idx].date,
          time: confirmedTime && confirmedTime.trim() ? confirmedTime.trim() : appts[idx].time,
          status: 'confirmed',
          statusLabel: 'Confirmed'
        };
        appts[idx] = updated;
        this.appointments.set(childId, appts);
        return updated;
      }
    }
    return null;
  }

  // Admin Escalation Alerts (Deduplicates booking_confirmation spam for same child/reason)
  addAdminAlert(alert: Omit<AdminEscalationAlert, 'id' | 'timestampEAT' | 'routedToPhone'>): {
    alert: AdminEscalationAlert;
    created: boolean;
  } {
    if (alert.urgency === 'booking_confirmation') {
      const duplicatePendingAlert = this.adminAlerts.find(
        a => a.childId === alert.childId && a.urgency === 'booking_confirmation' && a.reason === alert.reason
      );
      if (duplicatePendingAlert) {
        return { alert: duplicatePendingAlert, created: false };
      }
    }

    const entry: AdminEscalationAlert = {
      id: 'adm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      routedToPhone: getAdminRoutingPhone(),
      timestampEAT: formatEatTimestamp(),
      ...alert
    };
    this.adminAlerts.unshift(entry);
    if (this.adminAlerts.length > 100) {
      this.adminAlerts.splice(100);
    }
    return { alert: entry, created: true };
  }

  getAdminAlerts(childId?: string): AdminEscalationAlert[] {
    if (childId) {
      return this.adminAlerts.filter(a => a.childId === childId);
    }
    return this.adminAlerts;
  }

  // Deterministic, Evidence-Only Structured Progress Report
  generateProgressReport(childId: string): ProgressReport | null {
    const child = this.getChild(childId);
    if (!child) return null;

    // Count strictly true WhatsApp dialogue messages for THIS child profile only
    const msgs = this.getMessages(childId).filter(
      m => m.childId === childId && (m.sender === 'parent' || m.sender === 'kinda_care' || m.sender === 'therapist')
    );
    const obs = this.getObservations(childId);
    const detectedMilestones = this.getMilestones(childId);
    const appts = this.getAppointments(childId);
    const now = new Date();
    const snapshotId = `KC-RPT-${now.getTime().toString().slice(-6)}`;
    const generatedAtEAT = formatEatTimestamp(now);

    const getObsDateLabel = (o: ObservationFeedback) =>
      o.reportedDateDisplay || formatShortDateEAT(o.reportedDate || o.timestamp);

    const countDistinctEvents = (domainObs: ObservationFeedback[]) => {
      const seen = new Set<string>();
      for (const o of domainObs) {
        seen.add(o.sourceMessageId || o.id);
      }
      return seen.size;
    };

    const computeDomainStatus = (domainObs: ObservationFeedback[], domainMilestonesCount: number): DomainObservationLevel => {
      // Require at least 2 dated important observations for anything above "Not enough information yet"
      const dated = domainObs.filter(o => Boolean((o.reportedDate || o.timestamp) && o.rawParentMessage));
      const distinctCount = countDistinctEvents(dated);
      if (distinctCount < 2) {
        return 'Not enough information yet';
      }
      const progressionOrIndependent = dated.filter(
        o => o.isProgression || o.independenceLevel === 'independent'
      ).length;
      if (domainMilestonesCount >= 2 && (progressionOrIndependent >= 1 || distinctCount >= 4)) {
        return 'Consistent';
      }
      if (distinctCount >= 3 || domainMilestonesCount >= 1) {
        return 'Practising';
      }
      return 'Emerging';
    };

    const domainsConfig: Array<{
      label: string;
      domainKey: MilestoneDomain;
      categories: ObservationFeedback['category'][];
    }> = [
      { label: 'Cognitive & Problem-Solving', domainKey: 'cognitive', categories: ['cognitive', 'milestone', 'general'] },
      { label: 'Fine & Gross Motor', domainKey: 'motor', categories: ['motor'] },
      { label: 'Speech & Communication', domainKey: 'speech', categories: ['speech'] },
      { label: 'Sensory Tolerance', domainKey: 'sensory', categories: ['sensory'] },
      { label: 'Social-Emotional', domainKey: 'social', categories: ['emotional', 'concern'] },
      { label: 'Independence & Self-Care', domainKey: 'independence', categories: ['independence'] }
    ];

    const domainProgress: ProgressReport['domainProgress'] = domainsConfig.map(cfg => {
      const domainObs = obs.filter(
        o =>
          !o.needsReview &&
          (o.domain === cfg.domainKey || (!o.domain && cfg.categories.includes(o.category)))
      );
      const distinctCount = countDistinctEvents(domainObs);
      const domainMilestoneCount = detectedMilestones.filter(m => m.domain === cfg.domainKey).length;
      const status = computeDomainStatus(domainObs, domainMilestoneCount);
      const uniqueDateCites = Array.from(new Set(domainObs.slice(-4).map(o => `[${getObsDateLabel(o)}]`))).join(' ');

      const notes =
        distinctCount === 0
          ? 'No caregiver-reported observations logged in this domain yet.'
          : status === 'Not enough information yet'
          ? `${distinctCount} observation logged so far; at least 2 dated important observations are needed before rating above "Not enough information yet" ${uniqueDateCites}.`
          : `Based on ${distinctCount} dated caregiver-reported observations: ${domainObs
              .slice(-2)
              .map(o => o.insightSummary)
              .join('; ')} ${uniqueDateCites}.`;

      return {
        domain: cfg.label,
        observationCount: distinctCount,
        status,
        notes: notes.trim()
      };
    });

    const firstDate = msgs[0]?.timestamp ? formatShortDateEAT(msgs[0].timestamp) : 'Session Start';

    // Combine auto-promoted detectedMilestones with any legacy category==='milestone' observations cleanly
    const milestoneEntries: ProgressReport['caregiverReportedMilestones'] = detectedMilestones.map(m => ({
      date: m.reportedDateDisplay || formatShortDateEAT(m.reported_date),
      domain: m.domain,
      milestone: m.is_progression && m.progression_note ? `${m.skillSummary} (${m.progression_note})` : m.skillSummary,
      quote: m.verbatim_quote,
      independenceLevel: m.independence_level,
      interventionRef: m.intervention_ref,
      isProgression: m.is_progression,
      progressionNote: m.progression_note
    }));

    for (const o of obs) {
      if (o.category === 'milestone' && !o.needsReview) {
        const dateStr = getObsDateLabel(o);
        const alreadyIncluded = milestoneEntries.some(
          m => m.quote.trim().toLowerCase() === o.rawParentMessage.trim().toLowerCase() && m.date === dateStr
        );
        if (!alreadyIncluded) {
          milestoneEntries.push({
            date: dateStr,
            domain: o.domain || 'cognitive',
            milestone: o.insightSummary,
            quote: o.rawParentMessage,
            independenceLevel: o.independenceLevel,
            interventionRef: o.interventionRef,
            isProgression: o.isProgression
          });
        }
      }
    }

    // Build evidence-cited summary paragraphs using ONLY dates in brackets (e.g. [Nov 15, 2026].)
    const validReportObs = obs.filter(o => !o.needsReview);
    let summaryParagraphs: string[] = [];
    let executiveSummaryParagraphs: string[] = [];

    if (validReportObs.length === 0) {
      summaryParagraphs = [
        `No dated caregiver observations are currently on file for ${child.name} yet.`,
        `Once ${child.caregiverName} grants consent and shares everyday play or routine updates on WhatsApp, factual caregiver-reported notes will appear here with their dates.`
      ];
      executiveSummaryParagraphs = [summaryParagraphs[0]];
    } else {
      const recentObs = validReportObs.slice(-4);
      const p1 = recentObs
        .slice(0, 2)
        .map(o => `${o.insightSummary.replace(/\.+$/, '')} [${getObsDateLabel(o)}].`)
        .join(' ');
      const p2 = recentObs
        .slice(2, 4)
        .map(o => `${o.insightSummary.replace(/\.+$/, '')} [${getObsDateLabel(o)}].`)
        .join(' ');
      summaryParagraphs = [p1, p2].filter(Boolean);
      executiveSummaryParagraphs = [p1];
    }

    const sensoryObs = validReportObs.filter(o => o.domain === 'sensory' || o.category === 'sensory');
    const sensoryProfileEvolution: ProgressReport['sensoryProfileEvolution'] =
      child.sensitivities.length > 0
        ? child.sensitivities.map(stimulus => ({
            stimulus,
            initialReaction:
              sensoryObs.length > 0
                ? `${sensoryObs[0].insightSummary} [${getObsDateLabel(sensoryObs[0])}]`
                : 'Noted in initial caregiver profile setup; awaiting dated play observations.',
            currentReaction:
              sensoryObs.length > 1
                ? `${sensoryObs[sensoryObs.length - 1].insightSummary} [${getObsDateLabel(sensoryObs[sensoryObs.length - 1])}]`
                : 'No additional sensory reactions logged yet.',
            nextSteps: 'Continue caregiver-paced exposure without forcing during calm routines.',
            citationDates: Array.from(new Set(sensoryObs.map(o => getObsDateLabel(o))))
          }))
        : [];

    const openQuestionsForSpecialist: string[] = [];
    const silentReviewObs = obs.filter(o => o.needsReview || (o.needsConfirmation && o.clarifyingQuestion));
    for (const uo of silentReviewObs) {
      const dLabel = getObsDateLabel(uo);
      openQuestionsForSpecialist.push(
        `Review ambiguous caregiver note (${dLabel}): "${uo.rawParentMessage}"${uo.clarifyingQuestion ? ` — ${uo.clarifyingQuestion}` : ''}`
      );
    }
    if (validReportObs.length > 0 && openQuestionsForSpecialist.length === 0) {
      openQuestionsForSpecialist.push(
        `Review caregiver-reported observations with ${child.caregiverName} to decide which home play routines feel easiest to sustain.`
      );
    }

    return {
      snapshotId,
      childId: child.id,
      childName: child.name,
      age: `${Math.floor(child.ageMonths / 12)} years ${child.ageMonths % 12 > 0 ? (child.ageMonths % 12) + ' mos' : ''}`.trim(),
      caregiverName: child.caregiverName,
      reportingPeriod: `${firstDate} – Present`,
      generatedAt: now.toISOString(),
      generatedAtEAT,
      totalConversations: msgs.length,
      totalObservationsLogged: validReportObs.length,
      summaryParagraphs,
      executiveSummaryParagraphs,
      domainProgress,
      caregiverReportedMilestones: milestoneEntries,
      parentFeedbackHighlights: obs.map(o => ({
        date: getObsDateLabel(o),
        parentQuote: o.rawParentMessage,
        englishTranslation: o.englishTranslation,
        whyThisMatters: o.whyThisMatters,
        interventionRef: o.interventionRef,
        isInterventionOutcome: o.isInterventionOutcome,
        needsReview: o.needsReview
      })),
      sensoryProfileEvolution,
      openQuestionsForSpecialist,
      consentsOnFile: {
        granted: child.odpcConsent.granted,
        consentVersion: child.odpcConsent.consentVersion || CONSENT_VERSION,
        consentDateEAT: child.odpcConsent.grantedAt ? formatEatTimestamp(child.odpcConsent.grantedAt) : 'Not granted yet',
        consentScope: child.odpcConsent.consentScope || CONSENT_SCOPE,
        parentConfirmedIdentity: child.odpcConsent.parentConfirmedIdentity
      },
      appointmentsOnFile: appts.map(a => ({
        id: a.id,
        therapistName: a.therapistName,
        requestedDate: a.date,
        time: a.time,
        topic: a.sessionTopic,
        status: a.statusLabel || (a.status === 'confirmed' ? 'Confirmed' : 'Requested, awaiting therapist confirmation')
      })),
      standingFooter: STANDING_REPORT_FOOTER,
      sharedWithSpecialists: this.reportShares.get(childId) || []
    };
  }

  shareReportWithSpecialist(
    childId: string,
    therapistId: string,
    therapistName: string,
    handoffNote?: string
  ) {
    const existing = this.reportShares.get(childId) || [];
    const entry = {
      therapistId,
      therapistName,
      sharedAt: new Date().toISOString(),
      handoffNote
    };
    existing.unshift(entry);
    this.reportShares.set(childId, existing);
    return existing;
  }
}

export const globalDataStore = new KindaCareDataStore();
