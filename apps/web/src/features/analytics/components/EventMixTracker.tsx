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
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Activity className="h-5 w-5 text-primary" />
          Event Mix
        </h2>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tracked events</span>
      </div>
      <div className="space-y-4 flex-1">
        {(eventMix ?? []).length ? (
          eventMix!.map((item, index) => {
            const maxCount = eventMix![0]?.count ?? 1;
            const width = maxCount > 0 ? Math.max(10, Math.round((item.count / maxCount) * 100)) : 0;
            return (
              <div key={item.eventType} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-foreground">{formatLabel(item.eventType)}</span>
                  <span className="text-muted-foreground">{item.count}</span>
                </div>
                <div className="h-2 rounded-full bg-surface-3/50">
                  <div
                    className="h-full rounded-full transition-all duration-700 shadow-sm"
                    style={{ width: `${width}%`, backgroundColor: PLATFORM_COLORS[index % PLATFORM_COLORS.length] }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">No analytics events recorded for this period yet.</p>
        )}
      </div>
    </div>
  );
}
