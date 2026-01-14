import React from "react";
import { Text, StyleSheet } from "react-native";
import { colors } from "@/constants/colors";

// Internal styles for highlighting
const styles = StyleSheet.create({
  highlightedText: {
    color: colors.primary,
    fontWeight: "bold",
  },
});

// Helper function to randomly highlight 2 letters in a text part
const renderRandomHighlights = (
  text: string,
  partIndex: number,
  baseStyle: any
) => {
  // Get only letters (exclude spaces and punctuation)
  const letters = text
    .split("")
    .map((char, index) => ({ char, index }))
    .filter((item) => /[a-zA-Z]/.test(item.char));

  if (letters.length < 2) {
    return [
      <Text key={`${partIndex}-text`} style={baseStyle}>
        {text}
      </Text>,
    ];
  }

  // Randomly select 2 different letter positions
  const shuffled = [...letters].sort(() => Math.random() - 0.5);
  const highlightIndices = new Set([shuffled[0].index, shuffled[1].index]);

  // Render text with highlighted letters
  return text.split("").map((char, index) => {
    if (highlightIndices.has(index)) {
      return (
        <Text
          key={`${partIndex}-${index}`}
          style={[baseStyle, styles.highlightedText]}
        >
          {char}
        </Text>
      );
    }
    return (
      <Text key={`${partIndex}-${index}`} style={baseStyle}>
        {char}
      </Text>
    );
  });
};

// Helper function to render text with DENSE and random letters highlighted in green
export const renderTextWithHighlight = (text: string, baseStyle: any) => {
  const parts = text.split(/(DENSE|Lazarov)/g);

  return parts
    .map((part, index) => {
      if (part === "DENSE" || part === "Lazarov") {
        return (
          <Text key={index} style={[baseStyle, styles.highlightedText]}>
            {part}
          </Text>
        );
      } else if (part.length > 0) {
        return renderRandomHighlights(part, index, baseStyle);
      }
      return (
        <Text key={index} style={baseStyle}>
          {part}
        </Text>
      );
    })
    .flat();
};
