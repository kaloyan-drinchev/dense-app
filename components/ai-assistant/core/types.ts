// Core AI Assistant Types - Designed for npm library
export interface AIAssistantConfig {
  // Appearance
  theme?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
    border: string;
  };
  
  // Floating Button
  button?: {
    size?: number;
    position?: {
      bottom?: number;
      right?: number;
    };
    icon?: string;
    showBadge?: boolean;
  };
  
  // Chat Interface
  chat?: {
    maxHeight?: number;
    animationDuration?: number;
    placeholder?: string;
  };
  
  // AI Integration
  ai?: {
    provider: 'openai' | 'anthropic' | 'custom';
    apiKey?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
  };
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  actions?: AIAction[];
  status?: 'sending' | 'sent' | 'error';
}

export interface AIAction {
  type: 'modify_program' | 'generate_program' | 'update_settings' | 'custom';
  payload: any;
  description: string;
  requiresConfirmation?: boolean;
}

export interface AIResponse {
  message: string;
  actions?: AIAction[];
  suggestions?: string[];
}

export interface ChatState {
  messages: Message[];
  isOpen: boolean;
  isTyping: boolean;
  hasNotifications: boolean;
}

// Callback functions that the host app must provide
export interface AIAssistantCallbacks {
  // Database operations
  onModifyProgram?: (modifications: any) => Promise<void>;
  onGenerateProgram?: (parameters: any) => Promise<void>;
  onUpdateSettings?: (settings: any) => Promise<void>;
  
  // Context providers
  getCurrentUserContext?: () => any;
  getCurrentScreenContext?: () => string;
  
  // Custom actions
  onCustomAction?: (action: AIAction) => Promise<void>;
  
  // Analytics/logging
  onInteraction?: (event: string, data?: any) => void;
}

// Props for main AI Assistant component
export interface AIAssistantProps {
  config: AIAssistantConfig;
  callbacks: AIAssistantCallbacks;
  children?: React.ReactNode;
  disabled?: boolean;
}

// Props for individual components
export interface FloatingButtonProps {
  onPress: () => void;
  config: AIAssistantConfig['button'];
  theme: AIAssistantConfig['theme'];
  hasNotifications?: boolean;
  disabled?: boolean;
}

export interface ChatModalProps {
  isVisible: boolean;
  onClose: () => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isTyping: boolean;
  config: AIAssistantConfig;
}

export interface MessageBubbleProps {
  message: Message;
  theme: AIAssistantConfig['theme'];
  onActionPress?: (action: AIAction) => void;
}
