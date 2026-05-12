'use client';

import * as React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  Info, 
  Copy, 
  Settings2,
  Trash2,
  Plus
} from 'lucide-react';
import { Button, cn, Input, Badge } from '@brandflow/ui';
import { ColorPicker } from './color-picker';

interface ColorToken {
  id: string;
  name: string;
  value: string;
  type: 'primary' | 'secondary' | 'accent' | 'neutral' | 'semantic';
}

interface ColorGovernanceProps {
  colors: ColorToken[];
  onChange: (colors: ColorToken[]) => void;
}

export function ColorGovernance({ colors = [], onChange }: ColorGovernanceProps) {
  const [activeType, setActiveType] = React.useState<ColorToken['type']>('primary');

  const addColor = () => {
    const newColor: ColorToken = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Color',
      value: '#6366f1',
      type: activeType
    };
    onChange([...colors, newColor]);
  };

  const updateColor = (id: string, updates: Partial<ColorToken>) => {
    onChange(colors.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const removeColor = (id: string) => {
    onChange(colors.filter(c => c.id !== id));
  };

  const filteredColors = colors.filter(c => c.type === activeType);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
          {(['primary', 'secondary', 'accent', 'neutral', 'semantic'] as const).map(type => (
            <button
              key={type}
              onClick={() => setActiveType(type)}
              className={cn(
                "px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all",
                activeType === type 
                  ? "bg-white dark:bg-gray-700 text-brand-600 shadow-sm" 
                  : "text-gray-400 hover:text-gray-600"
              )}
            >
              {type}
            </button>
          ))}
        </div>
        <Button 
          size="sm" 
          onClick={addColor}
          className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-[10px] font-black uppercase"
        >
          <Plus className="w-3 h-3 mr-1.5" /> Add Color
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredColors.map((color) => (
          <ColorCard 
            key={color.id} 
            color={color} 
            onUpdate={(u) => updateColor(color.id, u)}
            onRemove={() => removeColor(color.id)}
          />
        ))}
        {filteredColors.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl bg-gray-50/50">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No {activeType} colors defined</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ColorCard({ color, onUpdate, onRemove }: { 
  color: ColorToken; 
  onUpdate: (u: Partial<ColorToken>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4 hover:shadow-lg transition-all group relative overflow-hidden">
      <div className="absolute top-2 right-2 flex gap-1">
         <button 
          type="button"
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 rounded-xl transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Token Name</label>
          <Input 
            value={color.name} 
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="h-10 text-xs font-bold border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl px-3 text-gray-900 dark:text-white"
          />
        </div>

        <ColorPicker 
          value={color.value}
          onChange={(val) => onUpdate({ value: val })}
        />
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1.5">Accessibility</p>
          <div className="flex items-center justify-between">
            <Badge className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[8px] font-black h-4 px-1">PASS AAA</Badge>
            <span className="text-[10px] font-bold text-gray-900 dark:text-white">7.4:1</span>
          </div>
        </div>
        <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
          <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1.5">HSL Values</p>
          <p className="text-[10px] font-mono font-bold text-gray-600">232° 84% 63%</p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <div className="flex -space-x-1">
          <div className="w-4 h-4 rounded-full border border-white dark:border-gray-900 bg-white shadow-sm" />
          <div className="w-4 h-4 rounded-full border border-white dark:border-gray-900 bg-gray-900 shadow-sm" />
        </div>
        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Compatible with dark mode</span>
      </div>
    </div>
  );
}
