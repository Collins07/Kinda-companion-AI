/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  History,
  Sparkles,
  Quote,
  CheckCircle,
  Plus,
  Tag,
  Smile,
  Music,
  Puzzle,
  Eye,
  Heart
} from 'lucide-react';
import { ObservationFeedback, ChildProfile } from '../types';

interface ObservationsTimelineProps {
  child: ChildProfile;
  observations: ObservationFeedback[];
  onAddObservation: (obs: Partial<ObservationFeedback>) => Promise<void>;
  onGenerateReport: () => void;
}

export const ObservationsTimeline: React.FC<ObservationsTimelineProps> = ({
  child,
  observations,
  onAddObservation,
  onGenerateReport
}) => {
  const [newQuote, setNewQuote] = useState('');
  const [category, setCategory] = useState<ObservationFeedback['category']>('milestone');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuote.trim() || isSubmitting) return;
    setIsSubmitting(true);
    await onAddObservation({
      childId: child.id,
      rawParentMessage: newQuote,
      category,
      insightSummary: `Caregiver observation logged: ${newQuote.slice(0, 60)}`,
      whyThisMatters: 'Logged caregiver observation to inform home play support and specialist summaries.',
      detectedEmotion: 'neutral'
    });
    setNewQuote('');
    setIsSubmitting(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'milestone':
        return <span className="bg-emerald-100 text-emerald-800 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Sparkles className="w-3 h-3" /><span>Milestone</span></span>;
      case 'speech':
        return <span className="bg-purple-100 text-purple-800 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Music className="w-3 h-3" /><span>Speech &amp; Words</span></span>;
      case 'sensory':
        return <span className="bg-amber-100 text-amber-800 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Eye className="w-3 h-3" /><span>Sensory Modulation</span></span>;
      case 'motor':
        return <span className="bg-blue-100 text-blue-800 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Puzzle className="w-3 h-3" /><span>Motor &amp; Play</span></span>;
      default:
        return <span className="bg-slate-100 text-slate-800 text-[11px] px-2 py-0.5 rounded font-semibold flex items-center space-x-1"><Tag className="w-3 h-3" /><span>{cat}</span></span>;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 flex items-center justify-center">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Caregiver Observation Bank</h3>
            <p className="text-[11px] text-slate-500">
              Dated caregiver-reported observations for {child.name}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGenerateReport}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Open Progress Report</span>
        </button>
      </div>

      {/* Manual Observation Quick Adder */}
      <form onSubmit={handleSubmit} className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
        <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
          Log Caregiver Observation for {child.name}:
        </span>
        <div className="flex gap-2">
          <input
            type="text"
            value={newQuote}
            onChange={(e) => setNewQuote(e.target.value)}
            placeholder={`e.g. Today ${child.name} stacked four cups alone without help...`}
            className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2 py-1.5 text-xs text-slate-700 dark:text-slate-200"
          >
            <option value="milestone">Milestone</option>
            <option value="speech">Speech/Words</option>
            <option value="sensory">Sensory</option>
            <option value="motor">Motor</option>
            <option value="emotional">Emotional</option>
          </select>
          <button
            type="submit"
            disabled={!newQuote.trim() || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Store</span>
          </button>
        </div>
      </form>

      {/* Timeline List */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {observations.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No caregiver observations logged yet. Once consent is granted and {child.caregiverName} shares updates, they will appear here.
          </div>
        ) : (
          observations.map((obs) => (
            <div
              key={obs.id}
              className="bg-white dark:bg-slate-800/80 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs space-y-1.5"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  {getCategoryBadge(obs.category)}
                  <span className="text-[11px] font-medium text-slate-500">
                    {obs.reportedDateDisplay ||
                      new Date(obs.reportedDate || obs.timestamp).toLocaleDateString('en-KE', {
                        timeZone: 'Africa/Nairobi',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                  </span>
                  {obs.isProgression && (
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-bold">
                      PROGRESSION
                    </span>
                  )}
                  {obs.isInterventionOutcome && obs.interventionRef && (
                    <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                      Intervention: {obs.interventionRef}
                    </span>
                  )}
                  {obs.needsReview && (
                    <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold">
                      OT Review Queue
                    </span>
                  )}
                </div>
                {obs.verifiedByTherapist && (
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-medium flex items-center space-x-0.5">
                    <CheckCircle className="w-3 h-3 text-purple-600" />
                    <span>Specialist Reviewed</span>
                  </span>
                )}
              </div>

              <div className="flex items-start space-x-2 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-lg border-l-3 border-emerald-500">
                <Quote className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 opacity-70" />
                <p className="text-xs italic text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                  &quot;{obs.rawParentMessage}&quot;
                </p>
              </div>

              {obs.englishTranslation && (
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  <strong>Translation: </strong>{obs.englishTranslation}
                </div>
              )}

              <div className="text-[11.5px] text-slate-600 dark:text-slate-300">
                <strong className="text-slate-700 dark:text-slate-200">Observation: </strong>
                {obs.insightSummary}
              </div>

              {obs.whyThisMatters && (
                <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                  Why this matters: {obs.whyThisMatters}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
