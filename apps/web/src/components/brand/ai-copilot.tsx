'use client';

import * as React from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  RefreshCcw,
  ShieldCheck,
  Zap,
  Info
} from 'lucide-react';
import { Button, cn, Input, Badge } from '@brandflow/ui';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AICopilot({ brandData }: { brandData: any }) {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="p-6 border-b border-border/60 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary text-foreground shadow-lg shadow-brand-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">AI Co-pilot</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest">Active Intelligence</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-surface-2 dark:hover:bg-surface-1 rounded-xl transition-all">
            <RefreshCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
           <div className="p-3 rounded-2xl bg-surface-1 bg-background border border-border/60 space-y-2">
              <div className="flex items-center gap-1.5">
                 <ShieldCheck className="w-3 h-3 text-primary" />
                 <span className="text-[8px] font-black uppercase text-muted-foreground">Compliance</span>
              </div>
              <p className="text-xs font-black text-foreground">94% Score</p>
           </div>
           <div className="p-3 rounded-2xl bg-surface-1 bg-background border border-border/60 space-y-2">
              <div className="flex items-center gap-1.5">
                 <Zap className="w-3 h-3 text-amber-500" />
                 <span className="text-[8px] font-black uppercase text-muted-foreground">Context</span>
              </div>
              <p className="text-xs font-black text-foreground">Full Access</p>
           </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={cn(
            "flex gap-4 max-w-[90%]",
            m.role === 'user' ? "ml-auto flex-row-reverse" : ""
          )}>
            <div className={cn(
              "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
              m.role === 'assistant' ? "bg-primary/10 text-primary" : "bg-background text-foreground"
            )}>
              {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-xs font-medium leading-relaxed",
              m.role === 'assistant' ? "bg-surface-1 bg-background text-foreground border border-border/60" : "bg-primary text-foreground"
            )}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-border/60 bg-background">
        <div className="relative group">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your brand..."
            className="h-14 pr-12 bg-surface-1 bg-background border-border/60 rounded-2xl font-bold text-xs focus:ring-primary/20 group-hover:border-primary/20 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary text-foreground rounded-xl shadow-lg shadow-brand-200 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-muted-foreground font-medium text-center mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
          <Info className="w-3 h-3" />
          Powered by Brand Intelligence V2
        </p>
      </div>
    </div>
  );
}
