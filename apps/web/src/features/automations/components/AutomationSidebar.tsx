import { Activity, Play } from 'lucide-react';

export function AutomationSidebar() {
  return (
    <div className="lg:col-span-4 space-y-6">
      <div className="glass-panel p-6">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Activity className="h-4 w-4 text-emerald-500" />
          Automation Activity
        </h3>
        <div className="space-y-4">
          <ActivityItem 
            title="LinkedIn Scheduled" 
            detail="Rule: Auto-Schedule Approved LinkedIn" 
            time="2m ago" 
            status="success" 
          />
          <ActivityItem 
            title="SLA Alert Sent" 
            detail="Rule: Approval SLA Monitor" 
            time="1h ago" 
            status="success" 
          />
          <ActivityItem 
            title="Failed to Archive" 
            detail="Rule: Weekly Cleanup" 
            time="1d ago" 
            status="failed" 
          />
        </div>
        <button className="mt-6 w-full rounded-xl border border-gray-100 dark:border-gray-800 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
          View All Logs
        </button>
      </div>

      <div className="rounded-2xl border border-brand-100 dark:border-brand-500/20 bg-brand-50/50 dark:bg-brand-500/5 p-6 backdrop-blur-sm">
        <h3 className="text-sm font-bold text-brand-900 dark:text-brand-100 mb-4 flex items-center gap-2">
          <Play className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          Dry Run Mode
        </h3>
        <p className="text-xs text-brand-700/70 dark:text-brand-200/70 leading-relaxed mb-6">
          Test your automations without affecting real data. Every rule runs in a virtual environment.
        </p>
        <button className="w-full rounded-xl bg-brand-600 py-2 text-xs font-bold text-white shadow-md shadow-brand-500/20 hover:bg-brand-700 transition-colors">
          Enable Global Dry Run
        </button>
      </div>
    </div>
  );
}

function ActivityItem({ title, detail, time, status }: { title: string; detail: string; time: string; status: 'success' | 'failed' }) {
  return (
    <div className="flex gap-3">
      <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 dark:text-white">{title}</span>
          <span className="text-[10px] text-gray-400 font-medium">{time}</span>
        </div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-relaxed">{detail}</p>
      </div>
    </div>
  );
}
