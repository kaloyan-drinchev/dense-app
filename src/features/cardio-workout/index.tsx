import React from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import { Feather as Icon } from "@expo/vector-icons";
import Slider from "react-native-sliders";
import { colors } from "@/constants/colors";

import { styles } from "./styles";
import { useCardioWorkoutLogic } from "./logic";

export default function CardioWorkoutScreen() {
  const {
    selectedType,
    setSelectedType,
    targetMinutes,
    setTargetMinutes,
    starting,
    handleStartSession,
    handleBack,
    CARDIO_TYPES,
    getCardioIcon,
  } = useCardioWorkoutLogic();

  return (
    <LinearGradient
      colors={[colors.dark, colors.darkGray]}
      style={styles.container}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title with Back Button */}
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.pageTitle}>Start Cardio Session</Text>
          </View>

          {/* Cardio Type Selection */}
          <View style={styles.section}>
            <View style={styles.cardioTypesGrid}>
              {CARDIO_TYPES.map((cardio) => {
                const isSelected = selectedType === cardio.id;
                const iconName = getCardioIcon(cardio.id);

                return (
                  <TouchableOpacity
                    key={cardio.id}
                    style={[
                      styles.cardioTypeCard,
                      isSelected && styles.cardioTypeCardSelected,
                    ]}
                    onPress={() => setSelectedType(cardio.id)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.cardioIconContainer,
                        isSelected && styles.cardioIconContainerSelected,
                      ]}
                    >
                      <Icon
                        name={iconName as any}
                        size={20}
                        color={isSelected ? colors.black : colors.primary}
                      />
                    </View>
                    <Text
                      style={[
                        styles.cardioTypeText,
                        isSelected && styles.cardioTypeTextSelected,
                      ]}
                      numberOfLines={2}
                    >
                      {cardio.name}
                    </Text>
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Icon name="check" size={12} color={colors.black} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Target Duration */}
          <View style={styles.section}>
            <View style={styles.durationHeader}>
              <Text style={styles.sectionLabel}>Target Duration</Text>
              <Text style={styles.durationValue}>{targetMinutes} min</Text>
            </View>
            <Text style={styles.sectionSubtitle}>Slide to set your goal</Text>

            {/* Duration Slider */}
            <View style={styles.sliderContainer}>
              <Slider
                value={targetMinutes}
                onValueChange={(value) => setTargetMinutes(Math.round(value))}
                minimumValue={5}
                maximumValue={180}
                step={5}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.mediumGray}
                thumbTintColor={colors.primary}
                trackStyle={styles.sliderTrack}
                thumbStyle={styles.sliderThumb}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabelText}>5 min</Text>
                <Text style={styles.sliderLabelText}>180 min</Text>
              </View>
            </View>

            {/* Info Message */}
            <View style={styles.infoBox}>
              <Icon name="clock" size={20} color={colors.primary} />
              <Text style={styles.infoText}>
                A countdown timer will show your progress. You can finish early
                or continue past your goal!
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Start Session Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              (starting || !selectedType) && styles.saveButtonDisabled,
            ]}
            onPress={handleStartSession}
            disabled={starting || !selectedType}
            activeOpacity={0.7}
          >
            {starting ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <>
                <Icon name="play" size={20} color={colors.black} />
                <Text style={styles.saveButtonText}>Start Cardio Session</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}
