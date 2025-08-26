import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { geminiAI } from '@/services/gemini-ai';
import { useChatStore } from '@/store/chat-store';
import { Message } from '@/components/ai-assistant/core/types';

const { height: screenHeight } = Dimensions.get('window');



export default function AIChatScreen() {
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
      // Simple alert for now - can be replaced with toast later
      Alert.alert('✅ Copied!', 'Message copied to clipboard', [{ text: 'OK' }]);
    } catch (error) {
      console.error('Failed to copy text:', error);
      Alert.alert('❌ Error', 'Failed to copy message', [{ text: 'OK' }]);
    }
  };

  const MessageBubble = ({ message }: { message: Message }) => (
    <TouchableOpacity
      onLongPress={() => copyToClipboard(message.content)}
      activeOpacity={0.8}
      delayLongPress={500}
    >
      <View style={[
        styles.messageBubble,
        message.role === 'user' ? styles.userBubble : styles.aiBubble
      ]}>
        <Text 
          style={[
            styles.messageText,
            message.role === 'user' ? styles.userText : styles.aiText
          ]}
          selectable={true}
        >
          {message.content}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Icon name="activity" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>AI Fitness Assistant</Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Messages */}
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          
          {/* Typing indicator */}
          {isTyping && (
            <View style={[styles.messageBubble, styles.aiBubble, styles.typingBubble]}>
              <Text style={styles.typingText}>AI is typing...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.textInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about your fitness..."
              placeholderTextColor={colors.lightGray}
              multiline
              maxLength={500}
              blurOnSubmit={false}
            />
            <TouchableOpacity 
              onPress={sendMessage}
              style={[
                styles.sendButton,
                { opacity: inputText.trim() ? 1 : 0.5 }
              ]}
              disabled={!inputText.trim()}
            >
              <Icon name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  headerSpacer: {
    width: 40, // Same width as backButton to center the title
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  messageBubble: {
    maxWidth: '80%',
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primary,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.darkGray,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: colors.black,
  },
  aiText: {
    color: colors.white,
  },
  typingBubble: {
    opacity: 0.7,
  },
  typingText: {
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
    padding: 16,
    backgroundColor: colors.dark,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: colors.darkGray,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.white,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
