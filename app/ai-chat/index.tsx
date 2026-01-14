import React from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Feather as Icon } from "@expo/vector-icons";
import { colors } from "@/constants/colors";
import { Message } from "@/components/ai-assistant/core/types";

import { styles } from "./styles";
import { useAIChatLogic } from "./logic";

// Sub-component for rendering individual messages
const MessageBubble = ({
  message,
  onLongPress,
}: {
  message: Message;
  onLongPress: (text: string) => void;
}) => (
  <TouchableOpacity
    onLongPress={() => onLongPress(message.content)}
    activeOpacity={0.8}
    delayLongPress={500}
  >
    <View
      style={[
        styles.messageBubble,
        message.role === "user" ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          message.role === "user" ? styles.userText : styles.aiText,
        ]}
        selectable={true}
      >
        {message.content}
      </Text>
    </View>
  </TouchableOpacity>
);

export default function AIChatScreen() {
  const {
    messages,
    isTyping,
    inputText,
    setInputText,
    scrollViewRef,
    sendMessage,
    copyToClipboard,
    handleBack,
  } = useAIChatLogic();

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
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
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
            <MessageBubble
              key={message.id}
              message={message}
              onLongPress={copyToClipboard}
            />
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <View
              style={[
                styles.messageBubble,
                styles.aiBubble,
                styles.typingBubble,
              ]}
            >
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
                { opacity: inputText.trim() ? 1 : 0.5 },
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
