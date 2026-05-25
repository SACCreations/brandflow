'use client';

import * as React from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  BookOpen, 
  Target, 
  Zap,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  Card, 
  Badge, 
  Progress,
  cn,
  Button
} from '@brandflow/ui';
import type { QualityCheckResult, QualityViolation, KnowledgeCitation } from '@brandflow/shared';

interface QualityAnalysisProps {
  checkResult: QualityCheckResult | null;
  isLoading?: boolean;
}

export function QualityAnalysis({ checkResult, isLoading }: QualityAnalysisProps) {
  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
        <div className="h-40 bg-gray-100 dark:bg-gray-800 rounded-2xl" />
      </div>
    );
  }

  if (!checkResult) {
    return (
      <Card className="p-8 border-dashed border-2 flex flex-col items-center justify-center text-center space-y-3">
        <div className="p-3 rounded-full bg-gray-50 dark:bg-gray-900">
          <Zap className="w-6 h-6 text-gray-300" />
        </div>
        <div>
          <h3 className="text-sm font-bold">No Analysis Yet</h3>
          <p className="text-xs text-gray-500">Run a quality check to see brand compliance and fact-checking results.</p>
        </div>
      </Card>
    );
  }

  const gradeColors = {
    A: 'bg-emerald-500 text-white shadow-emerald-500/20',
    B: 'bg-brand-500 text-white shadow-brand-500/20',
    C: 'bg-amber-500 text-white shadow-amber-500/20',
    D: 'bg-orange-500 text-white shadow-orange-500/20',
    F: 'bg-red-500 text-white shadow-red-500/20',
  };

  return (
    <div className="space-y-6">
      {/* Header Score Card */}
      <div className="relative overflow-hidden rounded-3xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 p-6 shadow-sm">
        <div className="relative z-10 flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Quality Score</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tighter">
                {Math.round(checkResult.confidenceScore * 100)}%
              </span>
              <Badge className={cn("rounded-lg px-2 py-0.5 text-[10px] font-black border-none", gradeColors[checkResult.overallGrade])}>
                GRADE {checkResult.overallGrade}
              </Badge>
            </div>
          </div>
          <div className="h-16 w-16 rounded-2xl bg-gray-50 dark:bg-gray-900 flex items-center justify-center border border-gray-100 dark:border-gray-800">
            {checkResult.passed ? (
              <ShieldCheck className="w-8 h-8 text-emerald-500" />
            ) : (
              <XCircle className="w-8 h-8 text-red-500" />
            )}
          </div>
        </div>
        <Progress value={checkResult.confidenceScore * 100} className="mt-4 h-1.5" />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Compliance', score: checkResult.complianceScore, icon: Target, color: 'text-brand-500' },
          { label: 'Factuality', score: checkResult.factualScore, icon: BookOpen, color: 'text-blue-500' },
          { label: 'Safety', score: checkResult.safetyScore, icon: ShieldCheck, color: 'text-purple-500' },
        ].map((m) => (
          <div key={m.label} className="p-3 rounded-2xl border border-gray-50 dark:border-gray-900 bg-gray-50 dark:bg-gray-950/50 dark:bg-gray-900/50 space-y-2">
            <div className="flex items-center gap-1.5">
              <m.icon className={cn("w-3 h-3", m.color)} />
              <span className="text-[10px] font-black uppercase tracking-tight text-gray-500">{m.label}</span>
            </div>
            <p className="text-sm font-black">{Math.round((m.score || 0) * 100)}%</p>
          </div>
        ))}
      </div>

      {/* Violations List */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Analysis Details</h4>
        {checkResult.violations.length === 0 ? (
          <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/20 flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Perfect alignment! No brand violations found.</p>
          </div>
        ) : (
          checkResult.violations.map((v, i) => (
            <div key={i} className="group p-4 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm hover:border-brand-200 transition-all">
              <div className="flex items-start gap-3">
                <div className={cn(
                  "p-2 rounded-xl h-fit",
                  v.severity === 'high' || v.severity === 'critical' ? "bg-red-50 text-red-500" : "bg-amber-50 text-amber-500"
                )}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black uppercase tracking-tight">{v.type.replace('_', ' ')}</p>
                    <Badge variant="outline" className="text-[8px] font-black uppercase py-0 leading-none">
                      {v.severity}
                    </Badge>
                  </div>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">{v.detail}</p>
                  {v.suggestion && (
                    <div className="mt-2 p-2 rounded-lg bg-brand-50/50 dark:bg-brand-900/10 border border-brand-100 dark:border-brand-900/20">
                      <p className="text-[10px] font-bold text-brand-700 dark:text-brand-400 flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5" /> AI Suggestion
                      </p>
                      <p className="text-[10px] text-brand-600 dark:text-brand-400 italic">"{v.suggestion}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Citations */}
      {checkResult.citations && checkResult.citations.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Knowledge Grounding</h4>
          <div className="space-y-2">
            {checkResult.citations.map((c, i) => (
              <div key={i} className="p-3 rounded-xl border border-gray-50 dark:border-gray-900 bg-gray-50 dark:bg-gray-950/30 dark:bg-gray-900/30 flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-500">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold truncate max-w-[150px]">"{c.claimSnippet}"</p>
                    <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">Verified Match: {Math.round(c.matchScore * 100)}%</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
