import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { AIAssistantConfig, AIAssistantCallbacks, ChatState, Message, AIAction } from './types';

// Action types for reducer
type AIAction_Type = 
  | { type: 'TOGGLE_CHAT' }
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'ADD_MESSAGE'; payload: Message }
  | { type: 'SET_TYPING'; payload: boolean }
  | { type: 'SET_NOTIFICATIONS'; payload: boolean }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'UPDATE_MESSAGE'; payload: { id: string; updates: Partial<Message> } };

// Initial state
const initialState: ChatState = {
  messages: [],
  isOpen: false,
  isTyping: false,
  hasNotifications: false,
};

// Reducer
const aiReducer = (state: ChatState, action: AIAction_Type): ChatState => {
  switch (action.type) {
    case 'TOGGLE_CHAT':
      return { ...state, isOpen: !state.isOpen, hasNotifications: false };
    
    case 'OPEN_CHAT':
      return { ...state, isOpen: true, hasNotifications: false };
    
    case 'CLOSE_CHAT':
      return { ...state, isOpen: false };
    
    case 'ADD_MESSAGE':
      return { 
        ...state, 
        messages: [...state.messages, action.payload],
        hasNotifications: !state.isOpen && action.payload.role === 'assistant'
      };
    
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    
    case 'SET_NOTIFICATIONS':
      return { ...state, hasNotifications: action.payload };
    
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    
    case 'UPDATE_MESSAGE':
      return {
        ...state,
        messages: state.messages.map(msg => 
          msg.id === action.payload.id 
            ? { ...msg, ...action.payload.updates }
            : msg
        )
      };
    
    default:
      return state;
  }
};

// Context type
interface AIContextType {
  state: ChatState;
  config: AIAssistantConfig;
  callbacks: AIAssistantCallbacks;
  actions: {
    toggleChat: () => void;
    openChat: () => void;
    closeChat: () => void;
    sendMessage: (content: string) => Promise<void>;
    executeAction: (action: AIAction) => Promise<void>;
    clearMessages: () => void;
    setNotifications: (show: boolean) => void;
  };
}

// Create context
const AIContext = createContext<AIContextType | undefined>(undefined);

// Provider props
interface AIProviderProps {
  children: ReactNode;
  config: AIAssistantConfig;
  callbacks: AIAssistantCallbacks;
}

// Provider component
export const AIProvider: React.FC<AIProviderProps> = ({
  children,
  config,
  callbacks,
}) => {
  const [state, dispatch] = useReducer(aiReducer, initialState);

  // Generate unique message ID
  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Actions
  const actions = {
    toggleChat: () => dispatch({ type: 'TOGGLE_CHAT' }),
    
    openChat: () => dispatch({ type: 'OPEN_CHAT' }),
    
    closeChat: () => dispatch({ type: 'CLOSE_CHAT' }),
    
    clearMessages: () => dispatch({ type: 'CLEAR_MESSAGES' }),
    
    setNotifications: (show: boolean) => dispatch({ type: 'SET_NOTIFICATIONS', payload: show }),
    
    sendMessage: async (content: string) => {
      // Add user message
      const userMessage: Message = {
        id: generateMessageId(),
        content,
        role: 'user',
        timestamp: new Date(),
        status: 'sent',
      };
      
      dispatch({ type: 'ADD_MESSAGE', payload: userMessage });
      dispatch({ type: 'SET_TYPING', payload: true });
      
      try {
        // Get context for AI
        const userContext = callbacks.getCurrentUserContext?.();
        const screenContext = callbacks.getCurrentScreenContext?.();
        
        // Call AI service (will be implemented later)
        // const aiResponse = await AIService.sendMessage(content, userContext, screenContext);
        
        // For now, simulate AI response
        setTimeout(() => {
          const aiMessage: Message = {
            id: generateMessageId(),
            content: "I understand! I'm here to help you with your fitness program. What would you like me to assist you with?",
            role: 'assistant',
            timestamp: new Date(),
            status: 'sent',
          };
          
          dispatch({ type: 'ADD_MESSAGE', payload: aiMessage });
          dispatch({ type: 'SET_TYPING', payload: false });
        }, 1500);
        
        // Track interaction
        callbacks.onInteraction?.('message_sent', { content });
        
      } catch (error) {
        console.error('Failed to send message:', error);
        dispatch({ type: 'SET_TYPING', payload: false });
        
        // Update user message status
        dispatch({ 
          type: 'UPDATE_MESSAGE', 
          payload: { id: userMessage.id, updates: { status: 'error' } }
        });
      }
    },
    
    executeAction: async (action: AIAction) => {
      try {
        switch (action.type) {
          case 'modify_program':
            await callbacks.onModifyProgram?.(action.payload);
            break;
          case 'generate_program':
            await callbacks.onGenerateProgram?.(action.payload);
            break;
          case 'update_settings':
            await callbacks.onUpdateSettings?.(action.payload);
            break;
          case 'custom':
            await callbacks.onCustomAction?.(action);
            break;
        }
        
        // Track action execution
        callbacks.onInteraction?.('action_executed', { action: action.type });
        
      } catch (error) {
        console.error('Failed to execute action:', error);
        throw error;
      }
    },
  };

  const contextValue: AIContextType = {
    state,
    config,
    callbacks,
    actions,
  };

  return (
    <AIContext.Provider value={contextValue}>
      {children}
    </AIContext.Provider>
  );
};

// Hook to use AI context
export const useAIAssistant = () => {
  const context = useContext(AIContext);
  if (!context) {
    throw new Error('useAIAssistant must be used within an AIProvider');
  }
  return context;
};
