/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  MessageSquare,
  FileText,
  UserCheck,
  BookOpen,
  Github,
  Sparkles,
  ShieldCheck,
  CreditCard,
  History,
  Layers,
  HeartHandshake,
  CheckCircle2,
  RefreshCw,
  PhoneCall
} from 'lucide-react';
import {
  ChildProfile,
  ChatMessage,
  ObservationFeedback,
  FiveBrainAnalysis,
  TherapistAppointment,
  ProgressReport
} from './types';
import { WhatsAppPhone } from './components/WhatsAppPhone';
import { FiveBrainsPanel } from './components/FiveBrainsPanel';
import { ChildProfileDrawer } from './components/ChildProfileDrawer';
import { ObservationsTimeline } from './components/ObservationsTimeline';
import { ProgressReportModal } from './components/ProgressReportModal';
import { TherapistDirectoryModal } from './components/TherapistDirectoryModal';
import { RAGLibraryModal } from './components/RAGLibraryModal';
import { WhatsAppApiModal } from './components/WhatsAppApiModal';
import { GitHubPublishModal } from './components/GitHubPublishModal';

export default function App() {
  const [children, setChildren] = useState<ChildProfile[]>([]);
  const [selectedChildId, setSelectedChildId] = useState<string>('child_joash');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [observations, setObservations] = useState<ObservationFeedback[]>([]);
  const [appointments, setAppointments] = useState<TherapistAppointment[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<FiveBrainAnalysis | undefined>(undefined);
  const [activeRightTab, setActiveRightTab] = useState<'brains' | 'feedback' | 'profile'>('brains');
  const [isLoadingChat, setIsLoadingChat] = useState(false);

  // Modals
  const [showReportModal, setShowReportModal] = useState(false);
  const [progressReportData, setProgressReportData] = useState<ProgressReport | null>(null);
  const [showTherapistModal, setShowTherapistModal] = useState(false);
  const [showRAGModal, setShowRAGModal] = useState(false);
  const [showWhatsAppApiModal, setShowWhatsAppApiModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);

  // Active child object
  const activeChild = children.find(c => c.id === selectedChildId) || children[0] || {
    id: 'child_joash',
    name: 'Joash',
    caregiverName: 'Mama Brandon',
    caregiverPhone: '+254712345678',
    ageMonths: 48,
    gender: 'boy' as const,
    developmentalStage: 'Early Preschool - Sensory & Attention',
    strengths: ['Curious', 'Enjoys co-play with Mama'],
    sensitivities: ['Red-coded tiles aversion / visual defensiveness'],
    currentMilestones: [],
    favoriteActivities: ['Color tiles puzzle'],
    subscriptionTier: 'free' as const,
    odpcConsent: { granted: true, parentConfirmedIdentity: true },
    notes: ''
  };

  // Fetch initial children list
  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/children');
      const data = await res.json();
      if (data.children && data.children.length > 0) {
        setChildren(data.children);
      }
    } catch (err) {
      console.warn('Failed to load children profiles, using local seed:', err);
    }
  };

  // Fetch messages, observations, appointments when selected child changes
  const loadChildData = async (childId: string) => {
    try {
      const [msgRes, obsRes, apptRes] = await Promise.all([
        fetch(`/api/messages/${childId}`),
        fetch(`/api/observations/${childId}`),
        fetch(`/api/appointments?childId=${childId}`)
      ]);

      const [msgData, obsData, apptData] = await Promise.all([
        msgRes.json(),
        obsRes.json(),
        apptRes.json()
      ]);

      if (msgData.messages) {
        setMessages(msgData.messages);
        // Find latest message with 5-brain analysis
        const lastWithAnalysis = [...msgData.messages].reverse().find(m => m.fiveBrainAnalysis);
        if (lastWithAnalysis) {
          setSelectedAnalysis(lastWithAnalysis.fiveBrainAnalysis);
        }
      }
      if (obsData.observations) setObservations(obsData.observations);
      if (apptData.appointments) setAppointments(apptData.appointments);
    } catch (err) {
      console.warn('Error loading child messages/observations:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      loadChildData(selectedChildId);
    }
  }, [selectedChildId]);

  // Send message
  const handleSendMessage = async (text: string, replyToId?: string) => {
    setIsLoadingChat(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          message: text,
          replyToId
        })
      });

      const data = await res.json();
      if (data.success) {
        setMessages(prev => [...prev, data.parentMessage, data.replyMessage]);
        if (data.fiveBrainAnalysis) {
          setSelectedAnalysis(data.fiveBrainAnalysis);
        }
        // Refresh observations and appointments
        await loadChildData(activeChild.id);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // Proactive Nudge Trigger
  const handleTriggerNudge = async (type: 'morning_mission' | 'midday_checkin' | 'evening_reflection') => {
    setIsLoadingChat(true);
    try {
      const res = await fetch('/api/nudge/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          nudgeType: type
        })
      });
      const data = await res.json();
      if (data.success && data.nudge) {
        setMessages(prev => [...prev, data.nudge]);
        if (data.nudge.fiveBrainAnalysis) {
          setSelectedAnalysis(data.nudge.fiveBrainAnalysis);
        }
      }
    } catch (err) {
      console.error('Nudge error:', err);
    } finally {
      setIsLoadingChat(false);
    }
  };

  // M-Pesa STK Push Simulation
  const handleTriggerMpesa = async () => {
    try {
      const res = await fetch('/api/daraja/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          amount: 300,
          phone: activeChild.caregiverPhone
        })
      });
      const data = await res.json();
      if (data.ResponseCode === '0') {
        // Refresh child and messages
        await loadInitialData();
        await loadChildData(activeChild.id);
      }
    } catch (err) {
      console.error('M-Pesa STK push error:', err);
    }
  };

  // Generate Report
  const handleOpenReport = async () => {
    try {
      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: activeChild.id })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setProgressReportData(data.report);
        setShowReportModal(true);
      }
    } catch (err) {
      console.error('Generate report error:', err);
    }
  };

  // Add observation manually
  const handleAddObservation = async (obs: Partial<ObservationFeedback>) => {
    try {
      const res = await fetch('/api/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(obs)
      });
      if (res.ok) {
        await loadChildData(activeChild.id);
      }
    } catch (err) {
      console.error('Add observation error:', err);
    }
  };

  // Book appointment
  const handleBookAppointment = async (appt: Partial<TherapistAppointment>) => {
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appt)
      });
      if (res.ok) {
        await loadChildData(activeChild.id);
      }
    } catch (err) {
      console.error('Book appointment error:', err);
    }
  };

  // Update Child Profile
  const handleUpdateChild = async (updated: ChildProfile) => {
    try {
      const res = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        await loadInitialData();
      }
    } catch (err) {
      console.error('Update child error:', err);
    }
  };

  // Toggle ODPC Consent
  const handleConsentToggle = async (granted: boolean) => {
    try {
      const res = await fetch('/api/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId: activeChild.id, granted })
      });
      if (res.ok) {
        await loadInitialData();
      }
    } catch (err) {
      console.error('Consent error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Application Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008069] text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
              <span className="text-sm font-black tracking-tight">KC</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">Kinda Care</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  5-Brains WhatsApp AI
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                Contextual Caregiver Companion • RAG Activity Intelligence • Therapist Escalation
              </p>
            </div>
          </div>

          {/* Child Switcher Ribbon */}
          <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] font-semibold text-slate-500 px-2 hidden md:inline">Child:</span>
            {children.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedChildId(c.id)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedChildId === c.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {/* Navigation Action Buttons */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleOpenReport}
              className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Generate Cumulative Child Milestone Progress Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Progress Report</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTherapistModal(true)}
              className="bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Kenyan Therapist Directory (Kiambu, Nairobi, Virtual)"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Specialists</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRAGModal(true)}
              className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Verified RAG Educational Materials"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">RAG Library</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWhatsAppApiModal(true)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Meta WhatsApp Cloud API Webhook Integration"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">WhatsApp API</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGitHubModal(true)}
              className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              title="Publish and Push to GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive WhatsApp Simulator Matching Screenshot */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="w-full mb-2 flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Live Companion Simulator</span>
            </span>
            <span className="text-[11px] text-emerald-600 font-medium">
              Meta Cloud API Ready
            </span>
          </div>

          <WhatsAppPhone
            child={activeChild}
            messages={messages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingChat}
            onSelectAnalysis={(analysis) => {
              setSelectedAnalysis(analysis);
              setActiveRightTab('brains');
            }}
            onOpenReport={handleOpenReport}
            onOpenTherapist={() => setShowTherapistModal(true)}
            onTriggerNudge={handleTriggerNudge}
            onTriggerMpesa={handleTriggerMpesa}
          />
        </div>

        {/* Right Column: 5-Brains Inspector, Parent Feedback Vault & Child Profile */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          {/* Sub Navigation Tabs for Right Panel */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveRightTab('brains')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeRightTab === 'brains'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Brain className="w-4 h-4" />
              <span>5-Brains Neural Monitor</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab('feedback')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeRightTab === 'feedback'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Parent Feedback Bank ({observations.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveRightTab('profile')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition ${
                activeRightTab === 'profile'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Profile & ODPC Consent</span>
            </button>
          </div>

          {/* Active Tab Component */}
          {activeRightTab === 'brains' && (
            <FiveBrainsPanel
              analysis={selectedAnalysis}
              child={activeChild}
              onOpenReport={handleOpenReport}
              onOpenTherapist={() => setShowTherapistModal(true)}
            />
          )}

          {activeRightTab === 'feedback' && (
            <ObservationsTimeline
              child={activeChild}
              observations={observations}
              onAddObservation={handleAddObservation}
              onGenerateReport={handleOpenReport}
            />
          )}

          {activeRightTab === 'profile' && (
            <ChildProfileDrawer
              child={activeChild}
              childrenList={children}
              onSelectChild={(id) => setSelectedChildId(id)}
              onUpdateChild={handleUpdateChild}
              onConsentToggle={handleConsentToggle}
            />
          )}

          {/* Quick Context Card */}
          <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900 text-xs text-amber-900 dark:text-amber-200 space-y-1.5">
            <h4 className="font-bold flex items-center space-x-1.5 text-xs text-amber-950 dark:text-amber-100">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>How Kinda Care AI Adapts in Real-Time:</span>
            </h4>
            <p className="text-[11.5px] leading-relaxed">
              When <strong>Mama Brandon</strong> talks about <strong>Joash</strong>, the AI recalls his resistance to red-coded tiles ("Hiyo bado alizipangua") and schedules an occupational therapy session for Saturday with <strong>Dr. Wanjiku Mwangi</strong> in Kiambu. If she expresses exhaustion ("I'm exhausted"), it switches to <strong>Caregiver Rest Mode</strong> instead of forcing an activity. If <strong>Mama Bravin</strong> says he did a puzzle alone or <strong>Sharon</strong> sings complete words, it indexes those milestones directly into their longitudinal developmental report!
            </p>
          </div>
        </div>
      </main>

      {/* Modals */}
      <ProgressReportModal
        report={progressReportData}
        onClose={() => setShowReportModal(false)}
      />

      {showTherapistModal && (
        <TherapistDirectoryModal
          child={activeChild}
          appointments={appointments}
          onBookAppointment={handleBookAppointment}
          onClose={() => setShowTherapistModal(false)}
        />
      )}

      {showRAGModal && (
        <RAGLibraryModal
          onClose={() => setShowRAGModal(false)}
        />
      )}

      {showWhatsAppApiModal && (
        <WhatsAppApiModal
          onClose={() => setShowWhatsAppApiModal(false)}
        />
      )}

      {showGitHubModal && (
        <GitHubPublishModal
          onClose={() => setShowGitHubModal(false)}
        />
      )}
    </div>
  );
}
