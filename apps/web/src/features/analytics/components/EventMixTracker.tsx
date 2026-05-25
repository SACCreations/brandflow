import { Activity } from 'lucide-react';
import { PLATFORM_COLORS, formatLabel } from './types';
import type { AnalyticsSummary } from './types';

interface EventMixTrackerProps {
  eventMix?: AnalyticsSummary['eventMix'];
}

export function EventMixTracker({ eventMix }: EventMixTrackerProps) {
  return (
    <div className="lg:col-span-5 glass-panel p-6 flex flex-col">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
          <Activity className="h-5 w-5 text-brand-600" />
          Event Mix
        </h2>
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Tracked events</span>
      </div>
      <div className="space-y-4 flex-1">
        {(eventMix ?? []).length ? (
          eventMix!.map((item, index) => {
            const maxCount = eventMix![0]?.count ?? 1;
            const width = maxCount > 0 ? Math.max(10, Math.round((item.count / maxCount) * 100)) : 0;
            return (
              <div key={item.eventType} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700 dark:text-gray-300">{formatLabel(item.eventType)}</span>
                  <span className="text-gray-400">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-800/50">
                  <div
                    className="h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${width}%`, backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">No analytics events recorded for this period yet.</p>
        )}
      </div>
    </div>
  );
}
