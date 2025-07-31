import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { colors } from '@/constants/colors';
import { useWorkoutStore } from '@/store/workout-store';
import { UserProfile } from '@/types/workout';
import { calculateBMI, getBMICategory } from '@/utils/helpers';
import { Feather as Icon, MaterialIcons as MaterialIcon } from '@expo/vector-icons';
import { SetupWizard } from './SetupWizard';
import { AuthScreen } from './AuthScreen';

export const ProfileSetup: React.FC<{
  onComplete: () => void;
}> = ({ onComplete }) => {
  const { userProfile, updateUserProfile } = useWorkoutStore();
  const [profile, setProfile] = useState<UserProfile>(
    userProfile || {
      name: '',
      weight: 0,
      height: 0,
      age: 0,
      goal: 'maintenance',
      fitnessLevel: 'beginner',
    }
  );
  const [showWizard, setShowWizard] = useState(false);
  const [showTestAuth, setShowTestAuth] = useState(false);

  const handleChange = (field: keyof UserProfile, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    updateUserProfile(profile);
    onComplete();
  };

  const isValid = () => {
    return (
      profile.name.trim() !== '' &&
      profile.weight > 0 &&
      profile.height > 0 &&
      profile.age > 0
    );
  };

  const bmi = calculateBMI(profile.weight, profile.height);
  const bmiCategory = getBMICategory(bmi);

  return (
    <>
      <ScrollView 
        style={styles.container}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
      >
      <Text style={styles.title}>Complete Your Profile</Text>
      <Text style={styles.subtitle}>
        This information helps us personalize your workout experience
      </Text>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Icon name="user" size={20} color={colors.lighterGray} />
          <Text style={styles.labelText}>Name</Text>
        </View>
        <TextInput
          style={styles.input}
          value={profile.name}
          onChangeText={(text) => handleChange('name', text)}
          placeholder="Enter your name"
          placeholderTextColor={colors.lightGray}
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <MaterialIcon
            name="fitness-center"
            size={20}
            color={colors.lighterGray}
          />
          <Text style={styles.labelText}>Weight (kg)</Text>
        </View>
        <TextInput
          style={styles.input}
          value={profile.weight ? profile.weight.toString() : ''}
          onChangeText={(text) => handleChange('weight', parseFloat(text) || 0)}
          placeholder="Enter your weight"
          placeholderTextColor={colors.lightGray}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <MaterialIcon name="height" size={20} color={colors.lighterGray} />
          <Text style={styles.labelText}>Height (cm)</Text>
        </View>
        <TextInput
          style={styles.input}
          value={profile.height ? profile.height.toString() : ''}
          onChangeText={(text) => handleChange('height', parseFloat(text) || 0)}
          placeholder="Enter your height"
          placeholderTextColor={colors.lightGray}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Icon name="calendar" size={20} color={colors.lighterGray} />
          <Text style={styles.labelText}>Age</Text>
        </View>
        <TextInput
          style={styles.input}
          value={profile.age ? profile.age.toString() : ''}
          onChangeText={(text) => handleChange('age', parseInt(text) || 0)}
          placeholder="Enter your age"
          placeholderTextColor={colors.lightGray}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Icon name="target" size={20} color={colors.lighterGray} />
          <Text style={styles.labelText}>Fitness Goal</Text>
        </View>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              profile.goal === 'bulking' && styles.selectedOption,
            ]}
            onPress={() => handleChange('goal', 'bulking')}
          >
            <Text
              style={[
                styles.optionText,
                profile.goal === 'bulking' && styles.selectedOptionText,
              ]}
            >
              Bulk Up
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              profile.goal === 'maintenance' && styles.selectedOption,
            ]}
            onPress={() => handleChange('goal', 'maintenance')}
          >
            <Text
              style={[
                styles.optionText,
                profile.goal === 'maintenance' && styles.selectedOptionText,
              ]}
            >
              Maintain
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              profile.goal === 'cutting' && styles.selectedOption,
            ]}
            onPress={() => handleChange('goal', 'cutting')}
          >
            <Text
              style={[
                styles.optionText,
                profile.goal === 'cutting' && styles.selectedOptionText,
              ]}
            >
              Cut Fat
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.inputGroup}>
        <View style={styles.inputLabel}>
          <Dumbbell size={20} color={colors.lighterGray} />
          <Text style={styles.labelText}>Fitness Level</Text>
        </View>
        <View style={styles.optionsContainer}>
          <TouchableOpacity
            style={[
              styles.optionButton,
              profile.fitnessLevel === 'beginner' && styles.selectedOption,
            ]}
            onPress={() => handleChange('fitnessLevel', 'beginner')}
          >
            <Text
              style={[
                styles.optionText,
                profile.fitnessLevel === 'beginner' &&
                  styles.selectedOptionText,
              ]}
            >
              Beginner
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              profile.fitnessLevel === 'intermediate' && styles.selectedOption,
            ]}
            onPress={() => handleChange('fitnessLevel', 'intermediate')}
          >
            <Text
              style={[
                styles.optionText,
                profile.fitnessLevel === 'intermediate' &&
                  styles.selectedOptionText,
              ]}
            >
              Intermediate
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.optionButton,
              profile.fitnessLevel === 'advanced' && styles.selectedOption,
            ]}
            onPress={() => handleChange('fitnessLevel', 'advanced')}
          >
            <Text
              style={[
                styles.optionText,
                profile.fitnessLevel === 'advanced' &&
                  styles.selectedOptionText,
              ]}
            >
              Advanced
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {bmi > 0 && (
        <View style={styles.bmiContainer}>
          <Text style={styles.bmiTitle}>Your BMI: {bmi.toFixed(1)}</Text>
          <Text style={styles.bmiCategory}>{bmiCategory}</Text>
          <View
            style={[
              styles.bmiIndicator,
              {
                backgroundColor:
                  bmiCategory === 'Underweight'
                    ? colors.warning
                    : bmiCategory === 'Normal'
                    ? colors.success
                    : bmiCategory === 'Overweight'
                    ? colors.warning
                    : colors.error,
              },
            ]}
          />
        </View>
      )}

      <TouchableOpacity
        style={[styles.saveButton, !isValid() && styles.disabledButton]}
        onPress={handleSave}
        disabled={!isValid()}
      >
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.wizardButton}
        onPress={() => setShowWizard(true)}
      >
        <Icon name="settings" size={20} color={colors.secondary} />
        <Text style={styles.wizardButtonText}>Go to Wizard</Text>
        <Icon name="chevron-right" size={20} color={colors.secondary} />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => setShowTestAuth(true)}
      >
        <Icon name="zap" size={20} color={colors.warning} />
        <Text style={styles.testButtonText}>Test Auth Screen</Text>
        <Icon name="chevron-right" size={20} color={colors.warning} />
      </TouchableOpacity>
    </ScrollView>
    
      <SetupWizard
        visible={showWizard}
        onClose={() => setShowWizard(false)}
        onComplete={() => {
          setShowWizard(false);
          // You can add additional logic here if needed
        }}
      />
      
      <AuthScreen
        visible={showTestAuth}
        onClose={() => setShowTestAuth(false)}
        onComplete={() => {
          setShowTestAuth(false);
          // Test complete - just close
        }}
      />
    </>
  );
};

const Dumbbell = ({ size, color }: { size: number; color: string }) => (
  <View
    style={{
      width: size,
      height: size,
      justifyContent: 'center',
      alignItems: 'center',
    }}
  >
    <Text style={{ color, fontSize: size * 0.8, fontWeight: 'bold' }}>💪</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.dark,
    paddingHorizontal: 16,  // Only left/right padding
    paddingTop: 8,          // Minimal top padding
    paddingBottom: 16,      // Bottom padding
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    marginLeft: 8,
  },
  input: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.white,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionButton: {
    flex: 1,
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  selectedOption: {
    backgroundColor: colors.primary,
  },
  optionText: {
    fontSize: 14,
    color: colors.lighterGray,
  },
  selectedOptionText: {
    color: colors.white,
    fontWeight: 'bold',
  },
  bmiContainer: {
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
  },
  bmiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.white,
    marginBottom: 4,
  },
  bmiCategory: {
    fontSize: 16,
    color: colors.lighterGray,
    marginBottom: 12,
  },
  bmiIndicator: {
    width: '80%',
    height: 8,
    borderRadius: 4,
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  disabledButton: {
    backgroundColor: colors.mediumGray,
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  wizardButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.secondary,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  wizardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.secondary,
  },
  testButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.warning,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.warning,
  },
});
