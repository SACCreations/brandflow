'use client';

import * as React from 'react';
import { Check, Search, Type } from 'lucide-react';
import { 
  Button, 
  Input, 
  Badge,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  cn
} from '@brandflow/ui';

const POPULAR_FONTS = [
  { name: 'Inter', category: 'Sans Serif' },
  { name: 'Roboto', category: 'Sans Serif' },
  { name: 'Open Sans', category: 'Sans Serif' },
  { name: 'Lato', category: 'Sans Serif' },
  { name: 'Montserrat', category: 'Sans Serif' },
  { name: 'Oswald', category: 'Sans Serif' },
  { name: 'Raleway', category: 'Sans Serif' },
  { name: 'Playfair Display', category: 'Serif' },
  { name: 'Merriweather', category: 'Serif' },
  { name: 'Lora', category: 'Serif' },
  { name: 'PT Serif', category: 'Serif' },
  { name: 'Poppins', category: 'Sans Serif' },
  { name: 'Work Sans', category: 'Sans Serif' },
  { name: 'Fira Sans', category: 'Sans Serif' },
  { name: 'Quicksand', category: 'Sans Serif' },
  { name: 'Space Grotesk', category: 'Sans Serif' },
  { name: 'Syne', category: 'Display' },
  { name: 'Cabinet Grotesk', category: 'Display' },
];

interface FontPickerProps {
  value?: string;
  onChange: (value: string) => void;
  label?: string;
  description?: string;
}

export function FontPicker({ value, onChange, label, description }: FontPickerProps) {
  const [search, setSearch] = React.useState('');
  
  const filteredFonts = POPULAR_FONTS.filter(f => 
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-normal hover:bg-gray-50 h-11 border-gray-200">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-gray-400" />
              <span style={{ fontFamily: value }}>{value || 'Select a font'}</span>
            </div>
            <Badge variant="secondary" className="text-[10px] ml-2">Google Fonts</Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[300px] p-0" align="start">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Search fonts..." 
                className="pl-8 h-9 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[300px] overflow-y-auto p-1">
            {filteredFonts.length > 0 ? (
              filteredFonts.map((font) => (
                <DropdownMenuItem 
                  key={font.name}
                  className="flex items-center justify-between py-2 cursor-pointer"
                  onSelect={() => onChange(font.name)}
                >
                  <div className="flex flex-col">
                    <span style={{ fontFamily: font.name }} className="text-base">{font.name}</span>
                    <span className="text-[10px] text-gray-400">{font.category}</span>
                  </div>
                  {value === font.name && <Check className="w-4 h-4 text-brand-600" />}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-gray-500">No fonts found</div>
            )}
          </div>
          <div className="p-2 border-t bg-gray-50 text-[10px] text-gray-400 text-center">
            Previews use Google Fonts API
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {description && <p className="text-[11px] text-gray-500 italic mt-1">{description}</p>}
      
      {/* Hidden link to load font for preview if needed */}
      {value && (
        <link 
          href={`https://fonts.googleapis.com/css2?family=${value.replace(/ /g, '+')}:wght@400;700&display=swap`} 
          rel="stylesheet" 
        />
      )}
    </div>
  );
}
