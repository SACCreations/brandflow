import React from 'react';
import { BrainCircuit, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@brandflow/ui';

interface SuggestedTopic {
  id: string;
  name: string;
  tag: string;
}

interface TopicSelectionMatrixProps {
  selectedBrandId: string;
  isSuggestionsLoading: boolean;
  suggestedTopicsData?: { topics: SuggestedTopic[] };
  generateTopics: () => Promise<any>;
  selectedTopics: string[];
  handleSelectAllTopics: () => void;
  handleToggleTopic: (topicName: string) => void;
  customTopic: string;
  setCustomTopic: (topic: string) => void;
}

export function TopicSelectionMatrix({
  selectedBrandId,
  isSuggestionsLoading,
  suggestedTopicsData,
  generateTopics,
  selectedTopics,
  handleSelectAllTopics,
  handleToggleTopic,
  customTopic,
  setCustomTopic,
}: TopicSelectionMatrixProps) {
  return (
    <div className="glass-panel p-6 space-y-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      <div className="relative z-10 flex items-center justify-between border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-brand-500/10 p-2">
            <BrainCircuit className="h-5 w-5 text-brand-600 dark:text-brand-400" />
          </div>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">3. Intelligent Topic Selection</h2>
        </div>
        <div className="flex items-center gap-4">
          <Button 
            onClick={async (e) => {
              e.preventDefault();
              await generateTopics();
            }} 
            disabled={!selectedBrandId || isSuggestionsLoading}
            variant="outline"
            size="sm"
            className="h-8 text-xs font-bold gap-1.5 backdrop-blur-sm bg-white/50 dark:bg-gray-900/50 hover:bg-brand-50 dark:hover:bg-brand-900/30"
          >
            {isSuggestionsLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
            Generate Topics
          </Button>
          {suggestedTopicsData && suggestedTopicsData.topics.length > 0 && (
            <button 
              onClick={handleSelectAllTopics} 
              className="text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
            >
              {selectedTopics.length === suggestedTopicsData.topics.length ? 'Clear All' : 'Select All'}
            </button>
          )}
        </div>
      </div>

      {/* Quick AI Suggestions Grid */}
      <div className="relative z-10 space-y-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
          AI Suggested Quick Topics
          {isSuggestionsLoading && <Loader2 className="h-3 w-3 animate-spin text-brand-600 dark:text-brand-400" />}
        </span>
        
        {!selectedBrandId ? (
          <div className="text-center p-6 border border-dashed border-border/50 rounded-2xl text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 backdrop-blur-sm">
            Pick a Brand in Step 1 to load dynamic, brand-positioning suggestions.
          </div>
        ) : isSuggestionsLoading ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : suggestedTopicsData?.topics?.length ? (
          <div className="grid gap-3 grid-cols-1 md:grid-cols-2">
            {suggestedTopicsData.topics.map((t) => {
              const isPicked = selectedTopics.includes(t.name);
              return (
                <button
                  key={t.id}
                  onClick={() => handleToggleTopic(t.name)}
                  className={`flex items-start justify-between p-3.5 rounded-xl border text-left transition-all duration-300 backdrop-blur-sm ${
                    isPicked
                      ? 'border-brand-500/50 bg-brand-50/80 text-brand-900 ring-2 ring-brand-500/20 dark:bg-brand-500/20 dark:text-brand-100 shadow-inner'
                      : 'border-border/50 text-gray-700 hover:bg-white/80 dark:bg-gray-900/40 dark:text-gray-400 dark:hover:bg-gray-800/60 shadow-sm hover:-translate-y-0.5'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <div className="text-xs font-semibold leading-snug line-clamp-1">{t.name}</div>
                    <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{t.tag}</div>
                  </div>
                  <div className={`h-4 w-4 rounded-full border flex items-center justify-center transition-colors ${
                    isPicked ? 'border-brand-600 bg-brand-600 text-white dark:border-brand-500 dark:bg-brand-500' : 'border-gray-300 dark:border-gray-600'
                  }`}>
                    {isPicked && <span className="text-[8px] font-bold">✓</span>}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed border-border/50 rounded-2xl text-xs text-gray-400 bg-gray-50/50 dark:bg-gray-900/20 backdrop-blur-sm">
            No explicit suggested topics returned. Use the custom topic box below.
          </div>
        )}
      </div>

      {/* Custom Input */}
      <div className="relative z-10 space-y-2 pt-2">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">Custom Topic Focus (Optional)</span>
        <input
          className="w-full rounded-xl border border-border/50 bg-white/50 dark:bg-gray-900/50 px-4 py-3 text-sm text-gray-900 dark:text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 backdrop-blur-sm"
          value={customTopic}
          onChange={(e) => setCustomTopic(e.target.value)}
          placeholder="E.g. Launching the biryani festival offer for local delivery"
        />
      </div>
    </div>
  );
}
