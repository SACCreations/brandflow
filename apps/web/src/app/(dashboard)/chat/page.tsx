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
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore, type ChatMessage } from '@/store/chat.store';

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
      <div className="hidden w-72 flex-shrink-0 flex-col border-r border-gray-100 dark:border-gray-800 md:flex">
        <div className="flex items-center justify-between border-b border-gray-100 p-4 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Conversations</h2>
          <button
            onClick={handleNewChat}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            title="New Chat"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {/* Brand filter */}
        {brands && brands.length > 0 && (
          <div className="border-b border-gray-100 p-3 dark:border-gray-800">
            <select
              value={selectedBrandId || ''}
              onChange={(e) => {
                setSelectedBrandId(e.target.value || undefined);
                fetchConversations(e.target.value || undefined);
              }}
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
            <p className="p-4 text-xs text-gray-400">No conversations yet</p>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`group flex cursor-pointer items-start gap-2 border-b border-gray-50 px-4 py-3 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50 ${
                  conv.id === activeConversationId ? 'bg-brand-50 dark:bg-brand-500/10' : ''
                }`}
                onClick={() => selectConversation(conv.id)}
              >
                <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                    {conv.title}
                  </p>
                  {conv.brandName && (
                    <p className="text-[10px] text-brand-500">{conv.brandName}</p>
                  )}
                  {conv.lastMessage && (
                    <p className="mt-0.5 truncate text-[11px] text-gray-400">{conv.lastMessage}</p>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conv.id);
                  }}
                  className="hidden h-6 w-6 shrink-0 items-center justify-center rounded text-gray-400 hover:text-red-500 group-hover:flex"
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
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 dark:text-white">Brand Assistant</h1>
              <p className="text-[10px] text-gray-500">AI-powered brand guidance & content creation</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Brand selector for new conversations */}
            {!activeConversationId && brands && brands.length > 0 && (
              <select
                value={selectedBrandId || ''}
                onChange={(e) => setSelectedBrandId(e.target.value || undefined)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
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
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
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
              <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
            </div>
          ) : messages.length === 0 && !activeConversationId ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-100 to-purple-100 dark:from-brand-500/10 dark:to-purple-500/10">
                <Bot className="h-8 w-8 text-brand-600" />
              </div>
              <h2 className="mb-2 text-xl font-bold text-gray-900 dark:text-white">How can I help?</h2>
              <p className="mb-8 max-w-sm text-center text-sm text-gray-500">
                Ask me anything about your brand strategy, content ideas, or get help writing.
              </p>
              <div className="grid w-full max-w-2xl gap-3 sm:grid-cols-2">
                {SUGGESTIONS.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(suggestion.text)}
                    className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-brand-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-900 dark:hover:border-brand-600"
                  >
                    <suggestion.icon className="h-5 w-5 shrink-0 text-brand-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{suggestion.text}</span>
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
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-white">
                        <Bot className="h-4 w-4" />
                      </div>
                    )}
                    <div className="max-w-[80%]">
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-brand-600 text-white'
                            : 'bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                        {msg.role === 'assistant' && msg.latency && (
                          <p className="mt-2 text-[10px] text-gray-400">
                            {msg.provider} · {msg.model} · {msg.latency}ms
                          </p>
                        )}
                      </div>
                      {/* Convert to Content action */}
                      {msg.role === 'assistant' && msg.id && !msg.id.includes('-temp') && (
                        <button
                          onClick={() => setConvertModal({ messageId: msg.id, content: msg.content })}
                          className="mt-1 flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-medium text-gray-400 opacity-0 transition-opacity hover:text-brand-500 group-hover:opacity-100"
                        >
                          <ArrowRightCircle className="h-3 w-3" />
                          Convert to Content
                        </button>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-200 dark:bg-gray-700">
                        <User className="h-4 w-4 text-gray-600 dark:text-gray-300" />
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isSending && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-purple-600 text-white">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-gray-100 px-4 py-3 dark:bg-gray-800">
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-brand-500" />
                      <span className="text-sm text-gray-500">Thinking...</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700 dark:bg-gray-900">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your brand, request content ideas, or get writing help..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-white"
                style={{ maxHeight: '120px' }}
                disabled={isSending}
              />
              <button
                onClick={() => handleSend()}
                disabled={!input.trim() || isSending}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white transition-all hover:bg-brand-700 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-center text-[10px] text-gray-400">
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
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
            >
              {convertSuccess ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
                    <Check className="h-6 w-6 text-green-600" />
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Content draft created!</p>
                  <p className="text-xs text-gray-500">You can find it in your content library.</p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Convert to Content</h3>
                    <button
                      onClick={() => setConvertModal(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="mb-4 rounded-lg bg-gray-50 p-3 dark:bg-gray-800">
                    <p className="line-clamp-3 text-xs text-gray-600 dark:text-gray-400">
                      {convertModal.content}
                    </p>
                  </div>

                  <div className="mb-4 space-y-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Platform
                      </label>
                      <select
                        value={convertPlatform}
                        onChange={(e) => setConvertPlatform(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                      >
                        {PLATFORMS.map((p) => (
                          <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300">
                        Content Type
                      </label>
                      <select
                        value={convertType}
                        onChange={(e) => setConvertType(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
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
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
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

