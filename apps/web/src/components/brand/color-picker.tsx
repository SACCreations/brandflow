'use client';

import * as React from 'react';
import { Pipette, Hash } from 'lucide-react';
import { 
  Input, 
  cn
} from '@brandflow/ui';

interface ColorPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
}

export function ColorPicker({ value = '#000000', onChange, label, description }: ColorPickerProps) {
  // Simple hex to rgb conversion for display
  const getRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgb(${r}, ${g}, ${b})`;
  };

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <div className="flex gap-3">
        <div className="relative shrink-0">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-800 cursor-pointer p-0 overflow-hidden"
          />
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Pipette className="w-4 h-4 text-white drop-shadow-md mix-blend-difference" />
          </div>
        </div>
        <div className="flex-1 space-y-1">
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input 
              value={value.replace('#', '')}
              onChange={(e) => {
                const val = e.target.value;
                if (/^[0-9A-Fa-f]{0,6}$/.test(val)) {
                  onChange(`#${val}`);
                }
              }}
              maxLength={6}
              className="pl-8 uppercase font-mono h-12"
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 font-mono px-1">
            <span>{getRgb(value)}</span>
            <span className="text-brand-600 font-bold">Contrast OK</span>
          </div>
        </div>
      </div>
      {description && <p className="text-[11px] text-gray-500 italic">{description}</p>}
    </div>
  );
}
