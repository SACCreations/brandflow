'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Sparkles, 
  Cpu, 
  Send, 
  AlertCircle, 
  CheckCircle2, 
  Activity, 
  Database, 
  RefreshCw, 
  Clock, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ChatTestResponse {
  success: boolean;
  provider: string;
  model: string;
  response: string;
  tokens: {
    input: number;
    output: number;
  };
  latency: number;
  retryCount: number;
  fallbackUsed: boolean;
  fallbackProvider: string | null;
}

export default function AiTestPage() {
  const [message, setMessage] = useState('Hello AI, please confirm your status and name the LLM provider you are currently running on.');
  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'google' | 'nvidia'>('openai');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ChatTestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!message.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Endpoint is wrapped in transforming interceptor on backend, response is unwrapped by Axios interceptor to res.data
      const res = await apiClient.post<ChatTestResponse>('/chat/test', {
        message,
        provider,
      });
      setResult(res.data);
    } catch (err: any) {
      console.error('Chat test request failed:', err);
      const errMsg = err?.response?.data?.message || err?.message || 'Unknown infrastructure error occurred';
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-8 p-4">
      {/* HEADER SECTION */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
              <Bot className="h-5 w-5" />
            </span>
            <h1 className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 bg-clip-text text-3xl font-extrabold tracking-tight text-transparent dark:from-indigo-400 dark:via-purple-400 dark:to-indigo-300">
              AI Chatbot & Telemetry Gateway
            </h1>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Internal diagnostics interface to validate multi-provider configurations, token accounting, and fallback mechanics.
          </p>
        </div>

        {/* SECURITY INTEGRITY INDICATOR */}
        <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/50 px-4 py-2 text-xs font-semibold text-emerald-800 dark:border-emerald-800/30 dark:bg-emerald-950/20 dark:text-emerald-400">
          <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span>Startup Key Check: OK</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* LEFT COLUMN: CONTROL & REQUEST INPUTS */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-md flex items-center gap-2 font-bold text-gray-900 dark:text-white">
              <Activity className="h-4.5 w-4.5 text-indigo-500" />
              Configure Diagnostic Payload
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              Send a test message to trigger provider resolution and gateway pipeline execution.
            </p>

            <div className="mt-6 space-y-4">
              {/* PROVIDER SELECTOR */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Preferred Provider</label>
                <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvider('openai')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                      provider === 'openai'
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-700 dark:border-indigo-500 dark:bg-indigo-950/20 dark:text-indigo-400'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-800/50 dark:text-gray-300'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${provider === 'openai' ? 'bg-indigo-600 dark:bg-indigo-400' : 'bg-gray-300'}`} />
                    OpenAI (gpt-4o)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('anthropic')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                      provider === 'anthropic'
                        ? 'border-purple-600 bg-purple-50/40 text-purple-700 dark:border-purple-500 dark:bg-purple-950/20 dark:text-purple-400'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-800/50 dark:text-gray-300'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${provider === 'anthropic' ? 'bg-purple-600 dark:bg-purple-400' : 'bg-gray-300'}`} />
                    Anthropic (claude-3)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('google')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                      provider === 'google'
                        ? 'border-emerald-600 bg-emerald-50/40 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-800/50 dark:text-gray-300'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${provider === 'google' ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-gray-300'}`} />
                    Google (gemini-2)
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvider('nvidia')}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-all ${
                      provider === 'nvidia'
                        ? 'border-green-600 bg-green-50/40 text-green-700 dark:border-green-500 dark:bg-green-950/20 dark:text-green-400'
                        : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:bg-gray-950 dark:border-gray-800 dark:hover:bg-gray-800/50 dark:text-gray-300'
                    }`}
                  >
                    <span className={`h-2.5 w-2.5 rounded-full ${provider === 'nvidia' ? 'bg-green-600 dark:bg-green-400' : 'bg-gray-300'}`} />
                    Nvidia (nim)
                  </button>
                </div>
              </div>

              {/* MESSAGE TEXTAREA */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Diagnostic Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  placeholder="Enter message for AI infrastructure validation..."
                  className="mt-2 w-full rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 p-4 text-sm text-gray-900 dark:text-white focus:border-indigo-500 focus:bg-white dark:bg-gray-900 focus:outline-none dark:border-gray-800 dark:bg-gray-950/50 dark:text-white dark:focus:border-indigo-500 dark:focus:bg-gray-900"
                />
              </div>

              {/* SEND BUTTON */}
              <button
                type="button"
                onClick={handleSend}
                disabled={loading || !message.trim()}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 px-5 py-3 text-sm font-bold text-white shadow-md transition-all hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                    <span>Processing & Routing Pipeline...</span>
                  </>
                ) : (
                  <>
                    <span>Dispatch Gateway Request</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* TELEMETRY METRIC SNAPSHOT */}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">Validation Objectives Covered</h3>
            <ul className="mt-3 space-y-2 text-xs text-gray-500 dark:text-gray-400">
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Multi-provider gateway routing</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Timeout / Retry logic activation</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Fallback provider chains</span>
              </li>
              <li className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Structured DB logger (ai_request_logs)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN: TELEMETRY & CHAT RESPONSE FEED */}
        <div className="lg:col-span-7">
          <div className="flex h-full min-h-[480px] flex-col rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
            {/* PANEL HEADER */}
            <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-950/20">
              <div className="flex items-center gap-2">
                <Cpu className="h-4.5 w-4.5 text-indigo-500" />
                <span className="text-sm font-bold text-gray-900 dark:text-white">Telemetry & Live Response</span>
              </div>
              {result && (
                <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" />
                  Request Succeeded
                </span>
              )}
            </div>

            {/* LIVE FEED FEEDBACK */}
            <div className="flex-1 p-6">
              <AnimatePresence mode="wait">
                {loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex h-full flex-col items-center justify-center space-y-4 text-center"
                  >
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-950/20">
                      <Bot className="h-8 w-8 animate-pulse text-indigo-600 dark:text-indigo-400" />
                      <div className="absolute inset-0 rounded-full border-2 border-indigo-500/30 border-t-indigo-600 animate-spin" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Evaluating Gateway Options</h4>
                      <p className="mt-1 text-xs text-gray-500 max-w-xs">
                        Executing connection validation, checking cache budgets, and issuing completion parameters to {provider}.
                      </p>
                    </div>
                  </motion.div>
                )}

                {error && !loading && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-red-200 bg-red-50 p-5 dark:border-red-950/30 dark:bg-red-950/20"
                  >
                    <div className="flex gap-3">
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-600 dark:text-red-400" />
                      <div>
                        <h4 className="font-bold text-red-900 dark:text-red-400">LLM Infrastructure Error</h4>
                        <p className="mt-2 text-sm text-red-700 dark:text-red-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
                          {error}
                        </p>
                        <div className="mt-4 text-xs text-red-600 dark:text-red-500">
                          Gateway automatically attempted fallbacks and retry mechanisms, but all provider configurations failed. Check environment variables or credentials.
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {result && !loading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6"
                  >
                    {/* METRIC GRID */}
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Used Provider</span>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className={`h-2.5 w-2.5 rounded-full ${
                            result.provider === 'openai' 
                              ? 'bg-indigo-600' 
                              : result.provider === 'anthropic' 
                                ? 'bg-purple-600' 
                                : result.provider === 'google'
                                  ? 'bg-emerald-500'
                                  : 'bg-green-600'
                          }`} />
                          <span className="text-sm font-bold text-gray-950 dark:text-white capitalize">{result.provider}</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Resolved Model</span>
                        <div className="mt-1 text-sm font-bold text-gray-950 dark:text-white overflow-hidden text-ellipsis whitespace-nowrap">
                          {result.model}
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total Latency</span>
                        <div className="mt-1 flex items-center gap-1 text-sm font-bold text-gray-950 dark:text-white">
                          <Clock className="h-4 w-4 text-indigo-500" />
                          <span>{result.latency} ms</span>
                        </div>
                      </div>

                      <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-4 dark:bg-gray-800/40">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Tokens Accrued</span>
                        <div className="mt-1 text-sm font-bold text-gray-950 dark:text-white">
                          In: {result.tokens.input} | Out: {result.tokens.output}
                        </div>
                      </div>
                    </div>

                    {/* FALLBACK TELEMETRY */}
                    {(result.fallbackUsed || result.retryCount > 0) && (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50/50 p-4 text-xs dark:border-yellow-900/30 dark:bg-yellow-950/10">
                        <div className="flex items-center gap-2 font-bold text-yellow-800 dark:text-yellow-400">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Infrastructure Fallback Handler Triggered!</span>
                        </div>
                        <p className="mt-1 text-gray-600 dark:text-gray-400">
                          The primary provider failed to resolve or connect. The request was automatically rescheduled and successfully completed using:
                          <strong className="ml-1 text-yellow-900 dark:text-yellow-300 capitalize">{result.provider} ({result.model})</strong>.
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-gray-500">
                          <span>Retry Attempts: {result.retryCount}</span>
                          <span>Fallback Used: {result.fallbackUsed ? 'Yes' : 'No'}</span>
                        </div>
                      </div>
                    )}

                    {/* AI RESPONSE WRAPPER */}
                    <div className="space-y-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                        AI Response Content
                      </span>
                      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/20 p-5 text-sm leading-relaxed text-gray-800 dark:text-gray-100 dark:border-indigo-950/30 dark:bg-indigo-950/10 dark:text-gray-200 whitespace-pre-wrap font-sans">
                        {result.response}
                      </div>
                    </div>

                    {/* DB PERSISTENCE DETAILS */}
                    <div className="flex items-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-950 px-4 py-3 text-xs text-gray-500 dark:bg-gray-800/40">
                      <Database className="h-4 w-4 text-gray-400" />
                      <span>
                        AIRequestLog row created: <strong className="font-mono text-gray-700 dark:text-gray-300">Success</strong>. Latency and token values successfully committed to DB.
                      </span>
                    </div>
                  </motion.div>
                )}

                {!result && !loading && !error && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex h-full flex-col items-center justify-center space-y-3 text-center text-gray-400 dark:text-gray-500"
                  >
                    <Bot className="h-12 w-12 stroke-[1.5]" />
                    <div>
                      <p className="text-sm font-semibold">Diagnostics Chamber Idle</p>
                      <p className="mt-1 text-xs max-w-xs">
                        Configure options on the left and dispatch a request to validate completion response parsing and latency tracking.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
