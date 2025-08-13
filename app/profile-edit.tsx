import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutStore } from '@/store/workout-store';

interface ProfileData {
  // Basic Personal Details
  name: string;
  email: string;
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
  
  // Physical Measurements
  height: string; // cm
  currentWeight: string; // kg
  targetWeight: string; // kg
  bodyFat: string; // percentage
  
  // Fitness Profile
  experienceLevel: 'beginner' | 'intermediate' | 'advanced' | '';
  fitnessGoals: string[];
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very_active' | '';
  workoutFrequency: string; // days per week
  preferredWorkoutTypes: string[];
  
  // DENSE-Specific
  trainingDaysPerWeek: string;
  musclePriorities: string[];
  equipmentAccess: 'full_gym' | 'home_gym' | 'bodyweight' | '';
  workoutDuration: '30-45' | '45-60' | '60+' | '';
  
  // App Preferences
  units: 'metric' | 'imperial';
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
}

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { userProfile } = useWorkoutStore();

  const [profile, setProfile] = useState<ProfileData>({
    name: user?.name || userProfile?.name || '',
    email: user?.email || '',
    dateOfBirth: userProfile?.dateOfBirth || '',
    gender: userProfile?.gender || '',
    height: userProfile?.height?.toString() || '',
    currentWeight: userProfile?.weight?.toString() || '',
    targetWeight: userProfile?.targetWeight?.toString() || '',
    bodyFat: userProfile?.bodyFat?.toString() || '',
    experienceLevel: userProfile?.experienceLevel || '',
    fitnessGoals: userProfile?.fitnessGoals ? [userProfile.fitnessGoals] : [],
    activityLevel: userProfile?.activityLevel || '',
    workoutFrequency: userProfile?.availableDays?.toString() || '',
    preferredWorkoutTypes: [],
    trainingDaysPerWeek: userProfile?.availableDays?.toString() || '6',
    musclePriorities: [],
    equipmentAccess: '',
    workoutDuration: '',
    units: 'metric',
    notifications: true,
    theme: 'dark',
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you would save to your database
      // For now, we'll just show a success message
      Alert.alert('Success', 'Profile updated successfully!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const updateProfile = (field: keyof ProfileData, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const toggleGoal = (goal: string) => {
    setProfile(prev => ({
      ...prev,
      fitnessGoals: prev.fitnessGoals.includes(goal)
        ? prev.fitnessGoals.filter(g => g !== goal)
        : [...prev.fitnessGoals, goal]
    }));
  };

  const toggleWorkoutType = (type: string) => {
    setProfile(prev => ({
      ...prev,
      preferredWorkoutTypes: prev.preferredWorkoutTypes.includes(type)
        ? prev.preferredWorkoutTypes.filter(t => t !== type)
        : [...prev.preferredWorkoutTypes, type]
    }));
  };

  const toggleMusclePriority = (muscle: string) => {
    setProfile(prev => ({
      ...prev,
      musclePriorities: prev.musclePriorities.includes(muscle)
        ? prev.musclePriorities.filter(m => m !== muscle)
        : [...prev.musclePriorities, muscle].slice(0, 3) // Max 3 priorities
    }));
  };

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const renderInput = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder?: string,
    keyboardType?: any
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.lightGray}
        keyboardType={keyboardType}
      />
    </View>
  );

  const renderPicker = (
    label: string,
    options: { label: string; value: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.pickerContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.pickerOption,
              selectedValue === option.value && styles.pickerOptionSelected
            ]}
            onPress={() => onSelect(option.value)}
          >
            <Text style={[
              styles.pickerOptionText,
              selectedValue === option.value && styles.pickerOptionTextSelected
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderMultiSelect = (
    label: string,
    options: string[],
    selectedValues: string[],
    onToggle: (value: string) => void,
    maxSelections?: number
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label} {maxSelections && `(max ${maxSelections})`}
      </Text>
      <View style={styles.multiSelectContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.multiSelectOption,
              selectedValues.includes(option) && styles.multiSelectOptionSelected
            ]}
            onPress={() => onToggle(option)}
          >
            <Text style={[
              styles.multiSelectOptionText,
              selectedValues.includes(option) && styles.multiSelectOptionTextSelected
            ]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Icon name="arrow-left" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Basic Personal Details */}
        {renderSection('Personal Information', (
          <>
            {renderInput('Full Name', profile.name, (text) => updateProfile('name', text), 'Enter your full name')}
            {renderInput('Email', profile.email, (text) => updateProfile('email', text), 'your@email.com')}
            {renderInput('Date of Birth', profile.dateOfBirth, (text) => updateProfile('dateOfBirth', text), 'YYYY-MM-DD')}
            {renderPicker('Gender', [
              { label: 'Male', value: 'male' },
              { label: 'Female', value: 'female' },
              { label: 'Other', value: 'other' },
            ], profile.gender, (value) => updateProfile('gender', value))}
          </>
        ))}

        {/* Physical Measurements */}
        {renderSection('Physical Measurements', (
          <>
            {renderInput('Height (cm)', profile.height, (text) => updateProfile('height', text), '175', 'numeric')}
            {renderInput('Current Weight (kg)', profile.currentWeight, (text) => updateProfile('currentWeight', text), '70', 'numeric')}
            {renderInput('Target Weight (kg)', profile.targetWeight, (text) => updateProfile('targetWeight', text), '68', 'numeric')}
            {renderInput('Body Fat % (optional)', profile.bodyFat, (text) => updateProfile('bodyFat', text), '15', 'numeric')}
          </>
        ))}

        {/* Fitness Profile */}
        {renderSection('Fitness Profile', (
          <>
            {renderPicker('Experience Level', [
              { label: 'Beginner', value: 'beginner' },
              { label: 'Intermediate', value: 'intermediate' },
              { label: 'Advanced', value: 'advanced' },
            ], profile.experienceLevel, (value) => updateProfile('experienceLevel', value))}

            {renderMultiSelect('Fitness Goals', [
              'Weight Loss', 'Muscle Gain', 'Strength', 'Endurance', 'General Fitness', 'Athletic Performance'
            ], profile.fitnessGoals, toggleGoal)}

            {renderPicker('Activity Level', [
              { label: 'Sedentary', value: 'sedentary' },
              { label: 'Lightly Active', value: 'light' },
              { label: 'Moderately Active', value: 'moderate' },
              { label: 'Very Active', value: 'very_active' },
            ], profile.activityLevel, (value) => updateProfile('activityLevel', value))}

            {renderMultiSelect('Preferred Workout Types', [
              'Strength Training', 'Cardio', 'HIIT', 'Yoga', 'Pilates', 'CrossFit', 'Bodyweight'
            ], profile.preferredWorkoutTypes, toggleWorkoutType)}
          </>
        ))}

        {/* DENSE-Specific Settings */}
        {renderSection('DENSE Training Settings', (
          <>
            {renderInput('Training Days Per Week', profile.trainingDaysPerWeek, (text) => updateProfile('trainingDaysPerWeek', text), '6', 'numeric')}
            
            {renderMultiSelect('Muscle Priorities', [
              'Chest', 'Shoulders', 'Arms', 'Back', 'Legs', 'Glutes', 'Core'
            ], profile.musclePriorities, toggleMusclePriority, 3)}

            {renderPicker('Equipment Access', [
              { label: 'Full Gym', value: 'full_gym' },
              { label: 'Home Gym', value: 'home_gym' },
              { label: 'Bodyweight Only', value: 'bodyweight' },
            ], profile.equipmentAccess, (value) => updateProfile('equipmentAccess', value))}

            {renderPicker('Preferred Workout Duration', [
              { label: '30-45 minutes', value: '30-45' },
              { label: '45-60 minutes', value: '45-60' },
              { label: '60+ minutes', value: '60+' },
            ], profile.workoutDuration, (value) => updateProfile('workoutDuration', value))}
          </>
        ))}

        {/* App Preferences */}
        {renderSection('App Preferences', (
          <>
            {renderPicker('Units', [
              { label: 'Metric (kg, cm)', value: 'metric' },
              { label: 'Imperial (lbs, ft)', value: 'imperial' },
            ], profile.units, (value) => updateProfile('units', value))}

            <View style={styles.switchRow}>
              <Text style={styles.label}>Push Notifications</Text>
              <Switch
                value={profile.notifications}
                onValueChange={(value) => updateProfile('notifications', value)}
                trackColor={{ false: colors.mediumGray, true: colors.primaryLight }}
                thumbColor={profile.notifications ? colors.primary : colors.lightGray}
              />
            </View>

            {renderPicker('Theme', [
              { label: 'Light', value: 'light' },
              { label: 'Dark', value: 'dark' },
              { label: 'Auto', value: 'auto' },
            ], profile.theme, (value) => updateProfile('theme', value))}
          </>
        ))}

        <View style={styles.bottomPadding} />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  saveButtonDisabled: {
    color: colors.lightGray,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.white,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.white,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  pickerOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerOptionText: {
    fontSize: 14,
    color: colors.white,
  },
  pickerOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  multiSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  multiSelectOption: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  multiSelectOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  multiSelectOptionText: {
    fontSize: 12,
    color: colors.white,
  },
  multiSelectOptionTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bottomPadding: {
    height: 40,
  },
});
