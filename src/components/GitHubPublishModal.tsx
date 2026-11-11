/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Github,
  X,
  Copy,
  Check,
  Terminal,
  GitBranch,
  ShieldCheck,
  ArrowRight,
  Code
} from 'lucide-react';

interface GitHubPublishModalProps {
  onClose: () => void;
}

export const GitHubPublishModal: React.FC<GitHubPublishModalProps> = ({ onClose }) => {
  const [githubRepoUrl, setGithubRepoUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const cleanRepoUrl = githubRepoUrl.trim() || 'https://github.com/<YOUR_USERNAME>/kinda-care-ai.git';

  const commands = `# 1. Initialize git and commit all Kinda Care AI files
git init
git add .
git commit -m "feat: complete kinda care AI 5-brain whatsapp companion service"

# 2. Set default branch to main
git branch -M main

# 3. Add your remote GitHub repository
git remote add origin ${cleanRepoUrl}

# 4. Push and publish to GitHub
git push -u origin main`;

  const handleCopy = () => {
    navigator.clipboard.writeText(commands);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Push & Publish Kinda Care AI to GitHub
              </h2>
              <p className="text-xs text-slate-500">
                Deploy your 5-Brain WhatsApp service, RAG library, and progress report engine to your repository
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs text-slate-700 dark:text-slate-300">
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 space-y-1.5">
            <h4 className="font-bold text-xs flex items-center space-x-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Full Production Repository Built & Ready</span>
            </h4>
            <p className="text-[11.5px] leading-relaxed">
              All backend endpoints (<code className="font-mono text-blue-800 dark:text-blue-300">/api/webhook/whatsapp</code>, <code className="font-mono">/api/chat</code>, <code className="font-mono">/api/report/generate</code>), the Gemini 5-brain engine, Kenyan therapist directory, RAG knowledge base, and React WhatsApp simulator are fully configured and ready to be pushed to your GitHub account.
            </p>
          </div>

          {/* GitHub Repo URL input */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-800 dark:text-slate-200 text-xs block">
              Enter your GitHub Repository URL (or keep default):
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={githubRepoUrl}
                onChange={(e) => setGithubRepoUrl(e.target.value)}
                placeholder="https://github.com/your-username/kinda-care-ai.git"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
              />
            </div>
          </div>

          {/* Copyable Terminal Commands */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] flex items-center space-x-1.5">
                <Terminal className="w-3.5 h-3.5 text-emerald-600" />
                <span>Run in your Terminal</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="bg-slate-900 hover:bg-black text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Commands!' : 'Copy Commands'}</span>
              </button>
            </div>

            <pre className="bg-slate-900 text-emerald-300 p-4 rounded-2xl font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
              {commands}
            </pre>
          </div>

          {/* Repository Structure Overview */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
              What's Included in Your Repository:
            </h4>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block">📡 Meta WhatsApp Webhook</strong>
                <span className="text-slate-500">Cloud API verification & event processing</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block">🧠 5-Brains Gemini Engine</strong>
                <span className="text-slate-500">Conversation, Memory, RAG, Nudge, Escalation</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block">📊 Progress Report Engine</strong>
                <span className="text-slate-500">Synthesis from day 1 to present</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                <strong className="text-slate-900 dark:text-white block">🇰🇪 Kenya ODPC & M-Pesa</strong>
                <span className="text-slate-500">Child data consent & STK Push simulator</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-900 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-black transition"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
