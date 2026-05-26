import { BarChart3 } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { PLATFORM_COLORS, formatCompactNumber } from './types';
import type { AnalyticsSummary } from './types';

interface PlatformBreakdownChartProps {
  platformBreakdown?: AnalyticsSummary['platformBreakdown'];
}

export function PlatformBreakdownChart({ platformBreakdown }: PlatformBreakdownChartProps) {
  return (
    <div className="lg:col-span-7 glass-panel p-6">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <BarChart3 className="h-5 w-5 text-primary" />
          Platform Breakdown
        </h2>
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reach by platform</span>
      </div>

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={platformBreakdown ?? []}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" opacity={0.3} />
            <XAxis dataKey="platform" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94a3b8' }} />
            <Tooltip 
              formatter={(value: number) => [formatCompactNumber(value), 'Reach']}
              contentStyle={{ borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)', backgroundColor: 'rgba(15, 23, 42, 0.9)' }}
              itemStyle={{ color: '#f8fafc' }}
            />
            <Bar dataKey="reach" radius={[8, 8, 0, 0]}>
              {(platformBreakdown ?? []).map((_entry, index) => (
                <Cell key={index} fill={PLATFORM_COLORS[index % PLATFORM_COLORS.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
