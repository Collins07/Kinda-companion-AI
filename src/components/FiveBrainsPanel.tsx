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
  Heart,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  BookOpen,
  UserCheck
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
  onOpenReport,
  onOpenTherapist
}) => {
  if (!analysis) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col items-center justify-center text-center shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 mb-3">
          <Brain className="w-8 h-8 animate-pulse" />
        </div>
        <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-base">5-Brains Architecture Monitor</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Send a message in the WhatsApp simulator or click on any message's <span className="text-emerald-600 font-semibold">"5-Brains"</span> badge to inspect the neural reasoning across Conversation, Memory, Recommendation, Engagement, and Escalation brains.
        </p>
      </div>
    );
  }

  const {
    conversationBrain,
    memoryBrain,
    recommendationBrain,
    engagementBrain,
    escalationBrain
  } = analysis;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active 5-Brains Neural Rationale</h3>
            <p className="text-[11px] text-slate-500">
              Processing for child: <span className="font-medium text-emerald-600">{child.name}</span>
            </p>
          </div>
        </div>
        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-mono px-2 py-0.5 rounded">
          gemini-3.1-flash-lite
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Brain 1: Conversation Brain */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              <span>1. Conversation Brain</span>
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              conversationBrain.caregiverMode === 'caregiver_rest'
                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              {conversationBrain.caregiverMode.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 font-medium">Caregiver Tone: </span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{conversationBrain.caregiverTone}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Detected Intent: </span>
              <span>{conversationBrain.detectedIntent}</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Language Mirrored: </span>
              <span className="text-emerald-700 dark:text-emerald-400 font-medium uppercase">
                {conversationBrain.culturalContext === 'swahili'
                  ? 'Swahili'
                  : conversationBrain.culturalContext === 'sheng_blended'
                  ? 'Sheng / Kenyan Swahili-English Blend'
                  : 'English'}
              </span>
            </div>
          </div>
        </div>

        {/* Brain 2: Memory Brain */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Database className="w-4 h-4 text-blue-600" />
              <span>2. Memory Brain</span>
            </span>
            <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
              PERSISTENT STORE
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 font-medium">Active Child: </span>
              <span className="font-medium text-slate-800 dark:text-slate-100">{memoryBrain.childName}</span>
            </div>
            {memoryBrain.newFeedbackExtracted ? (
              <div className="bg-blue-50 dark:bg-blue-950/60 p-2 rounded-lg border border-blue-200 dark:border-blue-800 text-[11px]">
                <span className="font-bold text-blue-800 dark:text-blue-300 block">Extracted Parent Feedback:</span>
                <span className="text-blue-900 dark:text-blue-200">"{memoryBrain.newFeedbackExtracted}"</span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">No new feedback extracted in this turn.</p>
            )}
            {memoryBrain.milestoneUpdateDetected && (
              <div className="text-[11px] text-emerald-700 font-medium flex items-center space-x-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Milestone achieved: {memoryBrain.milestoneUpdateDetected}</span>
              </div>
            )}
          </div>
        </div>

        {/* Brain 3: Recommendation Brain */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <span>3. Recommendation Brain</span>
            </span>
            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
              RAG AUGMENTED
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            {recommendationBrain.ragMaterialsRetrieved.length > 0 ? (
              <div>
                <span className="text-slate-400 font-medium block mb-1">RAG Materials Retrieved:</span>
                {recommendationBrain.ragMaterialsRetrieved.map(mat => (
                  <div key={mat.id} className="text-[11px] bg-white dark:bg-slate-900 p-1.5 rounded border border-slate-200 dark:border-slate-700 mb-1">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{mat.title}</span>
                    <span className="text-slate-400 block">Domain: {mat.domain}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">General conversation; no deep RAG retrieval needed.</p>
            )}

            {recommendationBrain.recommendationSource && recommendationBrain.recommendationSource !== 'none' && (
              <div>
                <span className="text-slate-400 font-medium">Source: </span>
                <span className="text-amber-700 dark:text-amber-400 font-semibold">
                  {recommendationBrain.recommendationSource.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
            )}

            {recommendationBrain.suggestedActivity && (
              <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-900 text-[11px] space-y-1">
                <strong className="text-amber-900 dark:text-amber-300 block">{recommendationBrain.suggestedActivity.title}</strong>
                <p className="text-amber-800 dark:text-amber-200">{recommendationBrain.suggestedActivity.parentTip}</p>
                {recommendationBrain.suggestedActivity.resourcesUsed && recommendationBrain.suggestedActivity.resourcesUsed.length > 0 && (
                  <p className="text-amber-700 dark:text-amber-300 font-medium">
                    Resources: {recommendationBrain.suggestedActivity.resourcesUsed.join(', ')}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Brain 4: Engagement & Nudge Brain */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3.5 border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center space-x-1.5">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>4. Engagement Brain</span>
            </span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full font-semibold">
              ORGANIC CADENCE
            </span>
          </div>

          <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
            <div>
              <span className="text-slate-400 font-medium">Warmth Rating: </span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{engagementBrain.emotionalWarmthRating || 9} / 10</span>
            </div>
            <div>
              <span className="text-slate-400 font-medium">Check-in Cadence: </span>
              <span>Organic & silence-triggered (not fixed daily morning/evening alarms)</span>
            </div>
            {engagementBrain.nudgeText && (
              <div className="bg-rose-50 dark:bg-rose-950/50 p-2 rounded border border-rose-200 dark:border-rose-900 text-[11px] text-rose-900 dark:text-rose-200 italic">
                "{engagementBrain.nudgeText}"
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brain 5: Escalation Brain (Full Width) */}
      <div className={`rounded-xl p-4 border transition ${
        escalationBrain.adminAlertTriggered
          ? 'bg-red-50 dark:bg-red-950/50 border-red-300 dark:border-red-800'
          : escalationBrain.therapistEscalationTriggered
          ? 'bg-purple-50 dark:bg-purple-950/50 border-purple-300 dark:border-purple-800'
          : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200/80 dark:border-slate-800'
      }`}>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-slate-800 dark:text-slate-100 flex items-center space-x-1.5">
            <ShieldAlert className={`w-4 h-4 ${
              escalationBrain.adminAlertTriggered ? 'text-red-600' : escalationBrain.therapistEscalationTriggered ? 'text-purple-600' : 'text-slate-500'
            }`} />
            <span>5. Escalation Brain (Safety & Professional Bridge)</span>
          </span>
          <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold ${
            escalationBrain.adminAlertTriggered
              ? 'bg-red-600 text-white animate-pulse'
              : escalationBrain.therapistEscalationTriggered
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
          }`}>
            {escalationBrain.adminAlertTriggered ? '[ALERT_ADMIN] TRIGGERED' : escalationBrain.therapistEscalationTriggered ? 'THERAPIST ESCALATED' : 'STANDBY (SAFE)'}
          </span>
        </div>

        {escalationBrain.adminAlertTriggered && (
          <div className="text-xs text-red-900 dark:text-red-200 mb-2 font-medium">
            ⚠️ Crisis / Admin Escalation Triggered: Route dispatched to personal Kenyan phone via WhatsApp/SMS alert.
          </div>
        )}

        {escalationBrain.therapistEscalationTriggered ? (
          <div className="space-y-2 text-xs">
            <div className="text-purple-950 dark:text-purple-200">
              <span className="font-semibold">Specialist Recommendation: </span>
              <span>{escalationBrain.recommendedTherapistName || 'Dr. Wanjiku Mwangi, OTR/L'}</span>
            </div>
            <div className="text-purple-900 dark:text-purple-300">
              <span className="font-semibold">Session Topic: </span>
              <span>{escalationBrain.scheduledSessionTopic}</span>
            </div>
            <button
              type="button"
              onClick={onOpenTherapist}
              className="mt-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>View Appointment & Specialist Details</span>
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">
            No red flags detected. Child's play is progressing normally. Escalation brain monitors sensory resistance, distress, or requests for human therapists.
          </p>
        )}
      </div>
    </div>
  );
};
