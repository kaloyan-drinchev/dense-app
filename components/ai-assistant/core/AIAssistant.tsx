import React from 'react';
import { View } from 'react-native';
import { AIProvider, useAIAssistant } from './AIProvider';
import { FloatingButton } from '../components/FloatingButton';
import { AIAssistantProps } from './types';

// Internal component that uses the context
const AIAssistantInternal: React.FC = () => {
  const { state, config, actions } = useAIAssistant();

  return (
    <>
      {/* Floating AI Button */}
      <FloatingButton
        onPress={actions.toggleChat}
        config={config.button}
        theme={config.theme}
        hasNotifications={state.hasNotifications}
        disabled={false}
      />

      {/* Chat Modal will be added in next step */}
      {/* {state.isOpen && (
        <ChatModal
          isVisible={state.isOpen}
          onClose={actions.closeChat}
          messages={state.messages}
          onSendMessage={actions.sendMessage}
          isTyping={state.isTyping}
          config={config}
        />
      )} */}
    </>
  );
};

// Main AI Assistant component
export const AIAssistant: React.FC<AIAssistantProps> = ({
  config,
  callbacks,
  children,
  disabled = false,
}) => {
  // Default configuration
  const defaultConfig = {
    theme: {
      primary: '#007AFF',
      secondary: '#FF3B30',
      background: '#000000',
      text: '#FFFFFF',
      border: '#333333',
    },
    button: {
      size: 56,
      position: {
        bottom: 100,
        right: 20,
      },
      icon: 'message-circle',
      showBadge: true,
    },
    chat: {
      maxHeight: 600,
      animationDuration: 300,
      placeholder: 'Ask me anything about your fitness...',
    },
    ai: {
      provider: 'openai' as const,
      model: 'gpt-4',
      maxTokens: 1000,
      temperature: 0.7,
    },
  };

  // Merge configurations
  const mergedConfig = {
    ...defaultConfig,
    ...config,
    theme: { ...defaultConfig.theme, ...config.theme },
    button: { ...defaultConfig.button, ...config.button },
    chat: { ...defaultConfig.chat, ...config.chat },
    ai: { ...defaultConfig.ai, ...config.ai },
  };

  if (disabled) {
    return <>{children}</>;
  }

  return (
    <AIProvider config={mergedConfig} callbacks={callbacks}>
      <View style={{ flex: 1 }}>
        {children}
        <AIAssistantInternal />
      </View>
    </AIProvider>
  );
};

// Export hook for external use
export { useAIAssistant } from './AIProvider';
