import React from 'react';
import { XCircle, Loader2 } from 'lucide-react';

interface CreateCampaignModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  newCampaign: { name: string; description: string; startDate: string; endDate: string };
  setNewCampaign: (campaign: any) => void;
  handleCreate: () => void;
  isPending: boolean;
}

export function CreateCampaignModal({
  isModalOpen,
  setIsModalOpen,
  newCampaign,
  setNewCampaign,
  handleCreate,
  isPending,
}: CreateCampaignModalProps) {
  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg glass-panel p-8 shadow-2xl animate-in zoom-in-95 duration-300 border-border/50">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create New Campaign</h2>
            <p className="text-sm text-muted-foreground">Define your next strategic initiative.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(false)} 
            className="rounded-full bg-background/50 bg-surface-2/50 p-2 text-muted-foreground hover:bg-surface-2 text-muted-foreground dark:hover:bg-gray-700 backdrop-blur-sm border border-border/50 transition-colors"
          >
            <XCircle className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Campaign Name</label>
            <input 
              type="text" 
              placeholder="e.g. Q3 Product Launch"
              className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20/50 outline-none backdrop-blur-sm text-foreground"
              value={newCampaign.name}
              onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Objective / Description</label>
            <textarea 
              placeholder="What is the primary goal of this campaign?"
              className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20/50 outline-none backdrop-blur-sm text-foreground"
              rows={3}
              value={newCampaign.description}
              onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Start Date</label>
              <input 
                type="date" 
                className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20/50 outline-none backdrop-blur-sm text-foreground"
                value={newCampaign.startDate}
                onChange={(e) => setNewCampaign({...newCampaign, startDate: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">End Date</label>
              <input 
                type="date" 
                className="w-full rounded-xl border border-border/50 bg-background/50 bg-background/50 px-4 py-3 text-sm focus:ring-2 focus:ring-primary/20/50 outline-none backdrop-blur-sm text-foreground"
                value={newCampaign.endDate}
                onChange={(e) => setNewCampaign({...newCampaign, endDate: e.target.value})}
              />
            </div>
          </div>
          
          <div className="pt-4 flex gap-4">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 rounded-xl border border-border/50 bg-background/50 bg-background/50 py-3 text-sm font-bold text-foreground hover:bg-surface-1 dark:hover:bg-surface-1 backdrop-blur-sm transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleCreate}
              disabled={!newCampaign.name || isPending}
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-foreground shadow-lg shadow-brand-500/20 hover:bg-brand-700 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Campaign
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
