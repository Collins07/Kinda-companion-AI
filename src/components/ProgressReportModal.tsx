/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  X,
  Printer,
  Sparkles,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck,
  TrendingUp,
  Brain,
  Award,
  Send,
  Lock
} from 'lucide-react';
import { ProgressReport } from '../types';
import { VERIFIED_THERAPISTS } from '../server/therapistDirectory';

interface ProgressReportModalProps {
  report: ProgressReport | null;
  onShareWithSpecialist: (childId: string, therapistId: string, therapistName: string, handoffNote: string) => Promise<void>;
  onClose: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  report,
  onShareWithSpecialist,
  onClose
}) => {
  const [selectedTherapistId, setSelectedTherapistId] = useState(VERIFIED_THERAPISTS[0]?.id || '');
  const [handoffNote, setHandoffNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);

  if (!report) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    const therapist = VERIFIED_THERAPISTS.find(t => t.id === selectedTherapistId);
    if (!therapist || isSharing) return;
    setIsSharing(true);
    await onShareWithSpecialist(report.childId, therapist.id, therapist.name, handoffNote);
    setHandoffNote('');
    setIsSharing(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Action Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Developmental Progress Report: {report.childName}
                </h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>KINDA CARE &amp; SPECIALISTS ONLY</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Period: {report.reportingPeriod} • Restricted from parent WhatsApp view
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handlePrint}
              className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Report Printable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 printable-content">
          {/* Official Letterhead */}
          <div className="border-b-2 border-emerald-600 pb-4 flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-xl font-black text-amber-900 dark:text-amber-300">kinda</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-400">Care</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded ml-2">CLINICAL COMPANION REPORT</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Kenya ODPC Compliant Child Profile • Long-Term Observation & Milestone Synthesis
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <p><strong className="text-slate-700 dark:text-slate-300">Total WhatsApp Interactions:</strong> {report.totalConversations}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Logged Parent Observations:</strong> {report.totalObservationsLogged}</p>
            </div>
          </div>

          {/* Child Meta Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">Child Name</span>
              <strong className="text-slate-900 dark:text-white text-sm">{report.childName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Chronological Age</span>
              <strong className="text-slate-900 dark:text-white text-sm">{report.age}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Primary Caregiver</span>
              <strong className="text-slate-900 dark:text-white text-sm">{report.caregiverName}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">Caregiver Consent</span>
              <span className="inline-flex items-center space-x-1 text-emerald-600 font-semibold mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Verified (Kenya ODPC)</span>
              </span>
            </div>
          </div>

          {/* Domain Mastery Bars */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Developmental Domain Progress & Mastery</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.domainProgress.map((domain, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{domain.domain}</span>
                    <span className="font-mono font-bold text-emerald-600">{domain.masteryPercentage}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        domain.masteryPercentage >= 80 ? 'bg-emerald-500' : domain.masteryPercentage >= 65 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${domain.masteryPercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${
                      domain.status === 'Excelling' ? 'bg-emerald-100 text-emerald-800' : domain.status === 'On Track' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {domain.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {domain.notes}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Parent Feedback Highlights (Verbatim Quotes) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Parent Observations Timeline & Milestone Unlocks</span>
            </h3>

            <div className="space-y-2">
              {report.parentFeedbackHighlights.map((item, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-[10.5px]">
                    <span className="font-medium text-emerald-600">{item.date}</span>
                    <span>Direct Caregiver WhatsApp Feedback</span>
                  </div>
                  <blockquote className="italic font-medium text-slate-800 dark:text-slate-100 border-l-2 border-emerald-500 pl-2">
                    "{item.parentQuote}"
                  </blockquote>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">
                    <strong className="text-slate-700 dark:text-slate-200">Significance: </strong>
                    {item.developmentalSignificance}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Sensory Profile Evolution */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Brain className="w-4 h-4 text-purple-600" />
              <span>Sensory Tolerance Evolution & Occupational Therapy Ladder</span>
            </h3>

            {report.sensoryProfileEvolution.map((sens, i) => (
              <div key={i} className="bg-purple-50/60 dark:bg-purple-950/30 p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-900 dark:text-purple-300">Identified Stimulus: {sens.trigger}</span>
                  <span className="text-[10px] bg-purple-200 dark:bg-purple-900 text-purple-900 dark:text-purple-200 px-2 py-0.5 rounded font-semibold">
                    Sensory Modulation
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
                  <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded">
                    <span className="text-slate-400 block">Initial Reaction</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{sens.initialReaction}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded">
                    <span className="text-slate-400 block">Current Reaction</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">{sens.currentReaction}</span>
                  </div>
                  <div className="bg-white/80 dark:bg-slate-900/60 p-2 rounded">
                    <span className="text-slate-400 block">Next Steps & Support</span>
                    <span className="text-purple-700 dark:text-purple-300 font-medium">{sens.nextSteps}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Clinical Specialist Summary */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs space-y-1.5">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>Pediatric Companion Clinical Summary</span>
            </h4>
            <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11.5px]">
              {report.clinicalTherapistSummary}
            </p>
          </div>

          {/* Upcoming Mission Goals */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider">
              Upcoming Micro-Mission Goals
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
              {report.upcomingMissionGoals.map((goal, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{goal}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Share Report with Specialist Section */}
          <div className="bg-purple-50/70 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-3 print:hidden">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center space-x-1.5">
                <Send className="w-3.5 h-3.5 text-purple-600" />
                <span>Share Report Directly with Specialist</span>
              </h4>
              <span className="text-[10px] text-purple-700 dark:text-purple-300 font-medium">
                Clinician Handoff
              </span>
            </div>

            <form onSubmit={handleShare} className="space-y-2 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  value={selectedTherapistId}
                  onChange={(e) => setSelectedTherapistId(e.target.value)}
                  className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                >
                  {VERIFIED_THERAPISTS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} — {t.specialty}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={handoffNote}
                  onChange={(e) => setHandoffNote(e.target.value)}
                  placeholder="Optional clinical handoff note for therapist..."
                  className="bg-white dark:bg-slate-900 border border-purple-200 dark:border-purple-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100"
                />
              </div>
              <button
                type="submit"
                disabled={isSharing}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSharing ? 'Sharing...' : 'Share Progress Report with Specialist'}</span>
              </button>
            </form>

            {report.sharedWithSpecialists && report.sharedWithSpecialists.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-purple-200/70 dark:border-purple-800/70">
                <span className="text-[10.5px] font-bold text-purple-800 dark:text-purple-300 block">
                  Shared Specialist Log:
                </span>
                {report.sharedWithSpecialists.map((s, idx) => (
                  <div key={idx} className="text-[11px] text-purple-900 dark:text-purple-200 flex items-center justify-between bg-white/80 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-lg">
                    <span>
                      <strong>{s.therapistName}</strong>
                      {s.handoffNote ? ` — "${s.handoffNote}"` : ''}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {new Date(s.sharedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
          <span>Kinda Care AI • Empowering African Caregivers with Contextual Intelligence</span>
          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-600 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
};
