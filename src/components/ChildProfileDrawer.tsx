/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  AlertCircle,
  Plus,
  Heart,
  Eye,
  Calendar,
  Sparkles,
  Phone,
  FileText
} from 'lucide-react';
import { ChildProfile } from '../types';

interface ChildProfileDrawerProps {
  child: ChildProfile;
  childrenList: ChildProfile[];
  onSelectChild: (id: string) => void;
  onUpdateChild: (child: ChildProfile) => Promise<void>;
  onConsentToggle: (granted: boolean) => Promise<void>;
}

export const ChildProfileDrawer: React.FC<ChildProfileDrawerProps> = ({
  child,
  childrenList,
  onSelectChild,
  onUpdateChild,
  onConsentToggle
}) => {
  const [newSensitivity, setNewSensitivity] = useState('');
  const [newStrength, setNewStrength] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleAddSensitivity = async () => {
    if (!newSensitivity.trim()) return;
    const updated = {
      ...child,
      sensitivities: [...child.sensitivities, newSensitivity.trim()]
    };
    await onUpdateChild(updated);
    setNewSensitivity('');
  };

  const handleRemoveSensitivity = async (index: number) => {
    const updated = {
      ...child,
      sensitivities: child.sensitivities.filter((_, i) => i !== index)
    };
    await onUpdateChild(updated);
  };

  const handleAddStrength = async () => {
    if (!newStrength.trim()) return;
    const updated = {
      ...child,
      strengths: [...child.strengths, newStrength.trim()]
    };
    await onUpdateChild(updated);
    setNewStrength('');
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs flex flex-col space-y-4">
      {/* Header & Child Switcher */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Child Profile & Memory Context</h3>
            <p className="text-[11px] text-slate-500">
              Personalized developmental traits guiding the 5 brains
            </p>
          </div>
        </div>

        {/* Switch child selector */}
        <select
          value={child.id}
          onChange={(e) => onSelectChild(e.target.value)}
          className="bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs rounded-lg px-2.5 py-1 text-slate-800 dark:text-slate-100 font-semibold focus:outline-none"
        >
          {childrenList.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name} ({c.caregiverName})
            </option>
          ))}
        </select>
      </div>

      {/* Child Summary Card */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white flex items-center space-x-1.5">
              <span>{child.name}</span>
              <span className="text-xs font-normal text-slate-500">
                ({Math.floor(child.ageMonths / 12)} years old)
              </span>
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
              Caregiver: {child.caregiverName} • {child.caregiverPhone}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Stage: {child.developmentalStage}
            </p>
          </div>

          <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
            child.subscriptionTier === 'premium' ? 'bg-amber-100 text-amber-900 border border-amber-300' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {child.subscriptionTier}
          </span>
        </div>

        {/* Sensory Sensitivities / Aversions */}
        <div className="space-y-1.5">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <Eye className="w-3.5 h-3.5 text-amber-500" />
            <span>Sensory Sensitivities / Defensiveness:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            {child.sensitivities.map((sens, idx) => (
              <span
                key={idx}
                className="bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 text-xs px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900 flex items-center space-x-1"
              >
                <span>{sens}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSensitivity(idx)}
                  className="text-amber-500 hover:text-amber-800 ml-1 text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-1.5 pt-1">
            <input
              type="text"
              value={newSensitivity}
              onChange={(e) => setNewSensitivity(e.target.value)}
              placeholder="e.g. Red tile aversion, loud sudden sounds..."
              className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleAddSensitivity}
              className="bg-amber-600 hover:bg-amber-700 text-white px-2.5 py-1 rounded-lg text-xs font-semibold"
            >
              Add
            </button>
          </div>
        </div>

        {/* Strengths */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <Heart className="w-3.5 h-3.5 text-rose-500" />
            <span>Known Strengths & Preferences:</span>
          </span>

          <div className="flex flex-wrap gap-1.5">
            {child.strengths.map((str, idx) => (
              <span
                key={idx}
                className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 text-xs px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-900"
              >
                {str}
              </span>
            ))}
          </div>
        </div>

        {/* Active Milestones Tracked */}
        <div className="space-y-1.5 pt-1">
          <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Active Milestones:</span>
          </span>

          <div className="space-y-1">
            {child.currentMilestones.map((m, idx) => (
              <div key={idx} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                <span className="text-slate-800 dark:text-slate-200">{m.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  m.status === 'achieved' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {m.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Kenya ODPC Consent Compliance Card */}
      <div className="bg-emerald-50/80 dark:bg-emerald-950/40 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center space-x-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Kenya ODPC Child Data Protection</span>
          </span>
          <span className="bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
            {child.odpcConsent.granted ? 'CONSENT ACTIVE' : 'CONSENT PENDING'}
          </span>
        </div>

        <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
          In compliance with the Kenya Office of the Data Protection Commissioner (ODPC):
          Parental permission is recorded before storing child profiles. Parents can view, export, or request deletion of personal developmental records at any time.
        </p>

        <div className="flex items-center justify-between pt-1">
          <button
            type="button"
            onClick={() => onConsentToggle(!child.odpcConsent.granted)}
            className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 underline"
          >
            {child.odpcConsent.granted ? 'Revoke / Request Data Deletion' : 'Grant Parental Consent'}
          </button>
          <span className="text-[10px] text-slate-400">
            ODPC Reg: Cap 411A Laws of Kenya
          </span>
        </div>
      </div>
    </div>
  );
};
