import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { userProfileService } from '@/db/services';

export default function StrengthStatsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [squatKg, setSquatKg] = useState('0');
  const [benchKg, setBenchKg] = useState('0');
  const [deadliftKg, setDeadliftKg] = useState('0');
  const [isSaving, setIsSaving] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // Load current stats
  React.useEffect(() => {
    const loadStats = async () => {
      if (!user?.id) return;

      try {
        const profiles = await userProfileService.getAll();
        const profile = profiles.find(p => p.id === user.id);
        
        if (profile) {
          setSquatKg(profile.squatKg?.toString() || '0');
          setBenchKg(profile.benchKg?.toString() || '0');
          setDeadliftKg(profile.deadliftKg?.toString() || '0');
        }
        setHasLoaded(true);
      } catch (error) {
        console.error('Failed to load strength stats:', error);
        setHasLoaded(true);
      }
    };

    loadStats();
  }, [user?.id]);

  const validateAndSave = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Validate inputs
    const squat = parseFloat(squatKg) || 0;
    const bench = parseFloat(benchKg) || 0;
    const deadlift = parseFloat(deadliftKg) || 0;

    if (squat > 400) {
      Alert.alert('Invalid Value', 'Squat exceeds the human limit allowed (Max: 400 kg)');
      return;
    }

    if (bench > 300) {
      Alert.alert('Invalid Value', 'Bench Press exceeds the human limit allowed (Max: 300 kg)');
      return;
    }

    if (deadlift > 400) {
      Alert.alert('Invalid Value', 'Deadlift exceeds the human limit allowed (Max: 400 kg)');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'No user found');
      return;
    }

    setIsSaving(true);

    try {
      // Get existing profile
      const profiles = await userProfileService.getAll();
      const existingProfile = profiles.find(p => p.id === user.id);

      if (!existingProfile) {
        Alert.alert('Error', 'Profile not found');
        setIsSaving(false);
        return;
      }

      // Update profile with strength stats
      await userProfileService.update(user.id, {
        ...existingProfile,
        squatKg: squat,
        benchKg: bench,
        deadliftKg: deadlift,
      });

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Alert.alert('Success', 'Strength stats updated successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to save strength stats:', error);
      Alert.alert('Error', `Failed to save: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const totalLifted = (parseFloat(squatKg) || 0) + (parseFloat(benchKg) || 0) + (parseFloat(deadliftKg) || 0);

  if (!hasLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Strength Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Strength Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>🏋️</Text>
          <Text style={styles.infoTitle}>Track Your Big 3 Lifts</Text>
          <Text style={styles.infoDescription}>
            Enter your 1-Rep Max (1RM) for Squat, Bench Press, and Deadlift. This will help us create a better training program for you.
          </Text>
        </View>

        <View style={styles.inputCard}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Squat 1RM (kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor={colors.lightGray}
              value={squatKg}
              onChangeText={(value) => {
                const filtered = value.replace(/[^0-9.]/g, '');
                setSquatKg(filtered);
              }}
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.inputHint}>Max: 400 kg</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Bench Press 1RM (kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor={colors.lightGray}
              value={benchKg}
              onChangeText={(value) => {
                const filtered = value.replace(/[^0-9.]/g, '');
                setBenchKg(filtered);
              }}
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.inputHint}>Max: 300 kg</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Deadlift 1RM (kg)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="0"
              placeholderTextColor={colors.lightGray}
              value={deadliftKg}
              onChangeText={(value) => {
                const filtered = value.replace(/[^0-9.]/g, '');
                setDeadliftKg(filtered);
              }}
              keyboardType="decimal-pad"
              maxLength={5}
            />
            <Text style={styles.inputHint}>Max: 400 kg</Text>
          </View>
        </View>

        {totalLifted > 0 && (
          <View style={styles.totalCard}>
            <Text style={styles.totalLabel}>Total Lifted</Text>
            <Text style={styles.totalValue}>{totalLifted.toFixed(1)} kg</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={validateAndSave}
          disabled={isSaving}
          activeOpacity={1}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.white,
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  infoCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    lineHeight: 22,
  },
  inputCard: {
    gap: 20,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    ...typography.large,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.darkGray,
  },
  inputHint: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 4,
  },
  totalCard: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    padding: 24,
    marginTop: 24,
    alignItems: 'center',
  },
  totalLabel: {
    ...typography.body,
    color: colors.black,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalValue: {
    ...typography.timerLarge,
    color: colors.black,
    fontWeight: 'bold',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 40,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    ...typography.h4,
    color: colors.black,
    fontWeight: 'bold',
  },
});
