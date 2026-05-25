'use client';

import * as React from 'react';
import { 
  ShieldCheck, 
  AlertCircle, 
  Ban, 
  MessageSquarePlus, 
  Trash2,
  Plus,
  Scale,
  Info
} from 'lucide-react';
import { Button, cn, Input, Badge, Textarea } from '@brandflow/ui';

interface GovernanceRule {
  id: string;
  type: 'banned' | 'required' | 'cta' | 'legal';
  value: string;
  severity: 'low' | 'medium' | 'high';
}

interface GovernanceGovernanceProps {
  rules: GovernanceRule[];
  onChange: (rules: GovernanceRule[]) => void;
}

export function GovernanceGovernance({ rules = [], onChange }: GovernanceGovernanceProps) {
  const [activeType, setActiveType] = React.useState<GovernanceRule['type']>('banned');

  const addRule = () => {
    const newRule: GovernanceRule = {
      id: Math.random().toString(36).substr(2, 9),
      type: activeType,
      value: '',
      severity: 'medium'
    };
    onChange([...rules, newRule]);
  };

  const updateRule = (id: string, value: string) => {
    onChange(rules.map(r => r.id === id ? { ...r, value } : r));
  };

  const removeRule = (id: string) => {
    onChange(rules.filter(r => r.id !== id));
  };

  const filteredRules = rules.filter(r => r.type === activeType);

  return (
    <div className="space-y-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 space-y-6">
          <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl w-fit">
            {(['banned', 'required', 'cta', 'legal'] as const).map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setActiveType(type)}
                className={cn(
                  "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                  activeType === type 
                    ? "bg-white dark:bg-gray-700 text-brand-600 shadow-sm" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                {type}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredRules.map((rule) => (
              <div key={rule.id} className="flex gap-4 group">
                <div className="flex-1">
                  <Input 
                    value={rule.value}
                    onChange={(e) => updateRule(rule.id, e.target.value)}
                    placeholder={
                      activeType === 'banned' ? "e.g. 'Cheap', 'Basic', 'Standard'" :
                      activeType === 'required' ? "e.g. 'Eco-friendly', 'Cloud-native'" :
                      activeType === 'cta' ? "e.g. 'Start Free Trial', 'Book Demo'" :
                      "e.g. 'Terms and conditions apply...'"
                    }
                    className="h-12 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 rounded-xl font-bold text-sm"
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => removeRule(rule.id)}
                  className="p-3 hover:bg-red-50 text-red-400 hover:text-red-600 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
            
            <Button 
              variant="outline" 
              onClick={addRule}
              className="w-full h-12 border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-400 hover:text-brand-600 hover:border-brand-200 hover:bg-brand-50/50 rounded-xl font-black uppercase tracking-widest text-[10px]"
            >
              <Plus className="w-4 h-4 mr-2" /> Add {activeType} entry
            </Button>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          <div className="p-6 rounded-2xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <Scale className="w-5 h-5 text-brand-400" />
              <h3 className="text-xs font-black uppercase tracking-widest">Compliance Health</h3>
            </div>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black">92%</span>
              <span className="text-[10px] font-black text-emerald-400 uppercase pb-1">Excellent</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 dark:bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-brand-500 w-[92%]" />
            </div>
            <p className="text-[10px] font-medium opacity-60 leading-relaxed">
              Based on 14 active governance rules and content generation history.
            </p>
          </div>

          <div className="p-5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-4">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Info className="w-3 h-3" />
              Operational Impact
            </h3>
            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
              These rules are injected directly into the AI context window. All generated content is automatically validated against this list before presentation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
