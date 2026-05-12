'use client';

import React from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion, 
  ChevronRight, 
  ExternalLink,
  Info,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileSearch
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface Violation {
  type: string;
  severity: 'low' | 'medium' | 'high';
  detail: string;
  position?: number;
}

interface QualityChecksWidgetProps {
  score: number;
  passed: boolean;
  violations: Violation[];
  category?: string;
  remediation?: string;
}

export default function QualityChecksWidget({ 
  score = 85, 
  passed = true, 
  violations = [], 
  category = 'factual',
  remediation
}: QualityChecksWidgetProps) {
  
  // Mock violations if none provided for demo purposes
  const displayViolations = violations.length > 0 ? violations : [
    { type: 'tone_mismatch', severity: 'medium', detail: 'Informal language ("gonna") detected in professional brand voice.' },
    { type: 'factual_error', severity: 'high', detail: 'Claimed 50% discount contradicts "Sales Deck V4" (15%).' }
  ];

  const chartData = [
    { name: 'Score', value: score },
    { name: 'Remaining', value: 100 - score }
  ];

  const getScoreColor = () => {
    if (score >= 90) return '#10b981'; // emerald-500
    if (score >= 70) return '#f59e0b'; // amber-500
    return '#ef4444'; // red-500
  };

  return (
    <div className="flex flex-col h-full rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-brand-600" />
          <h3 className="font-bold text-gray-900 dark:text-white">AI Quality Guard</h3>
        </div>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
          passed ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' : 'bg-red-100 text-red-700 dark:bg-red-500/10'
        }`}>
          {passed ? 'Passed' : 'Review Required'}
        </span>
      </div>

      {/* Score Overview */}
      <div className="relative flex flex-col items-center justify-center p-6 bg-gray-50/50 dark:bg-gray-800/30">
        <div className="h-32 w-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={55}
                startAngle={90}
                endAngle={450}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                <Cell fill={getScoreColor()} />
                <Cell fill="rgba(0,0,0,0.05)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pt-6">
            <span className="text-2xl font-black text-gray-900 dark:text-white">{score}</span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Quality</span>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-gray-500 dark:text-gray-400 max-w-[200px]">
          Content is {score}% aligned with brand truth and voice.
        </p>
      </div>

      {/* Violation List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Findings ({displayViolations.length})</h4>
        
        {displayViolations.map((v, i) => (
          <div key={i} className="group relative rounded-xl border border-gray-100 bg-white p-3 transition-all hover:border-brand-500 dark:border-gray-800 dark:bg-gray-900/50">
            <div className="flex items-start gap-3">
              <div className={`mt-0.5 rounded-lg p-1.5 ${
                v.severity === 'high' ? 'bg-red-50 text-red-600 dark:bg-red-500/10' : 
                v.severity === 'medium' ? 'bg-amber-50 text-amber-600 dark:bg-amber-500/10' : 
                'bg-blue-50 text-blue-600 dark:bg-blue-500/10'
              }`}>
                {v.severity === 'high' ? <ShieldAlert className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold uppercase text-gray-400">{v.type.replace('_', ' ')}</span>
                  <span className={`text-[10px] font-bold px-1.5 rounded-md ${
                    v.severity === 'high' ? 'text-red-600 bg-red-50' : 'text-amber-600 bg-amber-50'
                  }`}>
                    {v.severity}
                  </span>
                </div>
                <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                  {v.detail}
                </p>
                
                {v.type === 'factual_error' && (
                  <button className="mt-2 flex items-center gap-1 text-[10px] font-bold text-brand-600 opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">
                    <FileSearch className="h-3 w-3" /> View Source <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer / Remediation */}
      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-900 dark:text-white">
          <Info className="h-3.5 w-3.5 text-blue-500" />
          Remediation Hint
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed italic">
          {remediation || "Switch to a more formal tone and verify the discount percentage against the latest sales collateral."}
        </p>
      </div>
    </div>
  );
}
