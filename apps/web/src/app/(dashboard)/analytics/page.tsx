'use client';

import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Target, 
  DollarSign, 
  Zap, 
  BrainCircuit, 
  ChevronRight, 
  Sparkles,
  Info,
  ArrowUpRight,
  PieChart as PieIcon,
  BarChart as BarIcon,
  Share2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  BarChart, 
  Bar, 
  Cell 
} from 'recharts';

export default function AnalyticsDashboard() {
  const data = [
    { name: 'Mon', engagement: 400, reach: 2400 },
    { name: 'Tue', engagement: 300, reach: 1398 },
    { name: 'Wed', engagement: 200, reach: 9800 },
    { name: 'Thu', engagement: 278, reach: 3908 },
    { name: 'Fri', engagement: 189, reach: 4800 },
    { name: 'Sat', engagement: 239, reach: 3800 },
    { name: 'Sun', engagement: 349, reach: 4300 },
  ];

  const impactData = [
    { name: 'Sales Deck V4', engagement: 450, color: '#6366f1' },
    { name: 'Website Crawl', engagement: 300, color: '#10b981' },
    { name: 'Whitepaper 2024', engagement: 250, color: '#f59e0b' },
    { name: 'Case Study: Acme', engagement: 150, color: '#ef4444' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">ROI & Intelligence</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Measure impact and attribute success back to your brand brain.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-800">
            Export Report
          </button>
          <button className="flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-500/20 hover:bg-brand-700">
            Customize Dashboard
          </button>
        </div>
      </div>

      {/* ROI Summary */}
      <div className="grid gap-6 md:grid-cols-4">
        <RoiStat title="Total Reach" value="124.5K" change="+12%" up icon={<Users className="h-5 w-5 text-blue-500" />} />
        <RoiStat title="Avg. Engagement" value="5.2%" change="+0.8%" up icon={<Target className="h-5 w-5 text-emerald-500" />} />
        <RoiStat title="Generation Cost" value="$142.50" change="-4%" up={false} icon={<DollarSign className="h-5 w-5 text-amber-500" />} />
        <RoiStat title="Attributed ROI" value="$12,400" change="+24%" up icon={<Zap className="h-5 w-5 text-brand-500" />} />
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        
        {/* Performance Chart */}
        <div className="lg:col-span-8 flex flex-col rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-6 flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Engagement Trend</h3>
            <select className="rounded-lg border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-bold dark:border-gray-800 dark:bg-gray-800">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorEng" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 600, fill: '#94a3b8'}} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="engagement" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorEng)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Intelligence Impact Map */}
        <div className="lg:col-span-4 flex flex-col rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
            <BrainCircuit className="h-5 w-5 text-brand-600" />
            Impact Attribution
          </h3>
          <div className="flex-1 space-y-6">
            {impactData.map((item, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                  <span className="text-gray-400">{item.engagement} pts</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div 
                    className="h-full transition-all duration-1000" 
                    style={{ width: `${(item.engagement / 500) * 100}%`, backgroundColor: item.color }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-xl bg-gray-50 p-4 dark:bg-gray-800/50">
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Posts powered by your <span className="font-bold text-brand-600">Sales Deck V4</span> are seeing 30% higher engagement among decision-makers.
            </p>
          </div>
        </div>

        {/* Knowledge Atom ROI Table */}
        <div className="lg:col-span-12">
          <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden dark:border-gray-800 dark:bg-gray-900">
            <div className="border-b border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-gray-800 dark:bg-gray-800/50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                <BrainCircuit className="h-4 w-4 text-brand-600" /> Knowledge Impact Matrix
              </h3>
              <span className="text-[10px] font-bold text-gray-400">Attributed Engagement (90 Days)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800">
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-tighter text-[10px]">Knowledge Source</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-tighter text-[10px]">Usage Count</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-tighter text-[10px]">Avg. Sentiment</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-tighter text-[10px]">Engagement Impact</th>
                    <th className="px-6 py-4 font-bold text-gray-400 uppercase tracking-tighter text-[10px]">ROI Attribution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  <KnowledgeRow name="Sales Deck V4" usage={42} sentiment="Positive" impact={92} roi="$4,200" color="bg-brand-500" />
                  <KnowledgeRow name="Product Roadmap 2024" usage={28} sentiment="Neutral" impact={76} roi="$2,850" color="bg-emerald-500" />
                  <KnowledgeRow name="Website Crawl (main)" usage={115} sentiment="Positive" impact={64} roi="$1,920" color="bg-blue-500" />
                  <KnowledgeRow name="Technical Whitepaper" usage={12} sentiment="Complex" impact={42} roi="$980" color="bg-amber-500" />
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="lg:col-span-12">
          <div className="rounded-2xl border border-brand-100 bg-brand-50/20 p-8 dark:border-brand-500/20 dark:bg-brand-500/5">
            <h3 className="text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2 mb-6">
              <Sparkles className="h-6 w-6 text-brand-600" />
              Strategic Learning Loop
            </h3>
            <div className="grid gap-6 md:grid-cols-2">
              <RecommendationCard 
                topic="Product Scalability"
                recommendation="Double down on technical content. Your audience in 'EMEA' is clicking 2x more on posts with 'Infrastructure' keywords."
                confidence={92}
                impact="High"
              />
              <RecommendationCard 
                topic="Early Adopter Pricing"
                recommendation="The 'Founder' segment is showing high conversion but low awareness. Switch to 'Social Proof' brief templates for next week."
                confidence={85}
                impact="Medium"
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function KnowledgeRow({ name, usage, sentiment, impact, roi, color }: any) {
  return (
    <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${color}`} />
          <span className="font-bold text-gray-900 dark:text-white">{name}</span>
        </div>
      </td>
      <td className="px-6 py-4 text-xs font-medium text-gray-500">{usage} posts</td>
      <td className="px-6 py-4">
        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 dark:bg-gray-800 dark:text-gray-400">
          {sentiment}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className={`h-full ${color}`} style={{ width: `${impact}%` }} />
          </div>
          <span className="text-[10px] font-bold text-gray-400">{impact}%</span>
        </div>
      </td>
      <td className="px-6 py-4 font-black text-gray-900 dark:text-white">{roi}</td>
    </tr>
  );
}

function RoiStat({ title, value, change, up, icon }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between mb-4">
        <div className="rounded-xl bg-gray-50 p-2.5 dark:bg-gray-800">{icon}</div>
        <div className={`flex items-center gap-1 text-[10px] font-bold ${up ? 'text-emerald-600' : 'text-red-600'}`}>
          {change} {up ? <ArrowUpRight className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        </div>
      </div>
      <div className="text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      <div className="text-xs text-gray-500 font-medium">{title}</div>
    </div>
  );
}

function RecommendationCard({ topic, recommendation, confidence, impact }: any) {
  return (
    <div className="group rounded-2xl bg-white p-6 shadow-sm border border-brand-100 transition-all hover:shadow-xl dark:bg-gray-900 dark:border-gray-800">
      <div className="flex items-center justify-between mb-4">
        <span className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700 uppercase tracking-widest dark:bg-brand-500/10">
          Recommendation
        </span>
        <span className={`text-[10px] font-bold px-2 py-1 rounded-md ${
          impact === 'High' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
        }`}>
          {impact} Impact
        </span>
      </div>
      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{topic}</h4>
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed italic mb-6">
        "{recommendation}"
      </p>
      <div className="flex items-center justify-between border-t border-gray-50 pt-4 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <div className="flex h-1.5 w-16 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <div className="h-full bg-brand-500" style={{ width: `${confidence}%` }} />
          </div>
          <span className="text-[10px] font-bold text-gray-400">{confidence}% Confidence</span>
        </div>
        <button className="text-xs font-bold text-brand-600 flex items-center gap-1 group-hover:underline">
          Create Brief <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
