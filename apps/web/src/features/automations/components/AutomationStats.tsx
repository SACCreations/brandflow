import { Zap, Activity, CheckCircle2, Clock } from 'lucide-react';
import type { Automation } from './types';

interface AutomationStatsProps {
  automations?: Automation[];
}

export function AutomationStats({ automations }: AutomationStatsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-4">
      <AutoStat 
        label="Active Rules" 
        value={automations?.filter(a => a.isActive).length.toString() || '0'} 
        icon={<Zap className="h-4 w-4 text-brand-500" />} 
      />
      <AutoStat 
        label="Tasks Automated" 
        value={automations?.reduce((acc, a) => acc + a._count.runs, 0).toString() || '0'} 
        icon={<Activity className="h-4 w-4 text-emerald-500" />} 
      />
      <AutoStat 
        label="Success Rate" 
        value="99.8%" 
        icon={<CheckCircle2 className="h-4 w-4 text-blue-500" />} 
      />
      <AutoStat 
        label="Time Saved" 
        value="14h" 
        icon={<Clock className="h-4 w-4 text-purple-500" />} 
      />
    </div>
  );
}

function AutoStat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-gray-50/50 dark:bg-gray-900/50 p-2 border border-gray-100 dark:border-gray-800">
          {icon}
        </div>
        <div>
          <div className="text-lg font-black text-gray-900 dark:text-white">{value}</div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
        </div>
      </div>
    </div>
  );
}
