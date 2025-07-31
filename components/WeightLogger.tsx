import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '@/store/workout-store';
import Icon from 'react-native-vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export const WeightLogger: React.FC = () => {
  const { userProfile, logWeight } = useWorkoutStore();
  const [weight, setWeight] = useState(userProfile?.weight?.toString() || '');
  const [isSaved, setIsSaved] = useState(false);

  const handleWeightChange = (text: string) => {
    setWeight(text);
    setIsSaved(false);
  };

  const adjustWeight = (amount: number) => {
    const currentWeight = parseFloat(weight) || 0;
    setWeight((currentWeight + amount).toFixed(1));
    setIsSaved(false);

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleSave = () => {
    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue <= 0) return;

    logWeight(weightValue);
    setIsSaved(true);

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log Today's Weight</Text>

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => adjustWeight(-0.1)}
        >
          <Icon name="minus" size={16} color={colors.white} />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          value={weight}
          onChangeText={handleWeightChange}
          keyboardType="numeric"
          placeholder="Enter weight"
          placeholderTextColor={colors.lightGray}
        />

        <Text style={styles.unit}>kg</Text>

        <TouchableOpacity
          style={styles.adjustButton}
          onPress={() => adjustWeight(0.1)}
        >
          <Icon name="plus" size={16} color={colors.white} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.saveButton, isSaved && styles.savedButton]}
        onPress={handleSave}
        disabled={isSaved}
      >
        <Icon name="save" size={16} color={colors.white} />
        <Text style={styles.saveButtonText}>
          {isSaved ? 'Saved for Today' : 'Save Weight'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  adjustButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.mediumGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: colors.mediumGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginHorizontal: 8,
    color: colors.white,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  unit: {
    fontSize: 16,
    color: colors.lightGray,
    marginRight: 8,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
    gap: 8,
  },
  savedButton: {
    backgroundColor: colors.success,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
