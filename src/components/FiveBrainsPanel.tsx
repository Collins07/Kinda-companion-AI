/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Brain,
  MessageCircle,
  Database,
  Lightbulb,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  UserCheck,
  Clock,
  AlertTriangle,
  Award
} from 'lucide-react';
import { FiveBrainAnalysis, ChildProfile } from '../types';

interface FiveBrainsPanelProps {
  analysis?: FiveBrainAnalysis;
  child: ChildProfile;
  onOpenReport: () => void;
  onOpenTherapist: () => void;
}

export const FiveBrainsPanel: React.FC<FiveBrainsPanelProps> = ({
  analysis,
  child,
  onOpenTherapist
}) => {
  if (!analysis) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mb-3">
          <Brain className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">
          5-Brain Monitors
        </h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Send a message in the WhatsApp simulator or tap any reply&apos;s{' '}
          <span className="text-emerald-600 font-semibold">5-Brain Monitor</span> badge to inspect conversation context, memory &amp; milestone detection, RAG cards, engagement timing, and specialist escalation.
        </p>
      </div>
    );
  }

  const { conversationBrain, memoryBrain, recommendationBrain, engagementBrain, escalationBrain } = analysis;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Brain className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              5-Brain Monitors
            </h3>
            <p className="text-[11px] text-slate-500">
              Active family profile: <span className="font-medium text-emerald-600">{child.caregiverName}</span> &amp; <span className="font-medium text-emerald-600">{child.name}</span>
            </p>
          </div>
        </div>
        {conversationBrain.isQueuedRetry && (
          <span className="text-[10.5px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Queued Retry</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Brain 1: Conversation & Sentiment Monitor */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Conversation Brain Monitor</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-800">
              {conversationBrain.caregiverMode.replace(/_/g, ' ').toUpperCase()}
            </span>
          </div>
          <p><span className="text-slate-400">Intent:</span> {conversationBrain.detectedIntent}</p>
          <p>
            <span className="text-slate-400">Language:</span>{' '}
            <span className="font-medium text-emerald-700 dark:text-emerald-400 uppercase">
              {conversationBrain.culturalContext === 'swahili'
                ? 'Swahili'
                : conversationBrain.culturalContext === 'sheng_blended'
                ? 'Sheng / Kenyan Mix'
                : 'English'}
            </span>
          </p>
          {conversationBrain.sentimentAnalysis && (
            <p className="text-[11px] text-slate-600 dark:text-slate-300">
              <span className="text-slate-400">Detected Sentiment:</span>{' '}
              {conversationBrain.sentimentAnalysis.sentiment.replace(/_/g, ' ')}
            </p>
          )}
          <div>
            <span className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
              conversationBrain.domainScopeStatus === 'out_of_scope_declined'
                ? 'bg-amber-100 text-amber-800'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}>
              {conversationBrain.domainScopeStatus === 'out_of_scope_declined'
                ? 'OUT OF SCOPE DECLINED'
                : 'CAREGIVER COMPANION SCOPE'}
            </span>
          </div>
        </div>

        {/* Brain 2: Memory & Milestone Monitor */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              <span>2. Memory &amp; Milestone Monitor</span>
            </span>
          </div>

          {memoryBrain.detectedMilestones && memoryBrain.detectedMilestones.length > 0 && (
            <div className="space-y-1.5">
              {memoryBrain.detectedMilestones.map((ms, idx) => (
                <div
                  key={idx}
                  className="bg-emerald-50/80 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900 text-[11px] space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-1">
                    <span className="font-bold uppercase text-[10px] text-emerald-800 dark:text-emerald-300 flex items-center space-x-1">
                      <Award className="w-3 h-3" />
                      <span>{ms.domain} • {ms.reportedDateDisplay}</span>
                    </span>
                    <div className="flex items-center gap-1">
                      {ms.is_progression && (
                        <span className="text-[9.5px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold">
                          PROGRESSION
                        </span>
                      )}
                      {ms.is_intervention_outcome && (
                        <span className="text-[9.5px] bg-purple-600 text-white px-1.5 py-0.5 rounded font-bold">
                          INTERVENTION OUTCOME
                        </span>
                      )}
                      {ms.needs_review && (
                        <span className="text-[9.5px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                          SILENT OT REVIEW
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{ms.skillSummary}</p>
                  <p className="italic text-slate-500">Quote: &quot;{ms.verbatim_quote}&quot;</p>
                  <p className="text-[10px] text-slate-500">
                    Level: {ms.independence_level} • Confidence: {Math.round(ms.confidence * 100)}%
                    {ms.intervention_ref ? ` • Ref: ${ms.intervention_ref}` : ''}
                  </p>
                </div>
              ))}
            </div>
          )}

          {memoryBrain.profileUpdateProposals && memoryBrain.profileUpdateProposals.length > 0 ? (
            <div className="space-y-1.5">
              {memoryBrain.profileUpdateProposals.map((prop, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-[11px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold uppercase text-[10px] text-blue-700 dark:text-blue-400">
                      {prop.status} • {prop.domain}
                    </span>
                    {prop.needs_confirmation && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                        OT Review Queue
                      </span>
                    )}
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium">{prop.fact}</p>
                  <p className="italic text-slate-500">Quote: &quot;{prop.evidence_quote}&quot;</p>
                </div>
              ))}
            </div>
          ) : !memoryBrain.detectedMilestones?.length ? (
            <p className="text-[11px] text-slate-400 italic">No child observations or milestones extracted from this turn.</p>
          ) : null}
        </div>

        {/* Brain 3: Recommendation Brain Monitor */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>3. Recommendation Brain Monitor</span>
            </span>
          </div>
          {recommendationBrain.ragMaterialsRetrieved.length > 0 ? (
            <div className="space-y-1.5">
              {recommendationBrain.ragMaterialsRetrieved.map(mat => (
                <div key={mat.id} className="text-[11px] bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 block">{mat.title}</span>
                  <span className="text-slate-400">Card: {mat.id} • {mat.domain}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400 italic">
              {recommendationBrain.noCardAvailableReason || 'No library card needed for this conversational turn.'}
            </p>
          )}
          {recommendationBrain.suggestedActivity && (
            <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 text-[11px] space-y-1">
              <strong className="text-amber-900 dark:text-amber-300 block">{recommendationBrain.suggestedActivity.title}</strong>
              <p className="text-amber-800 dark:text-amber-200">{recommendationBrain.suggestedActivity.parentTip}</p>
            </div>
          )}
        </div>

        {/* Brain 4: Engagement Brain Monitor */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-sky-500" />
              <span>4. Engagement Brain Monitor</span>
            </span>
          </div>
          <p className="text-[11px] text-slate-600 dark:text-slate-300">
            <span className="text-slate-400">Cadence Mode:</span>{' '}
            <span className="font-semibold uppercase">
              {(engagementBrain.nudgeType || 'responsive_dialogue').replace(/_/g, ' ')}
            </span>
          </p>
          {child.lastSuggestedProtocol && (
            <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
              <span className="text-slate-400 block">Protocol Continuity:</span>
              <span className="font-medium text-slate-800 dark:text-slate-200">{child.lastSuggestedProtocol.title}</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 uppercase font-semibold">
                {child.lastSuggestedProtocol.status.replace(/_/g, ' ')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Brain 5: Escalation & Safety Triage Monitor */}
      <div className={`rounded-xl p-4 border transition text-xs space-y-2 ${
        escalationBrain.urgentRedFlagTriggered || escalationBrain.adminAlertTriggered
          ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800'
          : escalationBrain.therapistEscalationTriggered
          ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
            <ShieldAlert className={`w-4 h-4 ${
              escalationBrain.urgentRedFlagTriggered || escalationBrain.adminAlertTriggered
                ? 'text-red-600'
                : escalationBrain.therapistEscalationTriggered
                ? 'text-purple-600'
                : 'text-slate-500'
            }`} />
            <span>5. Escalation Brain Monitor</span>
          </span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
            escalationBrain.urgentRedFlagTriggered
              ? 'bg-red-600 text-white'
              : escalationBrain.adminAlertTriggered
              ? 'bg-amber-600 text-white'
              : escalationBrain.therapistEscalationTriggered
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {escalationBrain.urgentRedFlagTriggered
              ? 'URGENT RED FLAG'
              : escalationBrain.adminAlertTriggered
              ? 'ADMIN ROUTED'
              : escalationBrain.therapistEscalationTriggered
              ? 'SINGLE REQUEST ON FILE'
              : 'STANDBY'}
          </span>
        </div>

        {escalationBrain.adminAlertTriggered && (
          <div className="flex items-start space-x-2 text-red-900 dark:text-red-200 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p>Routed to Admin WhatsApp: <strong>{escalationBrain.routedAdminContact || 'Coordinator'}</strong></p>
              {escalationBrain.adminAlertReason && <p className="text-[11px]">{escalationBrain.adminAlertReason}</p>}
            </div>
          </div>
        )}

        {escalationBrain.therapistEscalationTriggered ? (
          <div className="space-y-1.5">
            <p><span className="font-semibold">Specialist:</span> {escalationBrain.recommendedTherapistName}</p>
            <p><span className="font-semibold">Date / Time:</span> {escalationBrain.requestedDate || 'To be chosen by therapist'} • {escalationBrain.requestedTime || 'To be chosen by therapist'}</p>
            <p><span className="font-semibold">Status:</span> {escalationBrain.appointmentStatus || 'Requested, awaiting therapist confirmation'}</p>
            <button
              type="button"
              onClick={onOpenTherapist}
              className="mt-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Specialist &amp; Admin: Choose Time &amp; Confirm</span>
            </button>
          </div>
        ) : !escalationBrain.adminAlertTriggered ? (
          <p className="text-slate-500 flex items-center space-x-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>No urgent safety flags. Escalation Monitor remains on standby.</span>
          </p>
        ) : null}
      </div>
    </div>
  );
};
