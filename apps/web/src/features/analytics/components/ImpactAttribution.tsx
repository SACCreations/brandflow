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
      <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
        <BrainCircuit className="h-5 w-5 text-brand-600" />
        Impact Attribution
      </h2>
      <div className="flex-1 space-y-6">
        {isImpactLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800" />
          ))
        ) : impactSummary.length > 0 ? (
          impactSummary.map((item, i) => (
            <div key={i} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                <span className="text-gray-400">{item.engagement} pts</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800/50">
                <div
                  className="h-full transition-all duration-1000 shadow-sm"
                  style={{ width: `${Math.min(100, (item.engagement / 500) * 100)}%`, backgroundColor: item.color }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-xs text-gray-500">No impact data attributed yet.</p>
        )}
      </div>

      <div className="mt-8 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800/50 p-4">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">
          Top source ROI contribution
        </p>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {topSource ? (
            <>
              <span className="font-bold text-brand-600 dark:text-brand-400">{topSource.name}</span> currently drives
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
