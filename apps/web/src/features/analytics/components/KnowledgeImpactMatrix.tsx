import { BrainCircuit } from 'lucide-react';
import { PLATFORM_COLORS, formatCurrency, formatLabel } from './types';
import type { AnalyticsSummary } from './types';

interface KnowledgeImpactMatrixProps {
  topSources?: AnalyticsSummary['topSources'];
}

export function KnowledgeImpactMatrix({ topSources }: KnowledgeImpactMatrixProps) {
  return (
    <div className="lg:col-span-12 overflow-hidden glass-panel">
      <div className="flex items-center justify-between border-b border-border/50 bg-surface-2/50 px-6 py-4 backdrop-blur-sm">
        <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-foreground">
          <BrainCircuit className="h-4 w-4 text-primary dark:text-brand-400" />
          Knowledge Impact Matrix
        </h2>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Attributed engagement</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border/50">
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Knowledge Source</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Type</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Usage Count</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Engagement Impact</th>
              <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">ROI Attribution</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
            {(topSources ?? []).length ? (
              topSources!.map((source, index) => {
                const maxEngagement = topSources![0]?.engagement ?? 1;
                const percent = maxEngagement > 0 ? Math.round((source.engagement / maxEngagement) * 100) : 0;
                return (
                  <tr key={source.sourceId} className="hover:bg-surface-1/50 dark:hover:bg-surface-1/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">{source.name}</td>
                    <td className="px-6 py-4 text-xs uppercase text-muted-foreground">{formatLabel(source.type)}</td>
                    <td className="px-6 py-4 text-xs text-muted-foreground">{source.usageCount} posts</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${percent}%`, backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length] }}
                          />
                        </div>
                        <span className="text-[10px] font-bold text-muted-foreground">{percent}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-black text-foreground">{formatCurrency(source.roiCents)}</td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-sm text-muted-foreground">
                  No attributed source impact available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
