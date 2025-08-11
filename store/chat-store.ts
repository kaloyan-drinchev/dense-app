import { create } from 'zustand';
import { Message } from '@/components/ai-assistant/core/types';

interface ChatState {
  messages: Message[];
  isTyping: boolean;
  hasNotifications: boolean;
  addMessage: (message: Message) => void;
  setTyping: (typing: boolean) => void;
  setNotifications: (hasNotifications: boolean) => void;
  clearHistory: () => void;
}

const initialMessage: Message = {
  id: 'welcome',
  content: "Hi! I'm Rork, your AI fitness assistant. I can help you modify your workout programs, answer fitness questions, and generate new training plans based on the DENSE philosophy. What would you like to work on today?",
  role: 'assistant',
  timestamp: new Date(),
};

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [initialMessage],
  isTyping: false,
  hasNotifications: false,

  addMessage: (message: Message) => {
    set((state) => ({
      messages: [...state.messages, message],
    }));
  },

  setTyping: (typing: boolean) => {
    set({ isTyping: typing });
  },

  setNotifications: (hasNotifications: boolean) => {
    set({ hasNotifications });
  },

  clearHistory: () => {
    set({ messages: [initialMessage] });
  },
}));
