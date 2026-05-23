import { create } from 'zustand';
import { apiClient } from '@/lib/api-client';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  provider?: string;
  model?: string;
  latency?: number;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  brandId: string | null;
  brandName: string | null;
  lastMessage: string | null;
  updatedAt: string;
  createdAt: string;
}

interface ChatState {
  conversations: Conversation[];
  activeConversationId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  isSending: boolean;

  // Actions
  fetchConversations: (brandId?: string) => Promise<void>;
  createConversation: (brandId?: string, title?: string) => Promise<string>;
  selectConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  convertToContent: (messageId: string, platform: string, type: string, campaignId?: string) => Promise<any>;
  reset: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  isLoading: false,
  isSending: false,

  fetchConversations: async (brandId?: string) => {
    try {
      const params = brandId ? { brandId } : {};
      const res = await apiClient.get('/chat/conversations', { params });
      set({ conversations: res.data });
    } catch {
      // Silently fail — user will see empty list
    }
  },

  createConversation: async (brandId?: string, title?: string) => {
    const res = await apiClient.post('/chat/conversations', { brandId, title });
    const conversation = res.data;
    set((state) => ({
      conversations: [
        {
          id: conversation.id,
          title: conversation.title || 'New conversation',
          brandId: conversation.brandId,
          brandName: conversation.brand?.name || null,
          lastMessage: null,
          updatedAt: conversation.updatedAt || conversation.createdAt,
          createdAt: conversation.createdAt,
        },
        ...state.conversations,
      ],
      activeConversationId: conversation.id,
      messages: [],
    }));
    return conversation.id;
  },

  selectConversation: async (id: string) => {
    set({ isLoading: true, activeConversationId: id });
    try {
      const res = await apiClient.get(`/chat/conversations/${id}`);
      set({ messages: res.data.messages, isLoading: false });
    } catch {
      set({ messages: [], isLoading: false });
    }
  },

  deleteConversation: async (id: string) => {
    await apiClient.delete(`/chat/conversations/${id}`);
    const state = get();
    const remaining = state.conversations.filter((c) => c.id !== id);
    set({
      conversations: remaining,
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    });
  },

  sendMessage: async (message: string) => {
    const { activeConversationId } = get();
    if (!activeConversationId) return;

    // Optimistic: add user message
    const tempUserMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, tempUserMsg], isSending: true }));

    try {
      const res = await apiClient.post(
        `/chat/conversations/${activeConversationId}/messages`,
        { message },
      );
      const assistantMsg: ChatMessage = res.data;
      set((state) => ({
        messages: [...state.messages, assistantMsg],
        isSending: false,
        conversations: state.conversations.map((c) =>
          c.id === activeConversationId
            ? { ...c, lastMessage: assistantMsg.content.slice(0, 100), updatedAt: assistantMsg.createdAt, title: c.title === 'New conversation' ? message.slice(0, 50) : c.title }
            : c,
        ),
      }));
    } catch {
      // Add error message
      set((state) => ({
        messages: [
          ...state.messages,
          {
            id: crypto.randomUUID(),
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            createdAt: new Date().toISOString(),
          },
        ],
        isSending: false,
      }));
    }
  },

  convertToContent: async (messageId: string, platform: string, type: string, campaignId?: string) => {
    const { activeConversationId } = get();
    if (!activeConversationId) throw new Error('No active conversation');

    const res = await apiClient.post(
      `/chat/conversations/${activeConversationId}/convert`,
      { messageId, platform, type, campaignId },
    );
    return res.data;
  },

  reset: () => {
    set({ activeConversationId: null, messages: [] });
  },
}));
