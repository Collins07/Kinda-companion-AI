/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  X,
  Printer,
  Download,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Award,
  Send,
  Lock,
  FileSpreadsheet,
  RefreshCw,
  HelpCircle,
  Calendar
} from 'lucide-react';
import { ProgressReport } from '../types';
import { VERIFIED_THERAPISTS } from '../server/therapistDirectory';
import { downloadProgressReportPdf } from '../utils/pdfReportGenerator';

interface ProgressReportModalProps {
  report: ProgressReport | null;
  onRefreshReport?: (childId: string) => Promise<ProgressReport | null>;
  onShareWithSpecialist: (childId: string, therapistId: string, therapistName: string, handoffNote: string) => Promise<void>;
  onClose: () => void;
}

export const ProgressReportModal: React.FC<ProgressReportModalProps> = ({
  report,
  onRefreshReport,
  onShareWithSpecialist,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'full' | 'summary'>('full');
  const [selectedTherapistId, setSelectedTherapistId] = useState(VERIFIED_THERAPISTS[0]?.id || '');
  const [handoffNote, setHandoffNote] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [downloadingMode, setDownloadingMode] = useState<'full' | 'summary' | null>(null);
  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  if (!report) return null;

  const handleDownloadPdf = async (mode: 'full' | 'summary') => {
    if (downloadingMode) return;
    setDownloadingMode(mode);
    setDownloadFeedback(null);
    try {
      let latestReport = report;
      if (onRefreshReport) {
        const refreshed = await onRefreshReport(report.childId);
        if (refreshed) latestReport = refreshed;
      }
      const filename = downloadProgressReportPdf(latestReport, mode);
      setDownloadFeedback(`Downloaded ${mode === 'summary' ? 'Summary' : 'Full'} PDF: ${filename}`);
      setTimeout(() => setDownloadFeedback(null), 5000);
    } catch {
      setDownloadFeedback('Unable to generate PDF download right now. Please try again.');
    } finally {
      setDownloadingMode(null);
    }
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

  const statusBadgeStyle = (status: string) => {
    if (status === 'Consistent') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (status === 'Practising') return 'bg-blue-100 text-blue-800 border-blue-200';
    if (status === 'Emerging') return 'bg-amber-100 text-amber-800 border-amber-200';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:static print:bg-white print:p-0">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden print:max-h-none print:shadow-none print:border-0">
        {/* Top Action Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  Caregiver Companion Progress Report: {report.childName}
                </h2>
                <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center space-x-1">
                  <Lock className="w-2.5 h-2.5" />
                  <span>ADMIN &amp; SPECIALISTS ONLY</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Snapshot {report.snapshotId} • {report.generatedAtEAT}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={downloadingMode !== null}
              onClick={() => handleDownloadPdf('summary')}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
            >
              {downloadingMode === 'summary' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileSpreadsheet className="w-3.5 h-3.5" />}
              <span>{downloadingMode === 'summary' ? 'Preparing...' : 'Download Summary PDF'}</span>
            </button>

            <button
              type="button"
              disabled={downloadingMode !== null}
              onClick={() => handleDownloadPdf('full')}
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-xs transition"
            >
              {downloadingMode === 'full' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{downloadingMode === 'full' ? 'Preparing...' : 'Download Full PDF'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Print</span>
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

        {/* View Mode Switcher */}
        <div className="bg-white dark:bg-slate-900 px-6 py-2.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('full')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'full'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Full Report
            </button>
            <button
              type="button"
              onClick={() => setViewMode('summary')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'summary'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Summary Report
            </button>
          </div>

          {downloadFeedback && (
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-lg flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{downloadFeedback}</span>
            </span>
          )}
        </div>

        {/* Report Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-slate-800 dark:text-slate-200 printable-content">
          {/* Official Letterhead: Big Title "Kinda Care" (Capital K and C) */}
          <div className="border-b-2 border-emerald-600 pb-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                <span className="text-amber-900 dark:text-amber-300">Kinda</span>{' '}
                <span className="text-emerald-700 dark:text-emerald-400">Care</span>
              </h1>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mt-1.5">
                Caregiver Companion Progress Report
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Snapshot ID: <span className="font-mono font-semibold">{report.snapshotId}</span> • {report.generatedAtEAT}
              </p>
            </div>
            <div className="text-right text-xs text-slate-500 space-y-0.5">
              <p><strong className="text-slate-700 dark:text-slate-300">Period:</strong> {report.reportingPeriod}</p>
              <p><strong className="text-slate-700 dark:text-slate-300">Messages:</strong> {report.totalConversations} • <strong className="text-slate-700 dark:text-slate-300">Observations:</strong> {report.totalObservationsLogged}</p>
            </div>
          </div>

          {/* Child Meta Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
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
          </div>

          {/* 1. Summary (Evidence-cited paragraphs, max 200 words, ZERO scores/percentages) */}
          <div className="bg-blue-50/60 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900 text-xs space-y-2">
            <h3 className="font-bold text-sm text-blue-900 dark:text-blue-300">
              Summary
            </h3>
            <div className="space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed text-[12px]">
              {(viewMode === 'summary' ? report.executiveSummaryParagraphs : report.summaryParagraphs).map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          </div>

          {/* 2. Domains (No percentages or scores — strictly 5+ dated observations threshold) */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Domains</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {report.domainProgress.map((domain, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-100">{domain.domain}</span>
                    <span className={`text-[10.5px] px-2 py-0.5 rounded-md border font-semibold shrink-0 ${statusBadgeStyle(domain.status)}`}>
                      {domain.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Dated observations logged: <strong className="text-slate-700 dark:text-slate-200">{domain.observationCount}</strong>
                  </div>
                  {viewMode === 'full' && (
                    <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                      {domain.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Caregiver-reported milestones */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>Caregiver-reported milestones</span>
            </h3>
            {report.caregiverReportedMilestones.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {report.caregiverReportedMilestones.map((ms, idx) => (
                  <li key={idx} className="bg-emerald-50/50 dark:bg-emerald-950/20 px-3 py-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/50 space-y-0.5">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      <span>{ms.date} • {ms.domain.toUpperCase()}</span>
                      <div className="flex items-center gap-1.5">
                        {ms.isProgression && (
                          <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                            PROGRESSION
                          </span>
                        )}
                        {ms.interventionRef && (
                          <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                            Intervention: {ms.interventionRef}
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="font-medium">{ms.milestone}</p>
                    <p className="italic text-slate-500 dark:text-slate-400 text-[11px]">"{ms.quote}"</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">No caregiver-reported milestones logged yet.</p>
            )}
          </div>

          {/* 4. Parent-reported observations with quotes & translations (Full view) */}
          {viewMode === 'full' && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Parent-reported observations
              </h3>
              {report.parentFeedbackHighlights.length > 0 ? (
                <div className="space-y-2">
                  {report.parentFeedbackHighlights.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between text-slate-500 text-[10.5px]">
                        <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                          {item.date}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.isInterventionOutcome && item.interventionRef && (
                            <span className="bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                              Intervention Outcome ({item.interventionRef})
                            </span>
                          )}
                          {item.needsReview && (
                            <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                              OT Review Queue
                            </span>
                          )}
                        </div>
                      </div>
                      <blockquote className="italic font-medium text-slate-800 dark:text-slate-100 border-l-2 border-emerald-500 pl-2">
                        "{item.parentQuote}"
                      </blockquote>
                      {item.englishTranslation && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          <strong>Translation: </strong>{item.englishTranslation}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-600 dark:text-slate-300">
                        <strong className="text-slate-700 dark:text-slate-200">Why this matters: </strong>
                        {item.whyThisMatters}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No parent-reported observations logged yet.</p>
              )}
            </div>
          )}

          {/* 5. Open questions for the specialist */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-blue-600" />
              <span>Open questions for the specialist</span>
            </h3>
            {report.openQuestionsForSpecialist.length > 0 ? (
              <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300 list-disc pl-5">
                {report.openQuestionsForSpecialist.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-500 italic">None recorded yet.</p>
            )}
          </div>

          {/* 6. Consents on file & Appointments on file */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Consents on file</span>
              </h4>
              <p><strong>Status:</strong> {report.consentsOnFile.granted ? 'Granted' : 'Pending caregiver consent'}</p>
              <p><strong>Version:</strong> {report.consentsOnFile.consentVersion}</p>
              <p><strong>Date (EAT):</strong> {report.consentsOnFile.consentDateEAT}</p>
              <p className="text-[11px] text-slate-500">{report.consentsOnFile.consentScope}</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Appointments on file</span>
              </h4>
              {report.appointmentsOnFile.length > 0 ? (
                <div className="space-y-1.5">
                  {report.appointmentsOnFile.map(apt => (
                    <div key={apt.id} className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
                      <div className="font-semibold text-slate-800 dark:text-slate-100">{apt.therapistName}</div>
                      <div className="text-slate-500">{apt.requestedDate} • {apt.time}</div>
                      <div className="text-purple-700 dark:text-purple-300 font-semibold mt-0.5">Status: {apt.status}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-500 italic">No appointments on file yet.</p>
              )}
            </div>
          </div>

          {/* Share Report with Specialist */}
          <div className="bg-purple-50/70 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200 dark:border-purple-900 space-y-3 print:hidden">
            <h4 className="text-xs font-bold text-purple-900 dark:text-purple-300 flex items-center space-x-1.5">
              <Send className="w-3.5 h-3.5 text-purple-600" />
              <span>Share Report Directly with Specialist</span>
            </h4>
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
                  placeholder="Optional handoff note for therapist..."
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
          </div>

          {/* Exact Standing Disclaimer Footer */}
          <div className="border-t border-slate-200 dark:border-slate-700 pt-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
            {report.standingFooter}
          </div>
        </div>

        {/* Modal Close Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>Kinda Care • Specialist Handoff Record</span>
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
