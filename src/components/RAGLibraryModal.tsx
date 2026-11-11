/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BookOpen,
  X,
  Search,
  Sparkles,
  CheckCircle,
  Lightbulb,
  Heart,
  Music,
  Puzzle,
  Eye,
  FileCheck
} from 'lucide-react';
import { VERIFIED_EDUCATIONAL_MATERIALS } from '../server/knowledgeBase';
import { EducationalMaterial } from '../types';

interface RAGLibraryModalProps {
  onClose: () => void;
}

export const RAGLibraryModal: React.FC<RAGLibraryModalProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedMaterial, setSelectedMaterial] = useState<EducationalMaterial | null>(null);

  const filtered = VERIFIED_EDUCATIONAL_MATERIALS.filter(m => {
    let match = true;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      match = match && (m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.keywords.some(k => k.toLowerCase().includes(q)));
    }
    if (selectedDomain !== 'all') {
      match = match && m.domain === selectedDomain;
    }
    return match;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                RAG Knowledge Base: Verified Educational & Clinical Library
              </h2>
              <p className="text-xs text-slate-500">
                Therapist-reviewed play protocols, sensory ladders, early language acceleration, and Kenyan CBC play activities
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Domain Filter */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex flex-wrap gap-2.5 items-center">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search materials (e.g. red tiles, puzzle, singing, spelling)..."
              className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>

          <div className="flex flex-wrap gap-1 text-xs">
            {['all', 'sensory_play', 'singing', 'motor', 'reading', 'spelling', 'drawing'].map((dom) => (
              <button
                key={dom}
                type="button"
                onClick={() => setSelectedDomain(dom)}
                className={`px-2.5 py-1 rounded-lg font-medium transition ${
                  selectedDomain === dom
                    ? 'bg-amber-600 text-white'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                {dom === 'all' ? 'All Domains' : dom.replace('_', ' ').toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((mat) => (
            <div
              key={mat.id}
              onClick={() => setSelectedMaterial(mat)}
              className="bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 shadow-2xs hover:border-amber-400 cursor-pointer flex flex-col justify-between space-y-3 transition"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                    {mat.domain.replace('_', ' ')} • {mat.ageRange}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-0.5">
                    <FileCheck className="w-3 h-3" />
                    <span>Verified</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                  {mat.title}
                </h3>

                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3">
                  {mat.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs text-slate-500">
                <span>{mat.activities.length} Structured Micro-Play Steps</span>
                <span className="text-amber-600 font-semibold text-[11px]">View Protocol →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Material Detail Modal */}
        {selectedMaterial && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto border border-slate-200 dark:border-slate-700 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-[11px] font-bold text-amber-600 uppercase">
                    {selectedMaterial.domain} • {selectedMaterial.ageRange}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white mt-0.5">
                    {selectedMaterial.title}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedMaterial(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedMaterial.description}
              </p>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Step-by-Step Play Activities
                </h4>
                <div className="space-y-1.5">
                  {selectedMaterial.activities.map((act, idx) => (
                    <div key={idx} className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-200 flex items-start space-x-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0 text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{act}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-900 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                <strong className="block text-emerald-800 dark:text-emerald-300 font-bold">Caregiver Guidance & Encouragement:</strong>
                <p>{selectedMaterial.caregiverGuidance}</p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-200 dark:border-purple-900 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                <strong className="block text-purple-800 dark:text-purple-300 font-bold">Therapeutic Rationale:</strong>
                <p>{selectedMaterial.therapistRationale}</p>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedMaterial(null)}
                  className="bg-amber-600 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-amber-700 transition"
                >
                  Close Protocol
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
