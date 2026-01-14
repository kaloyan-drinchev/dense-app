import { useState, useRef, useEffect } from 'react';
import { ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { geminiAI } from '@/services/gemini-ai';
import { useChatStore } from '@/store/chat-store';
import { Message } from '@/components/ai-assistant/core/types';

export const useAIChatLogic = () => {
  const router = useRouter();
  const { messages, isTyping, addMessage, setTyping } = useChatStore();
  const [inputText, setInputText] = useState('');
  
  const scrollViewRef = useRef<ScrollView>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleBack = () => router.back();

  const sendMessage = async () => {
    if (!inputText.trim()) return;

    const userMessageText = inputText.trim();
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      content: userMessageText,
      role: 'user',
      timestamp: new Date(),
    };

    addMessage(userMessage);
    setInputText('');
    setTyping(true);

    try {
      // Get AI response from Gemini
      const aiResponse = await geminiAI.sendMessage(userMessageText, messages);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: aiResponse.message,
        role: 'assistant',
        timestamp: new Date(),
        actions: aiResponse.actions,
      };
      
      addMessage(aiMessage);
      
      // Log and process actions
      if (aiResponse.actions && aiResponse.actions.length > 0) {
        console.log('🤖 AI suggested actions:', aiResponse.actions);
        
        // Add action results to the AI message
        const actionResults = aiResponse.actions
          .filter(action => action.executed && action.result)
          .map(action => action.result?.message)
          .filter(Boolean);
          
        if (actionResults.length > 0) {
          const actionSummary = `\n\n✅ Actions completed:\n${actionResults.map(msg => `• ${msg}`).join('\n')}`;
          aiMessage.content += actionSummary;
        }
      }
      
    } catch (error) {
      console.error('Failed to get AI response:', error);
      
      // Fallback message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "I apologize, but I'm having trouble responding right now. Please try again!",
        role: 'assistant',
        timestamp: new Date(),
      };
      
      addMessage(errorMessage);
    } finally {
      setTyping(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await Clipboard.setStringAsync(text);
      Alert.alert('✅ Copied!', 'Message copied to clipboard', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Failed to copy text:', error);
      Alert.alert('❌ Error', 'Failed to copy message', [{ text: 'OK' }]);
    }
  };

  return {
    messages,
    isTyping,
    inputText,
    setInputText,
    scrollViewRef,
    sendMessage,
    copyToClipboard,
    handleBack,
  };
};