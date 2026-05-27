'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Loader2,
  Lightbulb,
  Palette,
  FileText,
  TrendingUp,
  RotateCcw,
  Plus,
  Trash2,
  MessageSquare,
  ArrowRightCircle,
  X,
  Check,
  Zap,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, type ChatMessage } from '@/store/chat.store';
import { cn } from '@brandflow/ui';

const SUGGESTIONS = [
  { icon: Lightbulb, text: 'Suggest 3 LinkedIn post ideas for my brand' },
  { icon: Palette, text: 'What colors work best for my brand identity?' },
  { icon: FileText, text: 'Help me write an Instagram caption' },
  { icon: TrendingUp, text: 'What content trends should I follow this week?' },
];

const PLATFORMS = ['linkedin', 'instagram', 'facebook', 'twitter', 'tiktok'];
const CONTENT_TYPES = ['post', 'caption', 'ad_copy', 'blog_snippet', 'hook', 'cta', 'email', 'article'];

export default function ChatPage() {
  const [input, setInput] = useState('');
  const [selectedBrandId, setSelectedBrandId] = useState<string | undefined>();
  const [convertModal, setConvertModal] = useState<{ messageId: string; content: string } | null>(null);
  const [convertPlatform, setConvertPlatform] = useState('linkedin');
  const [convertType, setConvertType] = useState('post');
  const [isConverting, setIsConverting] = useState(false);
  const [convertSuccess, setConvertSuccess] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    isSending,
    fetchConversations,
    createConversation,
    selectConversation,
    deleteConversation,
    sendMessage,
    convertToContent,
    reset,
  } = useChatStore();

  const { data: brands } = useQuery({
    queryKey: ['brands-list'],
    queryFn: async () => {
      const res = await apiClient.get('/brands');
      return res.data as { id: string; name: string }[];
    },
  });

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(async (content?: string) => {
    const text = content || input.trim();
    if (!text || isSending) return;

    // Create a conversation if none is active
    if (!activeConversationId) {
      await createConversation(selectedBrandId);
    }

    setInput('');
    await sendMessage(text);
    inputRef.current?.focus();
  }, [input, isSending, activeConversationId, selectedBrandId, createConversation, sendMessage]);

  const handleNewChat = async () => {
    reset();
  };

  const handleConvert = async () => {
    if (!convertModal) return;
    setIsConverting(true);
    try {
      const result = await convertToContent(convertModal.messageId, convertPlatform, convertType);
      setConvertSuccess(result.id);
      setTimeout(() => {
        setConvertModal(null);
        setConvertSuccess(null);
      }, 2000);
    } catch {
      // Error handled silently
    } finally {
      setIsConverting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] animate-in fade-in duration-500">
      {/* Sidebar — Conversations */}
      <div className="hidden w-72 flex-shrink-0 flex-col border-r border-border/60 md:flex">
        <div className="flex items-center justify-between border-b border-border/60 p-4 border-border">
          <h2 className="text-sm font-semibold text-foreground">Conversations</h2>
          <button
            onClick={handleNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-2 dark:hover:bg-surface-1"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Brand filter */}
        {brands && brands.length > 0 && (
          <div className="border-b border-border/60 p-3 border-border">
            <select
              value={selectedBrandId || ''}
              onChange={(e) => {
                setSelectedBrandId(e.target.value || undefined);
                fetchConversations(e.target.value || undefined);
              }}
              className="w-full rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground border-border bg-background text-foreground"
            >
              <option value="">All brands</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-xs text-muted-foreground">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex cursor-pointer items-start gap-2 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-surface-1 bg-background border-border dark:hover:bg-surface-1/50 ${
                  conv.id === activeConversationId ? 'bg-primary/10 dark:bg-primary/100/10' : ''
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {conv.title}
                  </p>
                  {conv.brandName && (
                    <p className="text-[10px] text-primary">{conv.brandName}</p>
                  )}
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{conv.lastMessage}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-red-500 group-hover:flex"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex flex-1 flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-3 border-border">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground">Brand Assistant</h1>
              <p className="text-[10px] text-muted-foreground">AI-powered brand guidance & content creation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Brand selector for new conversations */}
            {!activeConversationId && brands && brands.length > 0 && (
              <select
                value={selectedBrandId || ''}
                onChange={(e) => setSelectedBrandId(e.target.value || undefined)}
                className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground border-border bg-background text-foreground"
              >
                <option value="">No brand context</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            )}
            {activeConversationId && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-surface-1 bg-background border-border text-muted-foreground dark:hover:bg-surface-1"
              >
                <RotateCcw className="h-3 w-3" />
                New Chat
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : messages.length === 0 && !activeConversationId ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-500/10 dark:to-purple-500/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-foreground">How can I help?</h2>
              <p className="mb-8 max-w-sm text-center text-sm text-muted-foreground">
                Ask me anything about your brand strategy, content ideas, or get help writing.
              </p>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion.text)}
                    className="flex items-center gap-3 rounded-xl border border-border bg-background p-4 text-left transition-all hover:border-brand-300 hover:shadow-md border-border bg-background dark:hover:border-brand-600"
                  >
                    <suggestion.icon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="text-sm text-foreground">{suggestion.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              <AnimatePresence initial={false}>
                {messages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className={`group flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-foreground">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div className="max-w-[85%]">
                      <div
                        className={cn(
                          "rounded-2xl px-5 py-3.5 shadow-sm transition-all",
                          msg.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-surface-1/80 border border-border/50 text-foreground rounded-bl-sm backdrop-blur-sm'
                        )}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed font-medium">{msg.content}</p>
                        {msg.role === 'assistant' && msg.latency && (
                          <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">
                            <Zap className="h-3 w-3" />
                            {msg.provider} · {msg.model} · {msg.latency}ms
                          </p>
                        )}
                      </div>
                      {/* Convert to Content action */}
                      {msg.role === 'assistant' && msg.id && !msg.id.includes('-temp') && (
                        <button
                          onClick={() => setConvertModal({ messageId: msg.id, content: msg.content })}
                          className="mt-2 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-0 transition-all hover:bg-primary/10 hover:text-primary group-hover:opacity-100 border border-transparent hover:border-primary/20"
                        >
                          <ArrowRightCircle className="h-3.5 w-3.5" />
                          Convert to Content
                        </button>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-3 bg-surface-3">
                        <User className="h-4 w-4 text-muted-foreground text-foreground" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isSending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-foreground">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-surface-2 px-4 py-3 bg-surface-2">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/60 px-6 py-4 border-border">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-border bg-background p-3 shadow-sm border-border bg-background">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your brand, request content ideas, or get writing help..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-foreground outline-none placeholder:text-foreground"
                style={{ maxHeight: '120px' }}
                disabled={isSending}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-foreground transition-all hover:bg-brand-700 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              AI responses are generated and may not always be accurate. Review before using.
            </p>
          </div>
        </div>
      </div>

      {/* Convert to Content Modal */}
      <AnimatePresence>
        {convertModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => !isConverting && setConvertModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-2xl bg-background p-6 shadow-xl bg-background"
            >
              {convertSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-foreground">Content draft created!</p>
                  <p className="text-xs text-muted-foreground">You can find it in your content library.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-foreground">Convert to Content</h3>
                    <button
                      onClick={() => setConvertModal(null)}
                      className="text-muted-foreground hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mb-4 rounded-lg bg-surface-1 bg-background p-3 bg-surface-2">
                    <p className="line-clamp-3 text-xs text-muted-foreground">
                      {convertModal.content}
                    </p>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Platform
                      </label>
                      <select
                        value={convertPlatform}
                        onChange={(e) => setConvertPlatform(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm border-border bg-surface-2 text-foreground"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-foreground">
                        Content Type
                      </label>
                      <select
                        value={convertType}
                        onChange={(e) => setConvertType(e.target.value)}
                        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm border-border bg-surface-2 text-foreground"
                      >
                        {CONTENT_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    onClick={handleConvert}
                    disabled={isConverting}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-brand-700 disabled:opacity-50"
                  >
                    {isConverting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Converting...
                      </>
                    ) : (
                      <>
                        <ArrowRightCircle className="h-4 w-4" />
                        Create Content Draft
                      </>
                    )}
                  </button>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

