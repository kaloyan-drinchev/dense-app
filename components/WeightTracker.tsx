import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { userProgressService } from '@/db/services';
import { useAuthStore } from '@/store/auth-store';

interface WeightEntry {
  date: string; // YYYY-MM-DD
  weight: number; // kg
  note?: string;
}

interface WeightSettings {
  targetWeight?: number;
  startingWeight?: number;
}

interface WeightTrackerProps {
  targetWeight?: number;
  initialWeight?: number;
}

export function WeightTracker({ targetWeight, initialWeight }: WeightTrackerProps) {
  const { user } = useAuthStore();
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentTargetWeight, setCurrentTargetWeight] = useState<number | undefined>(targetWeight);
  const [newTargetWeight, setNewTargetWeight] = useState('');
  const [loading, setLoading] = useState(true);

  // Load weight history on component mount
  useEffect(() => {
    loadWeightHistory();
  }, [user?.id]);

  const loadWeightHistory = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const progress = await userProgressService.getByUserId(user.id);
      
      if (progress?.weeklyWeights) {
        try {
          // Handle both string (JSON) and object (JSONB) types
          let weeklyWeightsData: any;
          if (typeof progress.weeklyWeights === 'string') {
            weeklyWeightsData = JSON.parse(progress.weeklyWeights);
          } else {
            weeklyWeightsData = progress.weeklyWeights;
          }
          
          // Extract weightEntries from the structure
          let parsedWeights: any;
          if (Array.isArray(weeklyWeightsData)) {
            // Legacy format: weeklyWeights was saved as array directly
            parsedWeights = weeklyWeightsData;
          } else if (weeklyWeightsData?.weightEntries) {
            // New format: weightEntries is a property of weeklyWeights object
            parsedWeights = weeklyWeightsData.weightEntries;
          } else {
            // No weight entries found
            parsedWeights = [];
          }
          
          // Ensure it's an array
          const weights = Array.isArray(parsedWeights) ? parsedWeights as WeightEntry[] : [];
          // Sort by date (newest first)
          weights.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setWeightEntries(weights);
        } catch (parseError) {
          console.error('Failed to parse weight data:', parseError);
          setWeightEntries([]);
        }
      } else {
        setWeightEntries([]);
      }
    } catch (error) {
      console.error('Failed to load weight history:', error);
      setWeightEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const saveWeightEntry = async () => {
    if (!newWeight || !user?.id) return;

    const weight = parseFloat(newWeight);
    if (isNaN(weight) || weight < 45 || weight > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid weight between 45-500 kg.');
      return;
    }

    try {
      // Check if entry for this date already exists
      const safeWeightEntries = Array.isArray(weightEntries) ? weightEntries : [];
      const existingEntryIndex = safeWeightEntries.findIndex(entry => entry.date === selectedDate);
      
      const newEntry: WeightEntry = {
        date: selectedDate,
        weight: weight,
        note: newNote.trim() || undefined,
      };

      let updatedEntries: WeightEntry[];
      if (existingEntryIndex >= 0) {
        // Update existing entry
        updatedEntries = [...safeWeightEntries];
        updatedEntries[existingEntryIndex] = newEntry;
      } else {
        // Add new entry
        updatedEntries = [newEntry, ...safeWeightEntries];
      }

      // Sort by date (newest first) - ensure it's an array
      if (Array.isArray(updatedEntries)) {
        updatedEntries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      }

      // Save to database
      const progress = await userProgressService.getByUserId(user.id);
      if (progress) {
        // Preserve the weeklyWeights structure (exerciseLogs, customExercises, etc.)
        let weeklyWeights: any = {};
        if (progress.weeklyWeights) {
          weeklyWeights = typeof progress.weeklyWeights === 'string'
            ? JSON.parse(progress.weeklyWeights)
            : progress.weeklyWeights;
          // Ensure it's an object (not array or null)
          if (!weeklyWeights || typeof weeklyWeights !== 'object' || Array.isArray(weeklyWeights)) {
            weeklyWeights = {};
          }
        }
        
        // Preserve existing properties and only update weightEntries
        weeklyWeights = {
          ...weeklyWeights,
          weightEntries: updatedEntries
        };
        
        await userProgressService.update(progress.id, {
          weeklyWeights: JSON.stringify(weeklyWeights),
        });
      }

      setWeightEntries(updatedEntries);
      setShowAddModal(false);
      setNewWeight('');
      setNewNote('');
      setSelectedDate(new Date().toISOString().split('T')[0]);

      Alert.alert('Success', 'Weight entry saved successfully!');
    } catch (error) {
      console.error('Failed to save weight entry:', error);
      Alert.alert('Error', 'Failed to save weight entry. Please try again.');
    }
  };

  const deleteWeightEntry = (dateToDelete: string) => {
    Alert.alert(
      'Delete Weight Entry',
      'Are you sure you want to delete this weight entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedEntries = Array.isArray(weightEntries) 
                ? weightEntries.filter(entry => entry.date !== dateToDelete)
                : [];
              
              const progress = await userProgressService.getByUserId(user!.id);
              if (progress) {
                // Preserve the weeklyWeights structure (exerciseLogs, customExercises, etc.)
                let weeklyWeights: any = {};
                if (progress.weeklyWeights) {
                  weeklyWeights = typeof progress.weeklyWeights === 'string'
                    ? JSON.parse(progress.weeklyWeights)
                    : progress.weeklyWeights;
                  // Ensure it's an object (not array or null)
                  if (!weeklyWeights || typeof weeklyWeights !== 'object' || Array.isArray(weeklyWeights)) {
                    weeklyWeights = {};
                  }
                }
                
                // Preserve existing properties and only update weightEntries
                weeklyWeights = {
                  ...weeklyWeights,
                  weightEntries: updatedEntries
                };
                
                await userProgressService.update(progress.id, {
                  weeklyWeights: JSON.stringify(weeklyWeights),
                });
              }
              
              setWeightEntries(updatedEntries);
            } catch (error) {
              console.error('Failed to delete weight entry:', error);
              Alert.alert('Error', 'Failed to delete weight entry.');
            }
          },
        },
      ]
    );
  };

  const getCurrentWeight = () => {
    if (!Array.isArray(weightEntries) || weightEntries.length === 0) {
      return initialWeight;
    }
    return weightEntries[0].weight;
  };

  const getWeightProgress = () => {
    const effectiveTargetWeight = currentTargetWeight || targetWeight;
    if (!effectiveTargetWeight || !initialWeight || !Array.isArray(weightEntries) || weightEntries.length === 0) return null;
    
    const currentWeight = getCurrentWeight()!;
    const totalChange = Math.abs(effectiveTargetWeight - initialWeight);
    const currentChange = Math.abs(currentWeight - initialWeight);
    const progressPercentage = Math.min((currentChange / totalChange) * 100, 100);
    
    return {
      current: currentWeight,
      target: effectiveTargetWeight,
      initial: initialWeight,
      change: currentWeight - initialWeight,
      progressPercentage,
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const saveTargetWeight = async () => {
    const weight = parseFloat(newTargetWeight);
    if (isNaN(weight) || weight < 45 || weight > 500) {
      Alert.alert('Invalid Weight', 'Please enter a valid target weight between 45-500 kg.');
      return;
    }

    try {
      setCurrentTargetWeight(weight);
      setShowTargetModal(false);
      setNewTargetWeight('');
      Alert.alert('Success', 'Target weight updated successfully!');
    } catch (error) {
      console.error('Failed to save target weight:', error);
      Alert.alert('Error', 'Failed to update target weight. Please try again.');
    }
  };

  const progress = getWeightProgress();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading weight history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Weight Progress</Text>
          {progress && (
            <Text style={styles.subtitle}>
              {progress.current} kg {progress.change >= 0 ? '↗️' : '↘️'} 
              {Math.abs(progress.change).toFixed(1)} kg
            </Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.targetButton} 
            onPress={() => setShowTargetModal(true)}
          >
            <Icon name="target" size={16} color={colors.dark} />
            <Text style={styles.targetButtonText}>
              {currentTargetWeight ? `${currentTargetWeight}kg` : 'Set Goal'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.addButton} 
            onPress={() => setShowAddModal(true)}
          >
            <Icon name="plus" size={20} color={colors.dark} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Card */}
      {progress && (
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <View style={styles.weightStat}>
              <Text style={styles.weightValue}>{progress.current}</Text>
              <Text style={styles.weightLabel}>Current</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={styles.progressTrack}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${progress.progressPercentage}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                {progress.progressPercentage.toFixed(0)}% to goal
              </Text>
            </View>
            <View style={styles.weightStat}>
              <Text style={styles.weightValue}>{progress.target}</Text>
              <Text style={styles.weightLabel}>Target</Text>
            </View>
          </View>
        </View>
      )}

      {/* Weight History */}
      <View style={styles.historySection}>
        <Text style={styles.historyTitle}>Weight History</Text>
        
        {!Array.isArray(weightEntries) || weightEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="trending-up" size={40} color={colors.lightGray} />
            <Text style={styles.emptyText}>No weight entries yet</Text>
            <Text style={styles.emptySubtext}>
              Start tracking your weight to see your progress
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
            {Array.isArray(weightEntries) && weightEntries.map((entry, index) => (
              <View key={entry.date} style={styles.historyItem}>
                <View style={styles.entryLeft}>
                  <Text style={styles.entryWeight}>{entry.weight} kg</Text>
                  <Text style={styles.entryDate}>{formatDate(entry.date)}</Text>
                  {entry.note && (
                    <Text style={styles.entryNote}>{entry.note}</Text>
                  )}
                </View>
                <View style={styles.entryRight}>
                  {index > 0 && Array.isArray(weightEntries) && weightEntries[index - 1] && (
                    <View style={styles.changeIndicator}>
                      <Text style={[
                        styles.changeText,
                        entry.weight > weightEntries[index - 1].weight 
                          ? styles.changePositive 
                          : styles.changeNegative
                      ]}>
                        {entry.weight > weightEntries[index - 1].weight ? '+' : ''}
                        {(entry.weight - weightEntries[index - 1].weight).toFixed(1)} kg
                      </Text>
                    </View>
                  )}
                  <TouchableOpacity 
                    onPress={() => deleteWeightEntry(entry.date)}
                    style={styles.deleteButton}
                  >
                    <Icon name="trash-2" size={16} color={colors.lightGray} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Add Weight Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Weight Entry</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Icon name="x" size={24} color={colors.lightGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Date</Text>
              <TextInput
                style={styles.input}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.lightGray}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={newWeight}
                onChangeText={setNewWeight}
                placeholder="e.g. 75.5"
                placeholderTextColor={colors.lightGray}
                keyboardType="decimal-pad"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Note (optional)</Text>
              <TextInput
                style={[styles.input, styles.noteInput]}
                value={newNote}
                onChangeText={setNewNote}
                placeholder="e.g. After morning workout"
                placeholderTextColor={colors.lightGray}
                multiline
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowAddModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveWeightEntry}>
                <Text style={styles.saveButtonText}>Save Entry</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Set Target Weight Modal */}
      <Modal
        visible={showTargetModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTargetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Target Weight</Text>
              <TouchableOpacity onPress={() => setShowTargetModal(false)}>
                <Icon name="x" size={24} color={colors.lightGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={newTargetWeight}
                onChangeText={setNewTargetWeight}
                placeholder={currentTargetWeight ? currentTargetWeight.toString() : "e.g. 70"}
                placeholderTextColor={colors.lightGray}
                keyboardType="decimal-pad"
              />
              {currentTargetWeight && (
                <Text style={styles.currentTargetText}>
                  Current target: {currentTargetWeight} kg
                </Text>
              )}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setShowTargetModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={saveTargetWeight}>
                <Text style={styles.saveButtonText}>Set Target</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  targetButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  targetButtonText: {
    ...typography.caption,
    color: colors.dark,
    fontWeight: '600',
    fontSize: 12,
  },
  title: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 4,
  },
  subtitle: {
    ...typography.body,
    color: colors.lightGray,
  },
  addButton: {
    backgroundColor: colors.primary,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  weightStat: {
    alignItems: 'center',
  },
  weightValue: {
    ...typography.h2,
    color: colors.white,
    marginBottom: 4,
  },
  weightLabel: {
    ...typography.caption,
    color: colors.lightGray,
    textTransform: 'uppercase',
  },
  progressBar: {
    flex: 1,
    marginHorizontal: 20,
    alignItems: 'center',
  },
  progressTrack: {
    width: '100%',
    height: 8,
    backgroundColor: colors.darkest,
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    ...typography.caption,
    color: colors.white,
  },
  historySection: {
    flex: 1,
  },
  historyTitle: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    ...typography.body,
    color: colors.lightGray,
    marginTop: 10,
  },
  emptySubtext: {
    ...typography.caption,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 5,
  },
  historyList: {
    flex: 1,
  },
  historyItem: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryLeft: {
    flex: 1,
  },
  entryWeight: {
    ...typography.h4,
    color: colors.white,
    marginBottom: 4,
  },
  entryDate: {
    ...typography.body,
    color: colors.lightGray,
    marginBottom: 2,
  },
  entryNote: {
    ...typography.caption,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  entryRight: {
    alignItems: 'flex-end',
  },
  changeIndicator: {
    marginBottom: 8,
  },
  changeText: {
    ...typography.caption,
    fontWeight: '600',
  },
  changePositive: {
    color: colors.success,
  },
  changeNegative: {
    color: colors.error,
  },
  deleteButton: {
    padding: 8,
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: colors.darkGray,
    borderRadius: 20,
    padding: 24,
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
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    ...typography.body,
    color: colors.white,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    backgroundColor: colors.dark,
    borderRadius: 12,
    padding: 16,
    color: colors.white,
    ...typography.body,
    borderWidth: 1,
    borderColor: colors.darkest,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: colors.darkest,
    borderRadius: 12,
    padding: 16,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.lightGray,
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 16,
    marginLeft: 10,
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.button,
    color: colors.dark,
  },
  currentTargetText: {
    ...typography.caption,
    color: colors.lightGray,
    marginTop: 8,
    fontStyle: 'italic',
  },
});
