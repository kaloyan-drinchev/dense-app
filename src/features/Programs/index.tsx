import React from "react";
import { View, ScrollView, TouchableOpacity, Text, Modal } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { Feather as Icon } from '@expo/vector-icons';

import { styles } from "./styles";
import { useProgramsLogic } from "./logic";
import { colors } from "@/constants/colors";
import { LoadingState } from '@/components/LoadingState';

export default function ProgramsScreen() {
  const {
    router,
    user,
    generatedProgram,
    userProgressData,
    loading,
    showEditModal,
    selectedDays,
    setShowEditModal,
    setSelectedDays,
    getCompletedWorkoutsCount,
    handleSavePreference
  } = useProgramsLogic();

  return (
    
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* Current Program Progress Banner */}
        {generatedProgram && userProgressData && (
          <View style={styles.progressBanner}>
            <LinearGradient
              colors={['#000000', '#0A0A0A']}
              style={styles.bannerGradient}
            >
              <View style={styles.bannerContent}>
                <Text style={styles.bannerTitle}>Push Pull Legs Program</Text>
                <Text style={styles.bannerProgramName}>
                  {getCompletedWorkoutsCount()} workouts completed
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.bannerButton}
                onPress={() => router.push('/single-program-view')}
              >
                <Text style={styles.bannerButtonText}>View Details</Text>
                <Icon name="arrow-right" size={16} color={colors.black} />
              </TouchableOpacity>
            </LinearGradient>
          </View>
        )}

        {/* Training Preferences */}
        {generatedProgram && (
          <View style={styles.preferencesContainer}>
            <View style={styles.preferencesHeader}>
              <Text style={styles.preferencesTitle}>Training Preferences</Text>
              <TouchableOpacity 
                style={styles.editButton}
                onPress={() => {
                  setSelectedDays(generatedProgram.trainingSchedule?.length || 3);
                  setShowEditModal(true);
                }}
              >
                <Icon name="edit-2" size={16} color={colors.primary} />
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIconContainer}>
                <Icon name="calendar" size={24} color={colors.primary} />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Training Days Per Week</Text>
                <Text style={styles.preferenceValue}>
                  {generatedProgram.trainingSchedule?.length || 3} days
                </Text>
              </View>
            </View>

            <View style={styles.preferenceSeparator} />

            <View style={styles.preferenceItem}>
              <View style={styles.preferenceIconContainer}>
                <Icon name="target" size={24} color={colors.primary} />
              </View>
              <View style={styles.preferenceContent}>
                <Text style={styles.preferenceLabel}>Fitness Goal</Text>
                <Text style={styles.preferenceValue}>
                  {generatedProgram.goal || 'Muscle Building'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Loading State */}
        {loading && (
          <LoadingState 
            text="Loading your program..." 
            showSkeleton={true} 
            skeletonType="banner" 
          />
        )}

        {/* Placeholder for when no program is active */}
        {!loading && !generatedProgram && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Active Program</Text>
            <Text style={styles.emptyText}>
              {!user?.id 
                ? "Please restart the app to load your profile."
                : "Complete the setup wizard to generate your personalized training program."
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Edit Preferences Modal */}
      <Modal
        visible={showEditModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Training Days Per Week</Text>
              <Text style={styles.modalSubtitle}>
                How many days per week do you want to train?
              </Text>

              <View style={styles.daysOptions}>
                {[3, 4, 5, 6].map((days) => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.dayOption,
                      selectedDays === days && styles.dayOptionSelected,
                    ]}
                    onPress={() => setSelectedDays(days)}
                  >
                    <Text
                      style={[
                        styles.dayOptionText,
                        selectedDays === days && styles.dayOptionTextSelected,
                      ]}
                    >
                      {days}
                    </Text>
                    <Text
                      style={[
                        styles.dayOptionLabel,
                        selectedDays === days && styles.dayOptionLabelSelected,
                      ]}
                    >
                      days
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalCancelButton}
                  onPress={() => setShowEditModal(false)}
                >
                  <Text style={styles.modalCancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSaveButton}
                  onPress={handleSavePreference}
                >
                  <Text style={styles.modalSaveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}