import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, Stack } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProgressService, wizardResultsService } from '@/db/services';
import { CARDIO_TYPES, calculateCardioCalories } from '@/utils/cardio-calories';

export default function CardioWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  
  // Form state
  const [selectedType, setSelectedType] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<string>('');
  const [useCustomCalories, setUseCustomCalories] = useState(false);
  const [notes, setNotes] = useState<string>('');
  
  // User data
  const [userWeight, setUserWeight] = useState<number>(70);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadUserData = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }
      
      try {
        const wizardResults = await wizardResultsService.getByUserId(user.id);
        if (wizardResults?.weight) {
          setUserWeight(wizardResults.weight);
        }
      } catch (error) {
        console.error('❌ Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [user?.id]);

  const handleSave = async () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Required', 'Please select a cardio type');
      return;
    }

    const hoursNum = hours ? parseFloat(hours) : 0;
    const minutesNum = minutes ? parseFloat(minutes) : 0;
    
    if (hoursNum < 0 || minutesNum < 0 || minutesNum >= 60) {
      Alert.alert('Invalid Duration', 'Please enter valid hours (0-23) and minutes (0-59)');
      return;
    }
    
    if (hoursNum === 0 && minutesNum === 0) {
      Alert.alert('Required', 'Please enter a duration (hours and/or minutes)');
      return;
    }
    
    const totalMinutes = hoursNum * 60 + minutesNum;
    
    if (totalMinutes > 300) {
      Alert.alert('Invalid Duration', 'Duration cannot exceed 300 minutes (5 hours)');
      return;
    }

    let calories: number;
    if (useCustomCalories && customCalories) {
      const customCal = parseFloat(customCalories);
      if (isNaN(customCal) || customCal < 0) {
        Alert.alert('Invalid Calories', 'Please enter a valid number of calories');
        return;
      }
      if (customCal > 5000) {
        Alert.alert('Invalid Calories', 'Calories cannot exceed 5000');
        return;
      }
      calories = Math.round(customCal);
    } else {
      calories = calculateCardioCalories(selectedType, totalMinutes, userWeight);
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setSaving(true);
    
    try {
      const cardioType = CARDIO_TYPES.find(c => c.id === selectedType);
      const today = new Date().toISOString().split('T')[0];
      
      // Get current progress
      const progress = await userProgressService.getByUserId(user.id);
      if (!progress) {
        Alert.alert('Error', 'Could not load user progress');
        return;
      }

      // Parse weeklyWeights
      const weeklyWeights = typeof progress.weeklyWeights === 'string'
        ? JSON.parse(progress.weeklyWeights)
        : progress.weeklyWeights || {};
      
      // Add cardio entry to today's date
      if (!weeklyWeights.cardioEntries) {
        weeklyWeights.cardioEntries = {};
      }
      
      if (!weeklyWeights.cardioEntries[today]) {
        weeklyWeights.cardioEntries[today] = [];
      }
      
      weeklyWeights.cardioEntries[today].push({
        id: `cardio-${Date.now()}`,
        type: selectedType,
        typeName: cardioType?.name || 'Cardio',
        durationMinutes: totalMinutes,
        hours: hoursNum,
        minutes: minutesNum,
        calories: calories,
        notes: notes.trim() || undefined,
        timestamp: new Date().toISOString(),
      });

      // Update progress
      await userProgressService.update(progress.id, {
        weeklyWeights: weeklyWeights,
      });

      Alert.alert(
        'Success!',
        `Cardio session logged: ${cardioType?.name} for ${totalMinutes} minutes (${calories} calories)`,
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('❌ Error saving cardio:', error);
      Alert.alert('Error', 'Failed to save cardio session');
    } finally {
      setSaving(false);
    }
  };

  const hoursNum = hours ? parseFloat(hours) : 0;
  const minutesNum = minutes ? parseFloat(minutes) : 0;
  const totalMinutes = hoursNum * 60 + minutesNum;
  const calculatedCalories = selectedType && totalMinutes > 0
    ? calculateCardioCalories(selectedType, totalMinutes, userWeight)
    : 0;

  if (loading) {
    return (
      <LinearGradient colors={[colors.dark, colors.darkGray]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
            <Text style={styles.pageTitle}>Log Cardio Session</Text>
          </View>
          
          {/* Cardio Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Cardio Type *</Text>
            <View style={styles.cardioTypesGrid}>
              {CARDIO_TYPES.map((cardio) => (
                <TouchableOpacity
                  key={cardio.id}
                  style={[
                    styles.cardioTypeButton,
                    selectedType === cardio.id && styles.cardioTypeButtonSelected,
                  ]}
                  onPress={() => setSelectedType(cardio.id)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.cardioTypeText,
                      selectedType === cardio.id && styles.cardioTypeTextSelected,
                    ]}
                  >
                    {cardio.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Input */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Duration *</Text>
            <View style={styles.durationContainer}>
              <View style={styles.durationInputContainer}>
                <TextInput
                  style={styles.durationInput}
                  value={hours}
                  onChangeText={setHours}
                  placeholder="0"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.durationLabel}>hours</Text>
              </View>
              <View style={styles.durationInputContainer}>
                <TextInput
                  style={styles.durationInput}
                  value={minutes}
                  onChangeText={setMinutes}
                  placeholder="0"
                  placeholderTextColor={colors.lightGray}
                  keyboardType="numeric"
                  maxLength={2}
                />
                <Text style={styles.durationLabel}>minutes</Text>
              </View>
            </View>
            {(hours || minutes) && totalMinutes > 0 && (
              <Text style={styles.hintText}>
                Total: {totalMinutes} minutes ({Math.round(totalMinutes / 60 * 10) / 10} hours)
              </Text>
            )}
          </View>

          {/* Calories Toggle */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.toggleRow}
              onPress={() => setUseCustomCalories(!useCustomCalories)}
              activeOpacity={0.7}
            >
              <View style={styles.checkboxContainer}>
                <View style={[styles.checkbox, useCustomCalories && styles.checkboxChecked]}>
                  {useCustomCalories && (
                    <Icon name="check" size={16} color={colors.black} />
                  )}
                </View>
                <Text style={styles.toggleLabel}>Enter calories manually</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Custom Calories Input */}
          {useCustomCalories && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Calories Burned</Text>
              <TextInput
                style={styles.input}
                value={customCalories}
                onChangeText={setCustomCalories}
                placeholder="e.g., 300"
                placeholderTextColor={colors.lightGray}
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          )}

          {/* Estimated Calories Display */}
          {!useCustomCalories && selectedType && totalMinutes > 0 && calculatedCalories > 0 && (
            <View style={styles.estimatedCaloriesBox}>
              <Icon name="zap" size={20} color={colors.primary} />
              <View style={styles.estimatedCaloriesContent}>
                <Text style={styles.estimatedCaloriesLabel}>Estimated Calories</Text>
                <Text style={styles.estimatedCaloriesValue}>~{calculatedCalories} cal</Text>
              </View>
            </View>
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes about your cardio session..."
              placeholderTextColor={colors.lightGray}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={colors.black} />
            ) : (
              <>
                <Icon name="check" size={20} color={colors.black} />
                <Text style={styles.saveButtonText}>Save Cardio Session</Text>
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
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardioTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cardioTypeButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: colors.mediumGray,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardioTypeButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cardioTypeText: {
    ...typography.body,
    color: colors.white,
    fontSize: 14,
  },
  cardioTypeTextSelected: {
    color: colors.black,
    fontWeight: '600',
  },
  input: {
    ...typography.body,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 14,
    color: colors.white,
    fontSize: 16,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 14,
  },
  durationContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  durationInputContainer: {
    flex: 1,
  },
  durationInput: {
    ...typography.body,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    padding: 14,
    color: colors.white,
    fontSize: 16,
    textAlign: 'center',
  },
  durationLabel: {
    ...typography.caption,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 6,
  },
  hintText: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 6,
  },
  toggleRow: {
    marginTop: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.darkGray,
    justifyContent: 'center',
    alignItems: 'center',
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

