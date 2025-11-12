import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { searchExercises, type ExerciseData } from '@/constants/exercise-database';

interface AddCustomExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (exerciseName: string) => void;
}

export const AddCustomExerciseModal: React.FC<AddCustomExerciseModalProps> = ({
  visible,
  onClose,
  onAdd,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredExercises, setFilteredExercises] = useState<ExerciseData[]>([]);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = searchExercises(searchQuery);
      setFilteredExercises(results.slice(0, 50)); // Limit to 50 results for performance
      setShowResults(true);
    } else {
      setFilteredExercises([]);
      setShowResults(false);
    }
  }, [searchQuery]);

  const handleSelectExercise = (exerciseName: string) => {
    onAdd(exerciseName);
    setSearchQuery('');
    setShowResults(false);
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    setShowResults(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={handleClose}
      >
        <View 
          style={styles.modalContainer}
          onStartShouldSetResponder={() => true}
        >
          <LinearGradient
            colors={[colors.darkGray, colors.mediumGray]}
            style={styles.modalContent}
          >
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Custom Exercise</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Icon name="x" size={24} color={colors.white} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={20} color={colors.lightGray} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Type exercise name..."
                placeholderTextColor={colors.lightGray}
                autoFocus
                autoCapitalize="words"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                  <Icon name="x-circle" size={20} color={colors.lightGray} />
                </TouchableOpacity>
              )}
            </View>

            {/* Progressive Overload Info */}
            <View style={styles.infoBox}>
              <Icon name="trending-up" size={16} color={colors.primary} />
              <Text style={styles.infoText}>
                <Text style={styles.infoTextBold}>Progressive Overload Tip: </Text>
                Maintain the same exercise order and intensity. If replacing an exercise, choose the most similar alternative to track progress effectively.
              </Text>
            </View>

            {/* Results */}
            {showResults ? (
              <View style={styles.resultsContainer}>
                <Text style={styles.resultsHeader}>
                  {filteredExercises.length > 0 
                    ? `${filteredExercises.length} exercise${filteredExercises.length !== 1 ? 's' : ''} found`
                    : 'No exercises found. Try a different search.'
                  }
                </Text>
                {filteredExercises.length > 0 && (
                  <ScrollView 
                    style={styles.resultsList}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {filteredExercises.map((exercise) => (
                      <TouchableOpacity
                        key={exercise.id}
                        style={styles.resultItem}
                        onPress={() => handleSelectExercise(exercise.name)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.resultInfo}>
                          <Text style={styles.resultName}>{exercise.name}</Text>
                          <Text style={styles.resultCategory}>
                            {exercise.category} • {exercise.targetMuscle}
                          </Text>
                        </View>
                        <Icon name="plus-circle" size={20} color={colors.primary} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            ) : null}

            {/* Empty State */}
            {!showResults ? (
              <View style={styles.emptyState}>
                <Icon name="search" size={48} color={colors.mediumGray} />
                <Text style={styles.emptyStateText}>
                  Start typing to search from 200+ exercises
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  Examples: "Dips", "Bicep Curl", "Leg Press"
                </Text>
              </View>
            ) : null}
          </LinearGradient>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
    height: '100%',
    maxHeight: '100%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.white,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primary + '15',
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    flex: 1,
    lineHeight: 18,
  },
  infoTextBold: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  resultsContainer: {
    flex: 1,
    minHeight: 300,
  },
  resultsHeader: {
    ...typography.bodySmall,
    color: colors.lightGray,
    marginBottom: 12,
  },
  resultsList: {
    flex: 1,
    maxHeight: 400,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.darkGray,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  resultInfo: {
    flex: 1,
    marginRight: 12,
  },
  resultName: {
    ...typography.body,
    color: colors.white,
    marginBottom: 4,
  },
  resultCategory: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    ...typography.bodySmall,
    color: colors.lightGray,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

