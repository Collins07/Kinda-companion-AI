/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  Copy,
  Check,
  Send,
  Terminal,
  ShieldAlert,
  ExternalLink,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';

interface WhatsAppApiModalProps {
  onClose: () => void;
}

export const WhatsAppApiModal: React.FC<WhatsAppApiModalProps> = ({ onClose }) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [testPayloadResult, setTestPayloadResult] = useState<any>(null);
  const [isTesting, setIsTesting] = useState(false);

  const currentHost = typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com';
  const webhookUrl = `${currentHost}/api/webhook/whatsapp`;
  const verifyToken = 'kinda_care_webhook_secret_2026';

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestVerify = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch(`/api/webhook/whatsapp?hub.mode=subscribe&hub.verify_token=${verifyToken}&hub.challenge=test_challenge_12345`);
      const body = await res.text();
      if (res.ok && body.includes('test_challenge_12345')) {
        setTestStatus('SUCCESS: Meta webhook verification handshake passed! Challenge echoed correctly.');
      } else {
        setTestStatus(`ERROR: Status ${res.status}. Output: ${body}`);
      }
    } catch (err: any) {
      setTestStatus(`FAILED: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestInboundPayload = async () => {
    setIsTesting(true);
    setTestPayloadResult(null);
    try {
      const samplePayload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: '1234567890',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: {
                    display_phone_number: '+254712345678',
                    phone_number_id: 'sample_phone_id'
                  },
                  contacts: [{ profile: { name: 'Mama Brandon' }, wa_id: '254712345678' }],
                  messages: [
                    {
                      from: '+254712345678',
                      id: 'wamid.HBgSAMPLE' + Date.now(),
                      timestamp: Math.floor(Date.now() / 1000).toString(),
                      type: 'text',
                      text: { body: 'He is enjoying the color puzzle as long as I play with him.' }
                    }
                  ]
                },
                field: 'messages'
              }
            ]
          }
        ]
      };

      const res = await fetch('/api/webhook/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayload)
      });
      const data = await res.json();
      setTestPayloadResult(data);
    } catch (err: any) {
      setTestPayloadResult({ error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Meta WhatsApp Business Platform & Cloud API Webhook Hub
              </h2>
              <p className="text-xs text-slate-500">
                Connect your official WhatsApp Cloud API number, verify webhook endpoints, and dispatch messages
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
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 dark:text-slate-300">
          {/* Quick Endpoint Credentials Box */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
              Meta Webhook Configuration Values
            </h3>

            <div className="space-y-2">
              <div>
                <label className="text-slate-500 block mb-1 text-[11px] font-medium">Callback URL (Webhook URL)</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={webhookUrl}
                    className="flex-1 font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'url')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1"
                  >
                    {copiedField === 'url' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'url' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-slate-500 block mb-1 text-[11px] font-medium">Verify Token</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    readOnly
                    value={verifyToken}
                    className="flex-1 font-mono text-[11px] bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-slate-800 dark:text-slate-200"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(verifyToken, 'token')}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1"
                  >
                    {copiedField === 'token' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedField === 'token' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Test Handshake Section */}
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800 space-y-3">
            <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs">
              Live Webhook Diagnostics & Sandbox Testing
            </h4>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleTestVerify}
                disabled={isTesting}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-lg flex items-center space-x-1.5 shadow-xs transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                <span>Test Webhook Verification (GET)</span>
              </button>

              <button
                type="button"
                onClick={handleTestInboundPayload}
                disabled={isTesting}
                className="bg-white dark:bg-slate-800 border border-emerald-300 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/50 px-3 py-1.5 rounded-lg font-semibold flex items-center space-x-1.5 transition"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Simulate Meta Inbound Message (POST)</span>
              </button>
            </div>

            {testStatus && (
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-300 font-mono text-[11px] text-emerald-800 dark:text-emerald-300">
                {testStatus}
              </div>
            )}

            {testPayloadResult && (
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-300 font-mono text-[11px] space-y-1">
                <span className="font-bold text-emerald-700">Webhook Response Payload:</span>
                <pre className="text-slate-700 dark:text-slate-300 overflow-x-auto">
                  {JSON.stringify(testPayloadResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Meta Cloud API Production Step-by-Step */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">
              How to Link to a Real WhatsApp Business Phone Number (Meta Cloud API)
            </h4>

            <ol className="list-decimal list-inside space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed">
              <li>
                <strong>Go to Meta for Developers:</strong> Visit <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">developers.facebook.com</code>, sign in with your business account, and click <em>Create App</em> (type: <em>Other &gt; Business</em>).
              </li>
              <li>
                <strong>Add WhatsApp Product:</strong> Click <em>Set up</em> under WhatsApp. You will receive a Test Phone Number and temporary Access Token.
              </li>
              <li>
                <strong>Configure Webhooks:</strong> In the sidebar under WhatsApp &gt; Configuration:
                <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-slate-500">
                  <li>Paste the <strong>Callback URL</strong> from above.</li>
                  <li>Paste the <strong>Verify Token</strong> (<code className="font-mono">kinda_care_webhook_secret_2026</code>).</li>
                  <li>Click <em>Verify and Save</em>.</li>
                  <li>Under Webhook fields, click <em>Manage</em> and subscribe to <strong>messages</strong>.</li>
                </ul>
              </li>
              <li>
                <strong>Add Environment Variables:</strong> Set <code className="font-mono">WHATSAPP_TOKEN</code> and <code className="font-mono">WHATSAPP_PHONE_NUMBER_ID</code> in your server environment.
              </li>
              <li>
                <strong>Send a WhatsApp message:</strong> From any phone, text your WhatsApp number. The server automatically routes it through the 5 brains, updates child memory, and responds in seconds!
              </li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-3 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-emerald-600 text-white font-semibold px-4 py-1.5 rounded-lg hover:bg-emerald-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
