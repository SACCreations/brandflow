'use client';

import * as React from 'react';
import {
  Search,
  LayoutDashboard,
  MessageSquare,
  Fingerprint,
  BookOpen,
  PenTool,
  Image,
  Target,
  Calendar,
  Zap,
  BarChart3,
  Building2,
  Settings2,
  CreditCard,
  Users,
  Moon,
  Sun,
} from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription, Input, cn } from '@brandflow/ui';
import { useRouter } from 'next/navigation';

interface GlobalCommand {
  id: string;
  label: string;
  icon: React.ElementType;
  category: string;
  action?: () => void;
  href?: string;
  shortcut?: string;
}

export function GlobalCommandPalette() {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const router = useRouter();
  const inputRef = React.useRef<HTMLInputElement>(null);

  const commands: GlobalCommand[] = React.useMemo(
    () => [
      { id: 'dashboard', label: 'Go to Dashboard', icon: LayoutDashboard, category: 'Navigate', href: '/dashboard' },
      { id: 'chat', label: 'Open Chat', icon: MessageSquare, category: 'Navigate', href: '/chat' },
      { id: 'brands', label: 'Brands', icon: Fingerprint, category: 'Navigate', href: '/intelligence/brands' },
      { id: 'knowledge', label: 'Knowledge Hub', icon: BookOpen, category: 'Navigate', href: '/intelligence/knowledge' },
      { id: 'content', label: 'Create Content', icon: PenTool, category: 'Navigate', href: '/create/content' },
      { id: 'images', label: 'Generate Images', icon: Image, category: 'Navigate', href: '/create/image' },
      { id: 'campaigns', label: 'Campaigns', icon: Target, category: 'Navigate', href: '/campaigns' },
      { id: 'calendar', label: 'Publishing Calendar', icon: Calendar, category: 'Navigate', href: '/publish/calendar' },
      { id: 'automations', label: 'Automations', icon: Zap, category: 'Navigate', href: '/automations' },
      { id: 'analytics', label: 'Analytics', icon: BarChart3, category: 'Navigate', href: '/analytics' },
      { id: 'business', label: 'Business Settings', icon: Building2, category: 'Settings', href: '/settings/business' },
      { id: 'llm', label: 'LLM Settings', icon: Settings2, category: 'Settings', href: '/settings/llm' },
      { id: 'billing', label: 'Billing', icon: CreditCard, category: 'Settings', href: '/settings/billing' },
      { id: 'team', label: 'Team Members', icon: Users, category: 'Settings', href: '/settings/team' },
    ],
    [],
  );

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  React.useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);

  const filtered = query === ''
    ? commands
    : commands.filter((cmd) => cmd.label.toLowerCase().includes(query.toLowerCase()));

  const categories = [...new Set(filtered.map((c) => c.category))];

  const handleSelect = (cmd: GlobalCommand) => {
    setOpen(false);
    if (cmd.action) cmd.action();
    else if (cmd.href) router.push(cmd.href);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0 overflow-hidden sm:max-w-[550px] top-[20%] translate-y-0 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
        <DialogTitle className="sr-only">Command Palette</DialogTitle>
        <DialogDescription className="sr-only">Navigate anywhere in BrandFlow</DialogDescription>
        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              placeholder="Type a command or search..."
              className="h-12 pl-10 text-base border-none focus-visible:ring-0 shadow-none bg-transparent"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:border-gray-700 dark:bg-gray-800">
              ESC
            </kbd>
          </div>
        </div>
        <div className="max-h-[350px] overflow-y-auto p-2">
          {filtered.length > 0 ? (
            <div className="space-y-3 pb-2">
              {categories.map((category) => {
                const cmds = filtered.filter((c) => c.category === category);
                return (
                  <div key={category}>
                    <p className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      {category}
                    </p>
                    {cmds.map((cmd) => {
                      const Icon = cmd.icon;
                      return (
                        <button
                          key={cmd.id}
                          onClick={() => handleSelect(cmd)}
                          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-brand-50 hover:text-brand-700 dark:text-gray-300 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
                        >
                          <Icon className="h-4 w-4 shrink-0 text-gray-400" />
                          {cmd.label}
                          {cmd.shortcut && (
                            <kbd className="ml-auto text-[10px] text-gray-400">{cmd.shortcut}</kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-sm text-gray-400">No results found</div>
          )}
        </div>
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/50 px-4 py-2.5 text-[10px] text-gray-400 dark:border-gray-800 dark:bg-gray-800/50">
          <div className="flex gap-4">
            <span><kbd className="font-bold">↵</kbd> Open</span>
            <span><kbd className="font-bold">↑↓</kbd> Navigate</span>
          </div>
          <span>⌘K to toggle</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
