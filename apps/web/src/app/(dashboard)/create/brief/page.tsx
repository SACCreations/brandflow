'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Target, 
  Users, 
  Sparkles, 
  ArrowRight, 
  Rocket, 
  TrendingUp, 
  Zap,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lightbulb,
  ShieldCheck
} from 'lucide-react';

export default function BriefBuilderPage() {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    objective: '',
    audience: '',
    platform: 'LinkedIn',
    cta: '',
    campaignTheme: '',
    businessGoal: '',
    tone: 'Professional',
  });

  const templates = [
    { id: 'product_launch', name: 'Product Launch', icon: <Rocket className="h-5 w-5" />, desc: 'Announce new features or products to the market.' },
    { id: 'seasonal_sale', name: 'Seasonal Sale', icon: <Zap className="h-5 w-5" />, desc: 'Drive conversion with time-limited promotions.' },
    { id: 'thought_leadership', name: 'Thought Leadership', icon: <TrendingUp className="h-5 w-5" />, desc: 'Establish authority with insightful industry content.' }
  ];

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplate(id);
    // In production, we'd fetch the template data from the API
    if (id === 'product_launch') {
      setFormData({ ...formData, objective: 'Launch Brandflow AI Intelligence Layer', audience: 'Enterprise CMOs and SaaS Founders' });
    }
    setStep(2);
  };

  const isStepComplete = (s: number) => {
    if (s === 1) return !!selectedTemplate;
    if (s === 2) return !!formData.objective && !!formData.audience;
    return !!formData.cta && !!formData.businessGoal;
  };

  return (
    <div className="flex h-[calc(100vh-140px)] flex-col gap-8 animate-in fade-in slide-in-from-right-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Strategy Brief Builder</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Define the "Why" before generating the "What".</p>
        </div>
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-2 w-12 rounded-full transition-all ${
                step === s ? 'bg-brand-600' : step > s ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-800'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="grid h-full gap-8 lg:grid-cols-12 overflow-hidden">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
          
          {step === 1 && (
            <div className="grid gap-6 md:grid-cols-3">
              {templates.map((t) => (
                <button 
                  key={t.id}
                  onClick={() => handleTemplateSelect(t.id)}
                  className={`group flex flex-col items-start rounded-2xl border p-6 text-left transition-all hover:border-brand-500 hover:shadow-xl ${
                    selectedTemplate === t.id ? 'border-brand-600 bg-brand-50/50 ring-2 ring-brand-500/20' : 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
                  }`}
                >
                  <div className={`mb-4 rounded-xl p-3 ${
                    selectedTemplate === t.id ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-gray-800'
                  }`}>
                    {t.icon}
                  </div>
                  <h3 className="mb-2 font-bold text-gray-900 dark:text-white">{t.name}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.desc}</p>
                </button>
              ))}
              <button className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-6 text-gray-400 hover:border-brand-500 hover:text-brand-500">
                <PlusIcon className="h-6 w-6 mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest">Custom Brief</span>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Target className="h-5 w-5 text-brand-600" /> Core Objectives
              </h2>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Content Objective</label>
                  <div className="relative">
                    <textarea 
                      className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                      placeholder="e.g., Introduce the new brand guidelines to our social audience..."
                      value={formData.objective}
                      onChange={(e) => setFormData({...formData, objective: e.target.value})}
                      rows={3}
                    />
                    <button className="absolute right-3 bottom-3 text-brand-600 hover:text-brand-700">
                      <Sparkles className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Target Audience</label>
                  <input 
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    placeholder="e.g., Mid-market SaaS Decision Makers"
                    value={formData.audience}
                    onChange={(e) => setFormData({...formData, audience: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setStep(1)} className="px-6 py-2 text-sm font-bold text-gray-500">Back</button>
                <button 
                  onClick={() => setStep(3)} 
                  disabled={!isStepComplete(2)}
                  className="rounded-xl bg-brand-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  Next Step
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-8 dark:border-gray-800 dark:bg-gray-900">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-500" /> Action & Conversion
              </h2>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Primary CTA</label>
                  <input 
                    type="text"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    placeholder="e.g., Book a Free Audit"
                    value={formData.cta}
                    onChange={(e) => setFormData({...formData, cta: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Business Goal</label>
                  <select 
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800"
                    value={formData.businessGoal}
                    onChange={(e) => setFormData({...formData, businessGoal: e.target.value})}
                  >
                    <option value="">Select a goal...</option>
                    <option value="lead_gen">Lead Generation</option>
                    <option value="engagement">Audience Engagement</option>
                    <option value="traffic">Website Traffic</option>
                    <option value="retention">Customer Retention</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={() => setStep(2)} className="px-6 py-2 text-sm font-bold text-gray-500">Back</button>
                <button 
                  onClick={() => window.location.href = '/create/content/new'}
                  disabled={!isStepComplete(3)}
                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-8 py-2 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                >
                  Finish Brief & Generate <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Sidebar Context Panel */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              AI Suggestions
            </h3>
            <div className="space-y-4">
              <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/20">
                <p className="text-[11px] text-amber-800/70 dark:text-amber-400/70 italic">
                  "CMOs respond best to 'efficiency' and 'traceability' messaging. Consider adding 'ROI Attribution' as a sub-topic."
                </p>
                <button className="mt-2 text-[10px] font-bold text-amber-600 uppercase tracking-wider hover:underline">Apply Insight</button>
              </div>
              <div className="rounded-xl bg-blue-50 p-4 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/20">
                <p className="text-[11px] text-blue-800/70 dark:text-blue-400/70 italic">
                  "LinkedIn carousel format is currently seeing 2x engagement for your brand. Suggesting 'Format: Visual PDF'."
                </p>
                <button className="mt-2 text-[10px] font-bold text-blue-600 uppercase tracking-wider hover:underline">Switch Format</button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-6 dark:border-emerald-500/10 dark:bg-emerald-500/5">
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Governance Check
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3 text-xs font-medium text-emerald-700 dark:text-emerald-400/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Tone aligned with Brand Voice
              </li>
              <li className="flex items-center gap-3 text-xs font-medium text-emerald-700 dark:text-emerald-400/80">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Platform-specific constraints met
              </li>
              <li className={`flex items-center gap-3 text-xs font-medium ${isStepComplete(3) ? 'text-emerald-700 dark:text-emerald-400/80' : 'text-gray-400'}`}>
                {isStepComplete(3) ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertCircle className="h-4 w-4" />} 
                Generation ready
              </li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
}

function PlusIcon(props: any) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </svg>
  );
}
