'use client';

import * as React from 'react';
import { 
  Search, 
  Building2, 
  Palette, 
  MessageSquare, 
  ShieldCheck, 
  Command,
  Save,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { 
  Dialog, 
  DialogContent, 
  DialogTitle,
  DialogDescription,
  Input, 
  cn 
} from '@brandflow/ui';
import { useRouter } from 'next/navigation';

interface CommandPaletteProps {
  onJump?: (id: string) => void;
  onSave?: () => void;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}

const COMMANDS = [
  { id: 'basics', label: 'Jump to Brand Basics', icon: Building2, category: 'Navigation' },
  { id: 'visuals', label: 'Jump to Visual Identity', icon: Palette, category: 'Navigation' },
  { id: 'identity', label: 'Jump to Tone & Personality', icon: MessageSquare, category: 'Navigation' },
  { id: 'governance', label: 'Jump to Governance', icon: ShieldCheck, category: 'Navigation' },
  { id: 'save', label: 'Save Changes', icon: Save, category: 'Actions', shortcut: '⌘S' },
  { id: 'back', label: 'Back to Brands', icon: ArrowLeft, category: 'Actions' },
  { id: 'settings', label: 'Brand Settings', icon: Settings, category: 'Actions' },
];

export function CommandPalette({ onJump, onSave, open, setOpen }: CommandPaletteProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();

  const isControlled = typeof open === 'boolean' && !!setOpen;
  const paletteOpen = isControlled ? open : internalOpen;
  const updateOpen = React.useCallback((value: boolean | ((current: boolean) => boolean)) => {
    if (setOpen) {
      setOpen(value as React.SetStateAction<boolean>);
      return;
    }

    setInternalOpen(value as React.SetStateAction<boolean>);
  }, [setOpen]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        updateOpen((current) => !current);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [updateOpen]);

  const filteredCommands = query === '' 
    ? COMMANDS 
    : COMMANDS.filter(cmd => cmd.label.toLowerCase().includes(query.toLowerCase()));

  const handleSelect = (id: string) => {
    updateOpen(false);
    if (id === 'save') onSave?.();
    else if (id === 'back') router.push('/intelligence/brands');
    else onJump?.(id);
  };

  return (
    <>
      <button 
        onClick={() => updateOpen(true)}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-background/80 bg-background/80 backdrop-blur-md border border-border px-4 py-2 rounded-full shadow-2xl flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-primary transition-all hover:scale-105 group"
      >
        <Command className="w-3.5 h-3.5" />
        <span>Press <kbd className="font-sans font-bold text-foreground group-hover:text-primary">⌘K</kbd> to open Command Palette</span>
      </button>

      <Dialog open={paletteOpen} onOpenChange={updateOpen}>
        <DialogContent className="p-0 overflow-hidden sm:max-w-[550px] top-[20%] translate-y-0 bg-background border-border">
          <DialogTitle className="sr-only">Command Palette</DialogTitle>
          <DialogDescription className="sr-only">Search and execute commands within the brand studio.</DialogDescription>
          <div className="p-4 border-b border-border/60">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search commands..." 
                className="pl-8 h-12 text-base border-none focus-visible:ring-0 shadow-none bg-transparent"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[350px] overflow-y-auto p-2">
            {filteredCommands.length > 0 ? (
              <div className="space-y-4 pb-2">
                {['Navigation', 'Actions'].map((category) => {
                  const cmds = filteredCommands.filter(c => c.category === category);
                  if (cmds.length === 0) return null;
                  return (
                    <div key={category} className="space-y-1">
                      <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{category}</p>
                      {cmds.map((cmd) => {
                        const Icon = cmd.icon;
                        return (
                          <button
                            key={cmd.id}
                            onClick={() => handleSelect(cmd.id)}
                            className="w-full flex items-center justify-between px-3 py-3 rounded-lg text-sm font-medium hover:bg-primary/10 dark:hover:bg-brand-900/20 hover:text-brand-700 dark:hover:text-brand-300 transition-all text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-1.5 bg-surface-3 rounded-md group-hover:bg-background dark:group-hover:bg-gray-700 transition-colors">
                                <Icon className="w-4 h-4" />
                              </div>
                              {cmd.label}
                            </div>
                            {cmd.shortcut && (
                              <kbd className="text-[10px] font-sans bg-surface-3 px-1.5 py-0.5 rounded text-muted-foreground">{cmd.shortcut}</kbd>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground">No commands found</div>
            )}
          </div>
          <div className="p-3 border-t border-border/60 bg-surface-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <div className="flex gap-3">
              <span><kbd className="font-sans font-bold">↵</kbd> Select</span>
              <span><kbd className="font-sans font-bold">↑↓</kbd> Navigate</span>
            </div>
            <span>Brand Studio v1.0</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
