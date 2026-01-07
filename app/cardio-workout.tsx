import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import Slider from 'react-native-sliders';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { CARDIO_TYPES } from '@/utils/cardio-calories';

// Helper function to get icon for each cardio type
const getCardioIcon = (cardioId: string): string => {
  const iconMap: { [key: string]: string } = {
    'treadmill': 'activity',
    'bicycle': 'disc',
    'stair-master': 'trending-up',
    'rowing-machine': 'minus',
    'elliptical': 'refresh-cw',
    'jumping-rope': 'zap',
    'running-outdoor': 'wind',
    'walking': 'user',
    'swimming': 'droplet',
    'other': 'grid',
  };
  return iconMap[cardioId] || 'circle';
};

export default function CardioWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Form state
  const [selectedType, setSelectedType] = useState<string>('');
  const [targetMinutes, setTargetMinutes] = useState<number>(30);
  const [starting, setStarting] = useState(false);

  const handleStartSession = async () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Required', 'Please select a cardio type');
      return;
    }

    if (targetMinutes <= 0 || targetMinutes > 180) {
      Alert.alert('Invalid Duration', 'Please select a target duration between 1 and 180 minutes');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setStarting(true);

    try {
      const cardioType = CARDIO_TYPES.find(c => c.id === selectedType);
      
      // Create cardio workout structure compatible with workout-session
      // We'll create it as a single "exercise" that's just cardio
      const cardioWorkoutData = {
        id: 'cardio-workout',
        name: cardioType?.name || 'Cardio',
        type: 'cardio',
        category: 'cardio',
        estimatedDuration: targetMinutes, // User's target duration
        targetDuration: targetMinutes, // Store target for countdown
        cardioType: selectedType, // Store cardio type for later use
        exercises: [
          {
            id: `cardio-${selectedType}`,
            name: cardioType?.name || 'Cardio',
            targetMuscle: 'Cardio',
            sets: 1, // Single "set" representing the cardio session
            reps: '1', // Not used for cardio
            restTime: 0, // No rest for cardio
            notes: '',
            isCardio: true, // Flag to identify cardio exercises
          }
        ],
      };

      // Save workout data to cache store for workout-session to use
      const { setManualWorkout } = useWorkoutCacheStore.getState();
      setManualWorkout(cardioWorkoutData);

      // Navigate to workout session - use replace so back button works correctly
      // Note: Don't call setStarting(false) here as component will unmount after navigation
      router.replace('/workout-session');
    } catch (error) {
      console.error('❌ Error starting cardio session:', error);
      Alert.alert('Error', 'Failed to start cardio session');
      setStarting(false);
    }
  };

  return (
    <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Page Title with Back Button */}
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
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
                    <View style={[
                      styles.cardioIconContainer,
                      isSelected && styles.cardioIconContainerSelected,
                    ]}>
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
                A countdown timer will show your progress. You can finish early or continue past your goal!
              </Text>
            </View>
          </View>
        </ScrollView>

        {/* Start Session Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton, 
              (starting || !selectedType) && styles.saveButtonDisabled
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 0,
    paddingBottom: 32,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  pageTitle: {
    ...typography.h2,
    color: colors.white,
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    ...typography.body,
    color: colors.lightGray,
    fontSize: 14,
    marginBottom: 20,
  },
  cardioTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  cardioTypeCard: {
    width: '23.5%',
    aspectRatio: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 10,
    borderWidth: 2,
    borderColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
  },
  cardioTypeCardSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cardioIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardioIconContainerSelected: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  cardioTypeText: {
    ...typography.body,
    color: colors.white,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  cardioTypeTextSelected: {
    color: colors.black,
    fontWeight: '700',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  durationValue: {
    ...typography.h2,
    color: colors.primary,
    fontSize: 32,
    fontWeight: '700',
  },
  sliderContainer: {
    marginVertical: 20,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
  },
  sliderThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 5,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabelText: {
    ...typography.caption,
    color: colors.lightGray,
    fontSize: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  infoText: {
    ...typography.body,
    color: colors.lightGray,
    flex: 1,
    fontSize: 14,
  },
  checkboxChecked: {
    backgroundColor: colors.primary,
  },
  toggleLabel: {
    ...typography.body,
    color: colors.white,
  },
  estimatedCaloriesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  estimatedCaloriesContent: {
    flex: 1,
  },
  estimatedCaloriesLabel: {
    ...typography.caption,
    color: colors.lightGray,
    marginBottom: 4,
  },
  estimatedCaloriesValue: {
    ...typography.h4,
    color: colors.primary,
    fontWeight: '700',
  },
  footer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 0 : 16,
    borderTopWidth: 1,
    borderTopColor: colors.darkGray,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: '700',
  },
});

