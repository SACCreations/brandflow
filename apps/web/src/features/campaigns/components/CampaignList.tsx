import React from 'react';
import { Calendar as CalendarIcon, Target, Users, Settings2, MoreHorizontal, ChevronRight, BarChart } from 'lucide-react';
import Link from 'next/link';

interface CampaignListProps {
  campaigns: any[];
}

export function CampaignList({ campaigns }: CampaignListProps) {
  if (campaigns.length === 0) {
    return (
      <div className="glass-panel p-16 text-center">
        <Target className="mx-auto h-12 w-12 text-muted-foreground dark:text-gray-600 mb-4" />
        <h3 className="text-lg font-bold text-foreground">No campaigns found</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
          Create your first campaign to start tracking strategic goals, managing budgets, and analyzing performance.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {campaigns.map((campaign) => {
        const health = Math.floor(Math.random() * 40) + 60; // Mock health score between 60-100
        const isHealthy = health > 80;
        const progress = Math.floor(Math.random() * 100);

        return (
          <div key={campaign.id} className="glass-panel p-6 group hover:border-primary/50 transition-all duration-300 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-bold text-foreground group-hover:text-primary dark:group-hover:text-brand-400 transition-colors">
                        {campaign.name}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        campaign.status === 'ACTIVE' 
                          ? 'text-emerald-700 bg-emerald-500/10 border-emerald-500/20 dark:text-emerald-400' 
                          : 'text-amber-700 bg-amber-500/10 border-amber-500/20 dark:text-amber-400'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    {campaign.description && (
                      <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                        {campaign.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 md:hidden">
                    <button className="p-2 text-muted-foreground hover:text-gray-600 dark:hover:text-gray-300">
                      <MoreHorizontal className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2 bg-surface-2/50 px-3 py-1.5 rounded-lg border border-border/50 backdrop-blur-sm">
                    <CalendarIcon className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {new Date(campaign.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
                      {' - '}
                      {new Date(campaign.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>3 Team Members</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>2 Active Briefs</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-between items-end min-w-[200px] border-t md:border-t-0 md:border-l border-border/50 pt-4 md:pt-0 md:pl-6">
                <div className="w-full space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground font-medium">Campaign Health</span>
                    <span className={`font-bold ${isHealthy ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {health}%
                    </span>
                  </div>
                  <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-1.5 rounded-full ${isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}
                      style={{ width: `${health}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-sm pt-2">
                    <span className="text-muted-foreground font-medium">Budget Spent</span>
                    <span className="font-bold text-foreground">{progress}%</span>
                  </div>
                  <div className="w-full bg-surface-3 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-primary h-1.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full mt-6">
                  <Link href={`/campaigns/${campaign.id}`} className="flex-1 text-center py-2 bg-primary/10 hover:bg-brand-100 dark:hover:bg-primary/20 text-brand-700 dark:text-brand-300 rounded-lg text-sm font-bold transition-colors">
                    Manage
                  </Link>
                  <button className="p-2 border border-border/50 hover:border-gray-300 dark:hover:border-gray-600 rounded-lg text-muted-foreground hover:text-gray-600 dark:hover:text-gray-300 transition-all bg-surface-2/50 backdrop-blur-sm">
                    <Settings2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
