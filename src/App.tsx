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
  ShieldCheck,
  History
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
  const [selectedChildId, setSelectedChildId] = useState<string>('child_nancy');
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

  const activeChild: ChildProfile = children.find(c => c.id === selectedChildId) || children[0] || {
    id: 'child_nancy',
    name: 'Nancy',
    caregiverName: 'Mama Nancy',
    caregiverPhone: '+254711223344',
    ageMonths: 42,
    gender: 'girl',
    developmentalStage: 'Early Preschool — Sensory Play & Everyday Communication',
    strengths: ['Curious about music and rhythm', 'Enjoys sorting household cups'],
    sensitivities: ['Bright red puzzle tiles', 'Loud sudden blender noises'],
    currentMilestones: [],
    favoriteActivities: ['Clapping songs', 'Water pouring with cups'],
    subscriptionTier: 'free',
    odpcConsent: {
      granted: false,
      parentConfirmedIdentity: false,
      consentVersion: 'ODPC-KE-v2.1-2026',
      consentScope: 'Caregiver developmental support, observation logging & specialist referral handoff'
    },
    notes: ''
  };

  const loadInitialData = async () => {
    try {
      const res = await fetch('/api/children');
      const data = await res.json();
      if (data.children && data.children.length > 0) {
        setChildren(data.children);
      }
    } catch {
      // keep fallback state silently
    }
  };

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
        const lastWithAnalysis = [...msgData.messages].reverse().find(m => m.fiveBrainAnalysis);
        setSelectedAnalysis(lastWithAnalysis?.fiveBrainAnalysis);
      }
      if (obsData.observations) setObservations(obsData.observations);
      if (apptData.appointments) setAppointments(apptData.appointments);
    } catch {
      // ignore transient network errors
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedChildId) {
      setMessages([]);
      setObservations([]);
      setAppointments([]);
      setSelectedAnalysis(undefined);
      setProgressReportData(null);
      loadChildData(selectedChildId);
    }
  }, [selectedChildId]);

  // Poll softly if the latest reply came from queued retry holding state
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg?.fiveBrainAnalysis?.conversationBrain?.isQueuedRetry) return;
    const timer = setInterval(() => {
      loadChildData(activeChild.id);
    }, 3500);
    return () => clearInterval(timer);
  }, [messages, activeChild.id]);

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
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.parentMessage, data.replyMessage]);
        if (data.fiveBrainAnalysis) {
          setSelectedAnalysis(data.fiveBrainAnalysis);
        }
        await loadInitialData();
        await loadChildData(activeChild.id);
      }
    } catch {
      // Never expose raw API errors in caregiver UI
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleSendMediaAttempt = async (mediaType: 'image' | 'audio' | 'video' | 'document') => {
    setIsLoadingChat(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: activeChild.id,
          mediaType
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMessages(prev => [...prev, data.parentMessage, data.replyMessage]);
        if (data.fiveBrainAnalysis) setSelectedAnalysis(data.fiveBrainAnalysis);
      }
    } catch {
      // silent
    } finally {
      setIsLoadingChat(false);
    }
  };

  const handleTriggerNudge = async (type: 'quiet_parent_checkin' | 'organic_random_checkin') => {
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
      if (res.ok && data.success && data.nudge) {
        setMessages(prev => [...prev, data.nudge]);
        if (data.nudge.fiveBrainAnalysis) {
          setSelectedAnalysis(data.nudge.fiveBrainAnalysis);
        }
      }
    } catch {
      // silent
    } finally {
      setIsLoadingChat(false);
    }
  };

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
        await loadInitialData();
        await loadChildData(activeChild.id);
      }
    } catch {
      // silent
    }
  };

  const fetchChildProgressReport = async (childId: string): Promise<ProgressReport | null> => {
    try {
      const res = await fetch('/api/report/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId })
      });
      const data = await res.json();
      if (data.success && data.report) {
        setProgressReportData(data.report);
        return data.report as ProgressReport;
      }
    } catch {
      // silent
    }
    return null;
  };

  const handleOpenReport = async () => {
    const report = await fetchChildProgressReport(activeChild.id);
    if (report) {
      setShowReportModal(true);
    }
  };

  const handleShareWithSpecialist = async (
    childId: string,
    therapistId: string,
    therapistName: string,
    handoffNote: string
  ) => {
    try {
      const res = await fetch('/api/report/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId, therapistId, therapistName, handoffNote })
      });
      const data = await res.json();
      if (data.success && progressReportData) {
        setProgressReportData({
          ...progressReportData,
          sharedWithSpecialists: data.sharedWithSpecialists
        });
      }
    } catch {
      // silent
    }
  };

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
    } catch {
      // silent
    }
  };

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
    } catch {
      // silent
    }
  };

  const handleConfirmAppointment = async (
    appointmentId: string,
    confirmedDate: string,
    confirmedTime: string
  ) => {
    try {
      const res = await fetch('/api/appointments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId, confirmedDate, confirmedTime })
      });
      if (res.ok) {
        await loadChildData(activeChild.id);
      }
    } catch {
      // silent
    }
  };

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
    } catch {
      // silent
    }
  };

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
    } catch {
      // silent
    }
  };

  const handleResetSession = async (childId: string) => {
    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ childId })
      });
      if (res.ok) {
        setProgressReportData(null);
        await loadInitialData();
        await loadChildData(childId);
      }
    } catch {
      // silent
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans">
      {/* Top Application Navbar */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#008069] text-white flex items-center justify-center font-black shadow-md shadow-emerald-600/20">
              <span className="text-sm font-black tracking-tight">KC</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-base font-extrabold text-slate-900 dark:text-white">Kinda Care</span>
                <span className="text-xs bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                  Caregiver Companion
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                WhatsApp Caregiver Support • Verified Activity Library • Specialist Bridge
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
              title="Open Caregiver Companion Progress Report"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Progress Report</span>
            </button>

            <button
              type="button"
              onClick={() => setShowTherapistModal(true)}
              className="bg-purple-50 dark:bg-purple-950/60 border border-purple-300 dark:border-purple-800 text-purple-800 dark:text-purple-300 hover:bg-purple-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Kenyan Specialist Directory & Booking Requests"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Specialists</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRAGModal(true)}
              className="bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 hover:bg-amber-100 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Verified Caregiver Support Library"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">RAG Library</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWhatsAppApiModal(true)}
              className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition"
              title="Meta WhatsApp Cloud API Webhook"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">WhatsApp API</span>
            </button>

            <button
              type="button"
              onClick={() => setShowGitHubModal(true)}
              className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              title="Push to GitHub"
            >
              <Github className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">GitHub</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
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
            onSendMediaAttempt={handleSendMediaAttempt}
            isLoading={isLoadingChat}
            onSelectAnalysis={(analysis) => {
              setSelectedAnalysis(analysis);
              setActiveRightTab('brains');
            }}
            onOpenTherapist={() => setShowTherapistModal(true)}
            onTriggerNudge={handleTriggerNudge}
            onTriggerMpesa={handleTriggerMpesa}
          />
        </div>

        {/* Right Column: Care-Team & Specialist Console */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Kinda Care Care-Team &amp; Specialist Console</span>
            </span>
            <span className="text-[11px] bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 px-2 py-0.5 rounded-full font-semibold">
              Internal Only • Hidden from Parent WhatsApp
            </span>
          </div>

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
              <span>5-Brain Monitors</span>
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
              <span>Observations ({observations.length})</span>
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
              <span>Profile &amp; ODPC Consent</span>
            </button>
          </div>

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
              onResetSession={handleResetSession}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <ProgressReportModal
        report={showReportModal ? progressReportData : null}
        onRefreshReport={fetchChildProgressReport}
        onShareWithSpecialist={handleShareWithSpecialist}
        onClose={() => setShowReportModal(false)}
      />

      {showTherapistModal && (
        <TherapistDirectoryModal
          child={activeChild}
          appointments={appointments}
          onBookAppointment={handleBookAppointment}
          onConfirmAppointment={handleConfirmAppointment}
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
