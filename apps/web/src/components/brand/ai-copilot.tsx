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
  const [messages, setMessages] = React.useState<Message[]>([
    { role: 'assistant', content: `Hello! I'm your Brand Intelligence Co-pilot. I've indexed **${brandData.name || 'your brand'}**'s identity. How can I help you today?` }
  ]);
  const [input, setInput] = React.useState('');

  const handleSend = () => {
    if (!input.trim()) return;
    const newMessages: Message[] = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    
    // Mock response
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: `Based on your **Governance Rules**, you should avoid using the word "${input.includes('cheap') ? 'cheap' : 'basic'}" as it conflicts with your **Luxury** tone marker. Would you like me to suggest some alternatives?` 
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">
      <div className="p-6 border-b border-gray-100 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-100">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">AI Co-pilot</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Intelligence</span>
              </div>
            </div>
          </div>
          <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all">
            <RefreshCcw className="w-3.5 h-3.5 text-gray-400" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
           <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center gap-1.5">
                 <ShieldCheck className="w-3 h-3 text-brand-600" />
                 <span className="text-[8px] font-black uppercase text-gray-400">Compliance</span>
              </div>
              <p className="text-xs font-black text-gray-900 dark:text-white">94% Score</p>
           </div>
           <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 space-y-2">
              <div className="flex items-center gap-1.5">
                 <Zap className="w-3 h-3 text-amber-500" />
                 <span className="text-[8px] font-black uppercase text-gray-400">Context</span>
              </div>
              <p className="text-xs font-black text-gray-900 dark:text-white">Full Access</p>
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
              m.role === 'assistant' ? "bg-brand-50 text-brand-600" : "bg-gray-900 text-white"
            )}>
              {m.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
            </div>
            <div className={cn(
              "p-4 rounded-2xl text-xs font-medium leading-relaxed",
              m.role === 'assistant' ? "bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-800" : "bg-brand-600 text-white"
            )}>
              {m.content}
            </div>
          </div>
        ))}
      </div>

      <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="relative group">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about your brand..."
            className="h-14 pr-12 bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800 rounded-2xl font-bold text-xs focus:ring-brand-500 group-hover:border-brand-200 transition-all shadow-inner"
          />
          <button 
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-brand-600 text-white rounded-xl shadow-lg shadow-brand-200 active:scale-95 transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[9px] text-gray-400 font-medium text-center mt-4 uppercase tracking-widest flex items-center justify-center gap-2">
          <Info className="w-3 h-3" />
          Powered by Brand Intelligence V2
        </p>
      </div>
    </div>
  );
}
