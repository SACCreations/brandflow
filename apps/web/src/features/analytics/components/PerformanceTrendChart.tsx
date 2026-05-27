import { formatDistanceToNow } from 'date-fns';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { formatCompactNumber } from './types';

interface PerformanceTrendChartProps {
  chartData: Array<{ label: string; reach: number; engagement: number }>;
  windowDays: string;
  rangeTo?: string;
}

export function PerformanceTrendChart({ chartData, windowDays, rangeTo }: PerformanceTrendChartProps) {
  return (
    <div className="lg:col-span-8 glass-panel p-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-foreground">Performance Trend</h2>
          <p className="text-sm text-muted-foreground">
            Reach and engagement over the past {windowDays} days.
          </p>
        </div>
        <div className="rounded-xl bg-surface-2/50 border border-border/50 px-3 py-2 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          {rangeTo
            ? formatDistanceToNow(new Date(rangeTo), { addSuffix: true })
            : 'Current'}
        </div>
      </div>

      <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="engagementGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="reachGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip
              formatter={(value: number, name: string) => [formatCompactNumber(value), name === 'engagement' ? 'Engagement' : 'Reach']}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Area type="monotone" dataKey="reach" stroke="#10b981" fill="url(#reachGradient)" strokeWidth={2} />
            <Area type="monotone" dataKey="engagement" stroke="#6366f1" fill="url(#engagementGradient)" strokeWidth={3} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
