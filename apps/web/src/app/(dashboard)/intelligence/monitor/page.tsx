'use client';

import React from 'react';
import { 
  Activity, 
  Search, 
  Terminal, 
  Clock, 
  RotateCcw, 
  Layers,
  Cpu,
  BarChart3,
  HardDrive,
  ArrowRight
} from 'lucide-react';

export default function ProcessingMonitorPage() {
  const activeJobs = [
    { id: 'JOB-9421', source: 'Q4_Strategy.pdf', stage: 'Classification', progress: 70, startTime: '2m ago', speed: '45 entries/sec' },
    { id: 'JOB-9422', source: 'processdrive.com/blog', stage: 'Extraction', progress: 45, startTime: '10s ago', speed: '120 pages/sec' },
  ];

  const historicalJobs = [
    { id: 'JOB-9420', source: 'pricing.html', status: 'completed', duration: '45s', entries: 24, timestamp: '1h ago' },
    { id: 'JOB-9419', source: 'Support_Logs.csv', status: 'failed', duration: '12s', entries: 0, timestamp: '2h ago', error: 'Parser Error: Invalid Encoding' },
    { id: 'JOB-9418', source: 'Brand_Guidelines.pdf', status: 'completed', duration: '2m 15s', entries: 156, timestamp: '5h ago' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in zoom-in-95 duration-700">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Processing Monitor</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Real-time observability into ingestion pipelines and worker health.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-sm font-semibold dark:bg-emerald-500/10 dark:text-emerald-400">
            <Cpu className="h-4 w-4" /> 4 Workers Online
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-300">
            <RotateCcw className="h-4 w-4" /> Retry Failed
          </button>
        </div>
      </div>

      {/* Resource Metrics */}
      <div className="grid gap-6 md:grid-cols-3">
        <MetricCard label="System Throughput" value="1.2k" subValue="entries/min" icon={<BarChart3 className="h-5 w-5 text-blue-500" />} />
        <MetricCard label="Active Ingestion" value={activeJobs.length} subValue="parallel jobs" icon={<Activity className="h-5 w-5 text-brand-500" />} />
        <MetricCard label="Storage Usage" value="1.4 GB" subValue="vector index" icon={<HardDrive className="h-5 w-5 text-emerald-500" />} />
      </div>

      {/* Active Jobs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand-500" />
            Active Pipelines
          </h3>
          <span className="text-xs font-medium text-gray-400">Updates every 2s</span>
        </div>
        <div className="space-y-6">
          {activeJobs.map((job) => (
            <div key={job.id} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono font-bold text-gray-400">{job.id}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{job.source}</span>
                  <ArrowRight className="h-3 w-3 text-gray-300" />
                  <span className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 uppercase tracking-tighter">
                    <Layers className="h-3 w-3" /> {job.stage}
                  </span>
                </div>
                <span className="text-xs font-medium text-gray-500">{job.speed} • {job.startTime}</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                <div 
                  className="h-full bg-brand-500 transition-all duration-500" 
                  style={{ width: `${job.progress}%` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Logs */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Terminal className="h-5 w-5 text-blue-500" />
            Recent Job History
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter logs..." 
              className="rounded-xl border border-gray-200 bg-gray-50 pl-10 pr-4 py-2 text-xs focus:ring-2 focus:ring-brand-500 dark:border-gray-800 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">ID</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Source</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Duration</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Atoms</th>
                <th className="px-4 py-3 text-xs font-bold text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {historicalJobs.map((job) => (
                <tr key={job.id} className="text-sm transition-colors hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                  <td className="px-4 py-4 font-mono text-xs text-gray-400">{job.id}</td>
                  <td className="px-4 py-4 font-medium text-gray-900 dark:text-white">
                    {job.source}
                    {job.error && <p className="mt-1 text-[10px] text-red-500 font-normal">{job.error}</p>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                      job.status === 'completed' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' :
                      'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-gray-500">{job.duration}</td>
                  <td className="px-4 py-4 text-gray-900 dark:text-white font-medium">{job.entries}</td>
                  <td className="px-4 py-4 text-gray-400 text-xs flex items-center gap-1.5">
                    <Clock className="h-3 w-3" /> {job.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subValue, icon }: any) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center gap-4">
        <div className="rounded-xl bg-gray-50 p-3 dark:bg-gray-800">
          {icon}
        </div>
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</p>
          <div className="flex items-baseline gap-2">
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
            <span className="text-xs text-gray-400 font-medium">{subValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
