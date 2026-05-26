import { BrainCircuit } from 'lucide-react';
import type { AnalyticsSummary } from './types';

interface ImpactAttributionProps {
  impactSummary: Array<{ name: string; engagement: number; color: string }>;
  isImpactLoading: boolean;
  topSource?: AnalyticsSummary['topSources'][0];
}

export function ImpactAttribution({ impactSummary, isImpactLoading, topSource }: ImpactAttributionProps) {
  return (
    <div className="lg:col-span-4 glass-panel p-6 flex flex-col">
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-foreground">
        <BrainCircuit className="h-5 w-5 text-primary" />
        Impact Attribution
      </h2>
      <div className="flex-1 space-y-6">
        {isImpactLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-surface-3" />
          ))
        ) : impactSummary.length > 0 ? (
          impactSummary.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-foreground">{item.name}</span>
                <span className="text-muted-foreground">{item.engagement} pts</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-3/50">
                <div
                  className="h-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${Math.min(100, (item.engagement / 500) * 100)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">No impact data attributed yet.</p>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-surface-1/50 bg-background/50 border border-border/60/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Top source ROI contribution
        </p>
        <p className="mt-2 text-sm text-foreground">
          {topSource ? (
            <>
              <span className="font-bold text-primary dark:text-brand-400">{topSource.name}</span> currently drives
              the strongest engagement signal in your content mix.
            </>
          ) : (
            'Add performance data and source attribution to surface your strongest knowledge drivers.'
          )}
        </p>
      </div>
    </div>
  );
}
