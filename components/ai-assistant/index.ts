// AI Assistant Library - Main Export File
// Designed for npm package: @yourname/react-native-ai-assistant

// Core Components
export { AIAssistant, useAIAssistant } from './core/AIAssistant';
export { AIProvider } from './core/AIProvider';

// Individual Components (for advanced customization)
export { FloatingButton } from './components/FloatingButton';

// Types
export type {
  AIAssistantConfig,
  AIAssistantProps,
  AIAssistantCallbacks,
  Message,
  AIAction,
  AIResponse,
  ChatState,
  FloatingButtonProps,
  ChatModalProps,
  MessageBubbleProps,
} from './core/types';

// Version info for npm package
export const version = '1.0.0';

// Default configurations that can be imported
export const defaultConfigs = {
  light: {
    theme: {
      primary: '#007AFF',
      secondary: '#FF3B30',
      background: '#FFFFFF',
      text: '#000000',
      border: '#E5E5E7',
    },
  },
  dark: {
    theme: {
      primary: '#0A84FF',
      secondary: '#FF453A',
      background: '#000000',
      text: '#FFFFFF',
      border: '#333333',
    },
  },
  fitness: {
    theme: {
      primary: '#4CAF50',
      secondary: '#FF9800',
      background: '#121212',
      text: '#FFFFFF',
      border: '#2E2E2E',
    },
    button: {
      icon: 'activity',
    },
    chat: {
      placeholder: 'Ask me about your workout...',
    },
  },
};
