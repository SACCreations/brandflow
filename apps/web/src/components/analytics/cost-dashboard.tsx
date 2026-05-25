'use client';

import React from 'react';
import { 
  DollarSign, 
  Zap, 
  Activity, 
  Layers,
  ArrowUpRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function CostAnalysisDashboard() {
  const { data: costData, isLoading } = useQuery({
    queryKey: ['analytics', 'costs'],
    queryFn: async () => {
      const res = await apiClient.get('/analytics/costs');
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900/50 dark:border-gray-800 dark:bg-gray-900/50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
          <p className="text-sm font-bold text-gray-400">Analyzing AI compute costs...</p>
        </div>
      </div>
    );
  }

  const totalCost = (costData?.total?.costCents ?? 0) / 100;
  const totalTokens = (costData?.total?.inputTokens ?? 0) + (costData?.total?.outputTokens ?? 0);

  const moduleData = costData?.byModule?.map((m: any) => ({
    name: m.module.charAt(0).toUpperCase() + m.module.slice(1),
    value: m._sum.costCents / 100
  })) || [];

  const trendData = costData?.dailyTrend?.map((t: any) => ({
    date: new Date(t.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    cost: t.cost / 100
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-3">
        <CostStat 
          title="Total AI Spend" 
          value={`$${totalCost.toFixed(2)}`} 
          subtitle="Current Billing Period"
          icon={<DollarSign className="h-5 w-5 text-emerald-500" />} 
        />
        <CostStat 
          title="Token Consumption" 
          value={(totalTokens / 1000).toFixed(1) + 'K'} 
          subtitle="Input + Output"
          icon={<Cpu className="h-5 w-5 text-blue-500" />} 
        />
        <CostStat 
          title="Avg. Cost per Request" 
          value={`$${(totalCost / (costData?.dailyTrend?.length || 1)).toFixed(2)}`} 
          subtitle="Efficiency Score"
          icon={<Activity className="h-5 w-5 text-brand-500" />} 
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Cost Trend */}
        <div className="lg:col-span-8 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              Spend Velocity
            </h3>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Daily USD Spend</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}}
                  tickFormatter={(val) => `$${val}`}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCost)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown */}
        <div className="lg:col-span-4 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <Layers className="h-5 w-5 text-brand-600" />
            Module Allocation
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moduleData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {moduleData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostStat({ title, value, subtitle, icon }: any) {
  return (
    <div className="group rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-6 shadow-sm transition-all hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-950 p-2.5 dark:bg-gray-800 group-hover:scale-110 transition-transform">{icon}</div>
        <ArrowUpRight className="h-4 w-4 text-gray-300" />
      </div>
      <div className="text-3xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm font-bold text-gray-500">{title}</div>
      <p className="mt-1 text-[10px] text-gray-400 uppercase tracking-widest">{subtitle}</p>
    </div>
  );
}
