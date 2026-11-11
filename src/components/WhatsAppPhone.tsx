/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  Video,
  MoreVertical,
  ArrowLeft,
  Paperclip,
  Camera,
  Mic,
  Send,
  CheckCheck,
  Brain,
  Sparkles,
  HeartHandshake,
  Calendar,
  AlertTriangle,
  Play,
  RotateCcw,
  Zap,
  Coffee,
  MessageSquareHeart,
  CreditCard
} from 'lucide-react';
import { ChatMessage, ChildProfile, FiveBrainAnalysis } from '../types';

interface WhatsAppPhoneProps {
  child: ChildProfile;
  messages: ChatMessage[];
  onSendMessage: (text: string, replyToId?: string) => Promise<void>;
  isLoading: boolean;
  onSelectAnalysis: (analysis?: FiveBrainAnalysis) => void;
  onOpenReport: () => void;
  onOpenTherapist: () => void;
  onTriggerNudge: (type: 'morning_mission' | 'midday_checkin' | 'evening_reflection') => void;
  onTriggerMpesa: () => void;
}

export const WhatsAppPhone: React.FC<WhatsAppPhoneProps> = ({
  child,
  messages,
  onSendMessage,
  isLoading,
  onSelectAnalysis,
  onOpenReport,
  onOpenTherapist,
  onTriggerNudge,
  onTriggerMpesa
}) => {
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    const text = inputText;
    const repId = replyingTo?.id;
    setInputText('');
    setReplyingTo(null);
    await onSendMessage(text, repId);
  };

  const handleQuickScenario = (text: string) => {
    setInputText(text);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-[430px] mx-auto">
      {/* Phone Case Frame */}
      <div className="w-full bg-[#111b21] rounded-[44px] p-3 shadow-2xl border-4 border-slate-700/80 ring-1 ring-slate-800">
        {/* Notch / Speaker bar */}
        <div className="flex items-center justify-between px-6 pt-1 pb-2 text-slate-400 text-xs select-none">
          <span className="font-semibold text-slate-200">9:14</span>
          <div className="w-20 h-4 bg-black rounded-full mx-auto" />
          <div className="flex items-center space-x-1.5 text-[11px] text-slate-300">
            <span>0.83 KB/s</span>
            <span>📶</span>
            <span>96%</span>
          </div>
        </div>

        {/* WhatsApp App Container */}
        <div className="bg-[#efeae2] dark:bg-[#0b141a] rounded-[34px] overflow-hidden flex flex-col h-[670px] relative shadow-inner">
          {/* WhatsApp Header */}
          <div className="bg-[#008069] dark:bg-[#202c33] text-white px-3 py-2.5 flex items-center justify-between shadow-md z-10">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                className="text-white hover:bg-white/10 p-1 rounded-full transition"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              {/* Avatar with Kinda Play Wooden Logo */}
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#f6eee3] flex items-center justify-center border border-amber-300/60 overflow-hidden shadow">
                  <div className="text-center leading-none">
                    <span className="text-[10px] font-black tracking-tighter text-amber-900 block">kinda</span>
                    <span className="text-[11px] font-extrabold text-amber-800 block">Care</span>
                  </div>
                </div>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 border-2 border-[#008069] rounded-full"></span>
              </div>

              {/* Title & Status */}
              <div className="flex flex-col">
                <div className="flex items-center space-x-1">
                  <span className="font-semibold text-[15px] leading-snug">Kinda Care</span>
                  <span className="text-[10px] bg-emerald-500/30 text-emerald-100 font-medium px-1.5 py-0.2 rounded">AI</span>
                </div>
                <span className="text-xs text-emerald-100/90 font-light">online</span>
              </div>
            </div>

            {/* Header Action Icons */}
            <div className="flex items-center space-x-4 pr-1 text-white/95">
              <button
                type="button"
                onClick={onOpenTherapist}
                className="hover:text-emerald-200 transition"
                title="Therapist Directory & Virtual Call"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onOpenTherapist}
                className="hover:text-emerald-200 transition"
                title="Schedule Video Session"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={onOpenReport}
                className="hover:text-emerald-200 transition"
                title="Progress Report"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Subheader Context Ribbon (Child active badge) */}
          <div className="bg-[#00705c] dark:bg-[#182229] px-3 py-1 flex items-center justify-between text-[11px] text-emerald-100 border-t border-emerald-600/30">
            <span className="truncate">
              Caregiver: <strong className="text-white">{child.caregiverName}</strong> • Child: <strong className="text-white">{child.name}</strong> ({Math.floor(child.ageMonths / 12)}y)
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${child.subscriptionTier === 'premium' ? 'bg-amber-400 text-amber-950 font-bold' : 'bg-emerald-800 text-emerald-200'}`}>
              {child.subscriptionTier === 'premium' ? 'PREMIUM' : 'FREE TIER'}
            </span>
          </div>

          {/* WhatsApp Chat Canvas */}
          <div
            className="flex-1 overflow-y-auto p-3 space-y-2.5 relative"
            style={{
              backgroundImage: `radial-gradient(#d1d7db 1.2px, transparent 1.2px), radial-gradient(#d1d7db 1.2px, #efeae2 1.2px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px'
            }}
          >
            {/* Encryption notice banner */}
            <div className="flex justify-center my-1">
              <div className="bg-[#ffeecd] dark:bg-[#1f2c34] text-[#54656f] dark:text-[#8696a0] text-[10.5px] text-center px-3 py-1 rounded-lg shadow-xs max-w-[85%] border border-amber-200/50">
                🔒 Messages to Kinda Care are protected under Kenya ODPC child data guidelines. Long-term memory active.
              </div>
            </div>

            {/* Date divider */}
            <div className="flex justify-center my-1">
              <span className="bg-white/80 dark:bg-[#182229]/80 backdrop-blur-xs text-[#54656f] dark:text-[#8696a0] text-[11px] font-medium px-2.5 py-0.5 rounded-md shadow-xs">
                TODAY
              </span>
            </div>

            {/* Message list */}
            {messages.map((msg) => {
              const isUser = msg.sender === 'parent';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} group`}
                >
                  <div
                    className={`relative max-w-[84%] rounded-xl px-3 py-2 text-[13.5px] leading-relaxed shadow-sm transition-all ${
                      isUser
                        ? 'bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-[#e9edef] rounded-tr-none'
                        : 'bg-white dark:bg-[#202c33] text-[#111b21] dark:text-[#e9edef] rounded-tl-none border border-slate-200/60 dark:border-transparent'
                    }`}
                  >
                    {/* Quoted reply header if exists */}
                    {msg.replyToText && (
                      <div className="mb-1.5 pl-2 border-l-4 border-emerald-600 bg-black/5 dark:bg-black/20 rounded py-0.5 text-xs text-[#54656f] dark:text-[#8696a0]">
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-[11px]">Kinda Care</p>
                        <p className="line-clamp-1 italic text-[11px]">{msg.replyToText}</p>
                      </div>
                    )}

                    {/* Message text */}
                    <div className="whitespace-pre-wrap break-words">{msg.text}</div>

                    {/* Footer: timestamp + checkmarks + 5-brain inspection button */}
                    <div className="flex items-center justify-end space-x-1.5 mt-1 select-none">
                      {msg.fiveBrainAnalysis && (
                        <button
                          type="button"
                          onClick={() => onSelectAnalysis(msg.fiveBrainAnalysis)}
                          className="text-[10px] bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 px-1.5 py-0.5 rounded font-medium flex items-center space-x-0.5 transition"
                          title="View 5-Brains Neural Rationale"
                        >
                          <Brain className="w-2.5 h-2.5" />
                          <span>5-Brains</span>
                        </button>
                      )}

                      <span className="text-[10px] text-[#667781] dark:text-[#8696a0]">
                        {msg.timeDisplay || 'Just now'}
                      </span>

                      {isUser && (
                        <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                      )}
                    </div>
                  </div>

                  {/* Quick reply trigger on hover */}
                  <button
                    type="button"
                    onClick={() => setReplyingTo(msg)}
                    className="text-[10px] text-slate-500 opacity-0 group-hover:opacity-100 hover:text-emerald-600 px-1 transition mt-0.5"
                  >
                    Reply
                  </button>
                </div>
              );
            })}

            {/* Bot Typing Indicator */}
            {isLoading && (
              <div className="flex items-start">
                <div className="bg-white dark:bg-[#202c33] rounded-xl rounded-tl-none px-3.5 py-2 shadow-sm border border-slate-200/60 flex items-center space-x-1.5 text-xs text-slate-500">
                  <span className="font-medium text-emerald-600">Kinda Care is thinking</span>
                  <div className="flex space-x-1">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Replying banner */}
          {replyingTo && (
            <div className="bg-slate-100 dark:bg-[#182229] px-3 py-1.5 border-t border-slate-300 flex items-center justify-between text-xs">
              <div className="border-l-3 border-emerald-500 pl-2">
                <span className="text-[11px] font-semibold text-emerald-600">
                  Replying to {replyingTo.sender === 'parent' ? 'You' : 'Kinda Care'}:
                </span>
                <p className="line-clamp-1 text-slate-600 dark:text-slate-300 text-[11px]">{replyingTo.text}</p>
              </div>
              <button
                type="button"
                onClick={() => setReplyingTo(null)}
                className="text-slate-400 hover:text-slate-700 text-sm font-bold px-1"
              >
                ✕
              </button>
            </div>
          )}

          {/* Quick Scenario Pills (Kenya reality triggers from PDF/Screenshot) */}
          <div className="bg-[#efeae2]/90 dark:bg-[#0b141a]/90 backdrop-blur-xs px-2 py-1.5 border-t border-slate-200 dark:border-slate-800 flex items-center space-x-1.5 overflow-x-auto scrollbar-none text-[11px]">
            <span className="text-slate-400 text-[10px] font-semibold uppercase shrink-0">Try:</span>
            <button
              type="button"
              onClick={() => handleQuickScenario("He has been restless today but now he is calm")}
              className="bg-white dark:bg-[#202c33] text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs hover:border-emerald-500 whitespace-nowrap transition"
            >
              Restless to calm
            </button>
            <button
              type="button"
              onClick={() => handleQuickScenario("Hiyo bado. Alizipangua kwanza when we were starting to play together 😅")}
              className="bg-white dark:bg-[#202c33] text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs hover:border-emerald-500 whitespace-nowrap transition"
            >
              "Hiyo bado alizipangua 😅"
            </button>
            <button
              type="button"
              onClick={() => handleQuickScenario("I'm exhausted. Today was a very draining day.")}
              className="bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 px-2.5 py-1 rounded-full border border-amber-300 dark:border-amber-800/60 shadow-2xs hover:bg-amber-100 whitespace-nowrap transition flex items-center space-x-1"
            >
              <Coffee className="w-3 h-3" />
              <span>"I'm exhausted"</span>
            </button>
            <button
              type="button"
              onClick={() => handleQuickScenario("Today Bravin really did a puzzle kit alone! Completely by himself!")}
              className="bg-white dark:bg-[#202c33] text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs hover:border-emerald-500 whitespace-nowrap transition"
            >
              Bravin puzzle alone
            </button>
            <button
              type="button"
              onClick={() => handleQuickScenario("for the last few days Sharon has been singing using complete words")}
              className="bg-white dark:bg-[#202c33] text-slate-700 dark:text-slate-200 px-2.5 py-1 rounded-full border border-slate-300 dark:border-slate-700 shadow-2xs hover:border-emerald-500 whitespace-nowrap transition"
            >
              Sharon singing words
            </button>
            <button
              type="button"
              onClick={() => handleQuickScenario("I need an occupational therapist around Kiambu for sensory issues")}
              className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-2xs whitespace-nowrap transition"
            >
              Therapist in Kiambu
            </button>
          </div>

          {/* WhatsApp Bottom Chat Input Bar */}
          <form
            onSubmit={handleSend}
            className="bg-[#f0f2f5] dark:bg-[#202c33] p-2 flex items-center space-x-2 border-t border-slate-200 dark:border-slate-700"
          >
            {/* Input Pill */}
            <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-full flex items-center px-3 py-1.5 shadow-sm border border-slate-200 dark:border-transparent">
              <span className="text-slate-400 mr-2 text-base select-none">😊</span>
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Message"
                className="w-full bg-transparent focus:outline-none text-[13.5px] text-[#111b21] dark:text-[#d1d7db] placeholder-slate-400"
              />
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 mx-1.5"
                title="Attach Photo or Document"
              >
                <Paperclip className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Camera"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Circular Send / Voice Note Button */}
            <button
              type={inputText.trim() ? 'submit' : 'button'}
              disabled={isLoading}
              className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#02906f] active:scale-95 text-white flex items-center justify-center shadow-md transition shrink-0"
              title={inputText.trim() ? 'Send Message' : 'Hold for Voice Note'}
            >
              {inputText.trim() ? (
                <Send className="w-4 h-4 ml-0.5" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>

        {/* Bottom home indicator line */}
        <div className="w-32 h-1 bg-slate-500/60 rounded-full mx-auto mt-2.5 mb-1" />
      </div>

      {/* Simulator Shortcut Actions */}
      <div className="w-full mt-3 flex flex-wrap gap-2 justify-center items-center text-xs">
        <button
          type="button"
          onClick={() => onTriggerNudge('morning_mission')}
          className="bg-amber-100 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 hover:bg-amber-200 px-3 py-1.5 rounded-lg border border-amber-300 font-medium flex items-center space-x-1.5 transition"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Send Morning Nudge</span>
        </button>

        <button
          type="button"
          onClick={() => onTriggerNudge('midday_checkin')}
          className="bg-sky-100 dark:bg-sky-900/40 text-sky-900 dark:text-sky-200 hover:bg-sky-200 px-3 py-1.5 rounded-lg border border-sky-300 font-medium flex items-center space-x-1.5 transition"
        >
          <HeartHandshake className="w-3.5 h-3.5 text-sky-600" />
          <span>Check-in Nudge</span>
        </button>

        <button
          type="button"
          onClick={onTriggerMpesa}
          className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-900 dark:text-emerald-200 hover:bg-emerald-200 px-3 py-1.5 rounded-lg border border-emerald-300 font-medium flex items-center space-x-1.5 transition"
        >
          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
          <span>Simulate M-Pesa STK Push</span>
        </button>
      </div>
    </div>
  );
};
