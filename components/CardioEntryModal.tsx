import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { CARDIO_TYPES, calculateCardioCalories, type CardioType } from '@/utils/cardio-calories';

interface CardioEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (cardio: {
    id: string;
    type: string;
    typeName: string;
    durationMinutes: number;
    hours: number;
    minutes: number;
    calories: number;
  }) => void;
  userWeight?: number;
}

export const CardioEntryModal: React.FC<CardioEntryModalProps> = ({
  visible,
  onClose,
  onSave,
  userWeight = 70,
}) => {
  const [selectedType, setSelectedType] = useState<string>('');
  const [hours, setHours] = useState<string>('');
  const [minutes, setMinutes] = useState<string>('');
  const [customCalories, setCustomCalories] = useState<string>('');
  const [useCustomCalories, setUseCustomCalories] = useState(false);

  const handleClose = () => {
    setSelectedType('');
    setHours('');
    setMinutes('');
    setCustomCalories('');
    setUseCustomCalories(false);
    onClose();
  };

  const handleSave = () => {
    // Validation
    if (!selectedType) {
      Alert.alert('Required', 'Please select a cardio type');
      return;
    }

    // Calculate total duration in minutes
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
      // Calculate automatically
      calories = calculateCardioCalories(selectedType, totalMinutes, userWeight);
    }

    const cardioType = CARDIO_TYPES.find(c => c.id === selectedType);
    const cardioEntry = {
      id: `cardio-${Date.now()}`,
      type: selectedType,
      typeName: cardioType?.name || 'Cardio',
      durationMinutes: totalMinutes,
      hours: hoursNum,
      minutes: minutesNum,
      calories: calories,
    };

    onSave(cardioEntry);
    handleClose();
  };

  const hoursNum = hours ? parseFloat(hours) : 0;
  const minutesNum = minutes ? parseFloat(minutes) : 0;
  const totalMinutes = hoursNum * 60 + minutesNum;
  const calculatedCalories = selectedType && totalMinutes > 0
    ? calculateCardioCalories(selectedType, totalMinutes, userWeight)
    : 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[colors.darkGray, colors.mediumGray]}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Cardio</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="x" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
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
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.7}
              >
                <Text style={styles.saveButtonText}>Add Cardio</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    maxHeight: '90%',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    maxHeight: 500,
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
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: colors.mediumGray,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: colors.mediumGray,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.white,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    ...typography.button,
    color: colors.black,
    fontWeight: '600',
  },
});

