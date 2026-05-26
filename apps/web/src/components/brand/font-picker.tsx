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
  { name: 'Outfit', category: 'Geometric Sans' },
  { name: 'Satoshi', category: 'Modern Sans' },
  { name: 'Clash Display', category: 'Bold Display' },
  { name: 'General Sans', category: 'Professional Sans' },
  { name: 'Urbanist', category: 'Modern Sans' },
  { name: 'Plus Jakarta Sans', category: 'Geometric Sans' },
  { name: 'Fraunces', category: 'Serif Display' },
  { name: 'Bormioli', category: 'Serif' },
  { name: 'Libre Baskerville', category: 'Serif' },
  { name: 'Source Sans Pro', category: 'Sans Serif' },
  { name: 'Source Serif Pro', category: 'Serif' },
  { name: 'IBM Plex Sans', category: 'Sans Serif' },
  { name: 'IBM Plex Serif', category: 'Serif' },
  { name: 'IBM Plex Mono', category: 'Monospace' },
  { name: 'JetBrains Mono', category: 'Monospace' },
  { name: 'DM Sans', category: 'Sans Serif' },
  { name: 'Manrope', category: 'Sans Serif' },
  { name: 'Red Hat Display', category: 'Display' },
  { name: 'Lexend', category: 'Sans Serif' },
  { name: 'Archivo', category: 'Sans Serif' },
  { name: 'Cormorant Garamond', category: 'Serif' },
  { name: 'Epilogue', category: 'Sans Serif' },
  { name: 'Space Mono', category: 'Monospace' },
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
      {label && <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{label}</label>}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full justify-between font-bold hover:bg-surface-1 bg-background h-12 border-border/60 rounded-xl shadow-sm transition-all active:scale-[0.98]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-surface-1 bg-background text-muted-foreground">
                <Type className="w-4 h-4" />
              </div>
              <span style={{ fontFamily: value }} className="text-sm">{value || 'Select a font'}</span>
            </div>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10 text-[8px] font-black uppercase tracking-widest">Google Fonts</Badge>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[320px] p-0 rounded-2xl border-border/60 shadow-2xl bg-background/95 bg-background/95 backdrop-blur-xl" align="start">
          <div className="p-4 border-b border-border/60">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input 
                placeholder="Search 1000+ fonts..." 
                className="pl-10 h-10 text-sm bg-surface-1 dark:bg-gray-950/50 border-border/60 rounded-xl focus-visible:ring-primary/20"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[360px] overflow-y-auto p-2 custom-scrollbar">
            {filteredFonts.length > 0 ? (
              filteredFonts.map((font) => (
                <DropdownMenuItem 
                  key={font.name}
                  className="flex items-center justify-between py-3 px-4 cursor-pointer rounded-xl focus:bg-primary/10 dark:focus:bg-brand-900/20 group transition-colors"
                  onSelect={() => onChange(font.name)}
                >
                  <div className="flex flex-col">
                    <span style={{ fontFamily: font.name }} className="text-base text-foreground group-focus:text-brand-700">{font.name}</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{font.category}</span>
                  </div>
                  {value === font.name && <Check className="w-4 h-4 text-primary" />}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground font-medium italic">No matches found</div>
            )}
          </div>
          <div className="p-3 border-t border-border/60 bg-surface-1 dark:bg-gray-950/50 bg-surface-2/50 text-[9px] font-black text-muted-foreground text-center uppercase tracking-widest rounded-b-2xl">
            Powered by Brandflow Intelligence
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
      {description && <p className="text-[10px] text-muted-foreground font-medium px-1">{description}</p>}
      
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
