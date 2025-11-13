import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService, userProgressService } from '@/db/services';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useTimerStore } from '@/store/timer-store';
import {
  Feather as Icon,
} from '@expo/vector-icons';
import { ExerciseCard } from '@/components/ExerciseCard';
import { WorkoutOptionsModal } from '@/components/WorkoutOptionsModal';
import { WorkoutPreviewModal } from '@/components/WorkoutPreviewModal';
import { WorkoutNotStartedModal } from '@/components/WorkoutNotStartedModal';
import { AddCustomExerciseModal } from '@/components/AddCustomExerciseModal';
import { CardioEntryModal } from '@/components/CardioEntryModal';
import { markTodayWorkoutCompleted } from '@/utils/workout-completion-tracker';
import { ensureMinimumDuration } from '@/utils/workout-duration';
import { 
  analyzeExercisePRs, 
  getBeatLastWorkoutSuggestions,
  type ExerciseLogs,
  type ExercisePRs
} from '@/utils/pr-tracking';
import { calculateWorkoutCalories } from '@/utils/exercise-calories';

export default function WorkoutSessionScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [generatedProgram, setGeneratedProgram] = useState<any>(null);
  const [userProgressData, setUserProgressData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showNotStartedModal, setShowNotStartedModal] = useState(false);
  const [showWorkoutConfirmModal, setShowWorkoutConfirmModal] = useState(false);
  const [workoutCompletionData, setWorkoutCompletionData] = useState<{percentage: number, completed: number, total: number} | null>(null);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  
  const [customExercises, setCustomExercises] = useState<any[]>([]);
  const [showAddExerciseModal, setShowAddExerciseModal] = useState(false);
  const [cardioEntries, setCardioEntries] = useState<any[]>([]);
  const [showCardioModal, setShowCardioModal] = useState(false);
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
  const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
  const [userWeight, setUserWeight] = useState<number>(70);
  const { 
    formattedTime, 
    isRunning, 
    isWorkoutActive,
    startWorkout, 
    pauseTimer, 
    resumeTimer, 
    resetTimer, 
    completeWorkout 
  } = useWorkoutTimer();
  const workoutStartTime = useTimerStore((state) => state.workoutStartTime);

  const getTodaysWorkout = () => {
    if (!generatedProgram || !userProgressData) return null;
    
    const currentWorkoutIndex = userProgressData.currentWorkout - 1;
    const workout = generatedProgram.weeklyStructure?.[currentWorkoutIndex];
    
    return workout || null;
  };

  const todaysWorkout = getTodaysWorkout();

  useEffect(() => {
    loadWorkoutData();
  }, [user]);

  useEffect(() => {
    setWorkoutStarted(isWorkoutActive);
  }, [isWorkoutActive]);

  useFocusEffect(
    useCallback(() => {
      loadWorkoutData();
    }, [user?.id])
  );

  const loadWorkoutData = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const wizardResults = await wizardResultsService.getByUserId(user.id);
      if (wizardResults?.generatedSplit) {
        const program = JSON.parse(wizardResults.generatedSplit);
        setGeneratedProgram(program);
      }
      
      if (wizardResults?.weight) {
        setUserWeight(wizardResults.weight);
      }

      const progress = await userProgressService.getByUserId(user.id);
      setUserProgressData(progress);
      
      if (progress?.weeklyWeights) {
        const weeklyWeights = JSON.parse(progress.weeklyWeights);
        const logs = weeklyWeights?.exerciseLogs || {};
        setExerciseLogs(logs);
        
        const allPRs = analyzeExercisePRs(logs);
        setExercisePRs(allPRs);
        
        const today = new Date().toISOString().split('T')[0];
        const customExs = weeklyWeights?.customExercises?.[today] || [];
        setCustomExercises(customExs);
        
        const cardioEntries = weeklyWeights?.cardioEntries?.[today] || [];
        setCardioEntries(cardioEntries);
      }
    } catch (error) {
      console.error('❌ Failed to load workout data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomExercise = async (exerciseName: string) => {
    if (customExercises.length >= 3) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 3 custom exercises per workout.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    const customExercise = {
      id: `custom-${Date.now()}`,
      name: exerciseName,
      sets: 2,
      reps: '10',
      restSeconds: 60,
      targetMuscle: 'Custom',
      isCustom: true,
    };
    
    try {
      if (!user?.id || !userProgressData) return;
      
      setCustomExercises(prev => [...prev, customExercise]);
      
      const freshProgress = await userProgressService.getByUserId(user.id);
      if (!freshProgress) {
        throw new Error('Failed to fetch user progress');
      }
      
      const weeklyWeights = freshProgress.weeklyWeights ? JSON.parse(freshProgress.weeklyWeights) : {};
      const today = new Date().toISOString().split('T')[0];
      
      if (!weeklyWeights.customExercises) {
        weeklyWeights.customExercises = {};
      }
      
      if (!weeklyWeights.customExercises[today]) {
        weeklyWeights.customExercises[today] = [];
      }
      
      weeklyWeights.customExercises[today].push(customExercise);
      
      await userProgressService.update(freshProgress.id, {
        weeklyWeights: JSON.stringify(weeklyWeights),
      });
      
      await loadWorkoutData();
      
    } catch (error) {
      console.error('❌ Failed to add custom exercise:', error);
      setCustomExercises(prev => prev.filter(ex => ex.id !== customExercise.id));
      Alert.alert('Error', 'Failed to add custom exercise. Please try again.');
    }
  };

  const handleAddCardio = async (cardio: {
    id: string;
    type: string;
    typeName: string;
    durationMinutes: number;
    hours: number;
    minutes: number;
    calories: number;
  }) => {
    if (cardioEntries.length >= 3) {
      Alert.alert(
        'Limit Reached',
        'You can only add up to 3 cardio sessions per workout.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    try {
      if (!user?.id || !userProgressData) return;
      
      setCardioEntries(prev => [...prev, cardio]);
      
      const freshProgress = await userProgressService.getByUserId(user.id);
      if (!freshProgress) {
        throw new Error('Failed to fetch user progress');
      }
      
      const weeklyWeights = freshProgress.weeklyWeights ? JSON.parse(freshProgress.weeklyWeights) : {};
      const today = new Date().toISOString().split('T')[0];
      
      if (!weeklyWeights.cardioEntries) {
        weeklyWeights.cardioEntries = {};
      }
      
      if (!weeklyWeights.cardioEntries[today]) {
        weeklyWeights.cardioEntries[today] = [];
      }
      
      weeklyWeights.cardioEntries[today].push(cardio);
      
      await userProgressService.update(freshProgress.id, {
        weeklyWeights: JSON.stringify(weeklyWeights),
      });
      
      await loadWorkoutData();
    } catch (error) {
      console.error('❌ Failed to add cardio:', error);
      setCardioEntries(prev => prev.filter(c => c.id !== cardio.id));
      Alert.alert('Error', 'Failed to add cardio. Please try again.');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleResetTimer = () => {
    Alert.alert(
      'Reset Timer',
      'Are you sure you want to reset the workout timer? This will restart your timer from 00:00.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => resetTimer(),
        },
      ]
    );
  };



  const getWeeklyWeightsData = () => {
    try {
      return userProgressData?.weeklyWeights ? JSON.parse(userProgressData.weeklyWeights) : {};
    } catch {
      return {} as any;
    }
  };

  const getExerciseStatus = (
    exerciseId: string,
    plannedSets: number
  ): 'pending' | 'in-progress' | 'completed' => {
    const today = new Date().toISOString().slice(0, 10);
    const weeklyWeightsData = getWeeklyWeightsData();
    const sessions = weeklyWeightsData?.exerciseLogs?.[exerciseId] as
      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
      | undefined;
    
    if (!sessions || sessions.length === 0) return 'pending';
    
    const todaySession = sessions.find((s) => s.date === today);
    if (!todaySession || !todaySession.sets || todaySession.sets.length === 0) return 'pending';
    
    const completedCount = todaySession.sets.filter((s) => !!s.isCompleted).length;
    const touchedSets = todaySession.sets.filter((s) => 
      (s.reps ?? 0) > 0 || (s.weightKg ?? 0) > 0 || s.isCompleted
    );
    
    const required = Math.max(0, plannedSets || 0);
    
    if (required > 0 && completedCount >= required) return 'completed';
    if (touchedSets.length > 0) return 'in-progress';
    
    return 'pending';
  };

  const calculateWorkoutProgress = () => {
    if (!todaysWorkout?.exercises) return { percentage: 0, completed: 0, total: 0 };
    
    const exercises = todaysWorkout.exercises;
    const regularCompletedCount = exercises.filter((ex: any) => {
      const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
      return getExerciseStatus(exId, ex.sets) === 'completed';
    }).length;
    
    const customCompletedCount = customExercises.filter((ex: any) => {
      return getExerciseStatus(ex.id, ex.sets) === 'completed';
    }).length;
    
    const completedCount = regularCompletedCount + customCompletedCount;
    const total = exercises.length + customExercises.length;
    const percentage = total > 0 ? Math.round((completedCount / total) * 100) : 0;
    
    return { percentage, completed: completedCount, total };
  };

  const workoutProgress = calculateWorkoutProgress();
  const allExercisesCompleted = workoutProgress.percentage === 100;

  const hasPRPotential = (exerciseId: string): boolean => {
    const suggestions = getBeatLastWorkoutSuggestions(exerciseId, exercisePRs);
    return suggestions.length > 0 && !suggestions[0].includes('First time');
  };

  const handleStartWorkoutPress = () => {
    setShowOptionsModal(true);
  };

  const handleViewOption = () => {
    setShowOptionsModal(false);
    setShowPreviewModal(true);
  };

  const handleLetsGoOption = () => {
    setShowOptionsModal(false);
    handleStartWorkout();
  };

  const handleStartWorkout = () => {
    setShowPreviewModal(false);
    setWorkoutStarted(true);
    startWorkout(
      todaysWorkout?.id || 'today-workout', 
      todaysWorkout?.name || "Today's Workout"
    );
  };

  const handleStopWorkout = () => {
    Alert.alert(
      "Reset Today's Workout",
      "This will reset your progress for today's workout. All completed exercises will be set back to pending state. Are you sure?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Reset Workout",
          style: "destructive",
          onPress: confirmResetWorkout
        }
      ]
    );
  };

  const confirmResetWorkout = async () => {
    try {
      if (!user?.id || !userProgressData) return;

      completeWorkout();
      
      let weeklyWeights: any = {};
      if (userProgressData.weeklyWeights) {
        try {
          weeklyWeights = JSON.parse(userProgressData.weeklyWeights);
        } catch (error) {
          weeklyWeights = {};
        }
      }

      if (todaysWorkout?.exercises) {
        todaysWorkout.exercises.forEach((exercise: any) => {
          const exerciseId = exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase();
          
          if (weeklyWeights.exerciseLogs && weeklyWeights.exerciseLogs[exerciseId]) {
            weeklyWeights.exerciseLogs[exerciseId] = [];
          }
        });
      }

      const resetProgress = await userProgressService.update(userProgressData.id, {
        weeklyWeights: JSON.stringify(weeklyWeights),
      });

      if (resetProgress) {
        setUserProgressData(resetProgress);
        
        setWorkoutStarted(false);
        setShowOptionsModal(false);
        setShowPreviewModal(false);
        setShowNotStartedModal(false);
      }
    } catch (error) {
      console.error('❌ Failed to reset workout:', error);
      Alert.alert(
        "Reset Failed",
        "Something went wrong while resetting today's workout. Please try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleExercisePress = (exerciseId: string) => {
    if (!workoutStarted) {
      setShowNotStartedModal(true);
      return;
    }
    router.push(`/workout-exercise-tracker?exerciseId=${exerciseId}`);
  };

  const handleFinishWorkout = async () => {
    if (!user?.id || !userProgressData) return;
    
    setWorkoutCompletionData({ 
      percentage: workoutProgress.percentage, 
      completed: workoutProgress.completed, 
      total: workoutProgress.total 
    });
    setShowWorkoutConfirmModal(true);
  };

  const completeWorkoutWithPercentage = async () => {
    if (!user?.id || !userProgressData) return;
    try {
      const startTimeToSave = workoutStartTime || new Date().toISOString();
      const { duration } = completeWorkout();
      
      const currentWorkoutIndex = userProgressData.currentWorkout - 1;
      const completedRaw = userProgressData.completedWorkouts || '[]';
      let completedArr: any[] = [];
      try { completedArr = JSON.parse(completedRaw); } catch { completedArr = []; }
      const finishTime = new Date().toISOString();
      completedArr.push({
        date: finishTime,
        workoutIndex: currentWorkoutIndex,
        workoutName: todaysWorkout?.name,
        duration: duration,
        percentageSuccess: workoutProgress.percentage,
        startTime: startTimeToSave,
        finishTime: finishTime,
      });
      
      const nextWorkout = Math.min(
        (userProgressData.currentWorkout || 1) + 1,
        (generatedProgram?.weeklyStructure?.length || 1)
      );
      const updated = await userProgressService.update(userProgressData.id, {
        currentWorkout: nextWorkout,
        completedWorkouts: JSON.stringify(completedArr),
      });
      
      await markTodayWorkoutCompleted(user.id);
      
      if (updated) {
        setUserProgressData(updated);
        router.back();
      }
    } catch (e) {
      console.error('❌ Failed to finish workout:', e);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>🔄 Loading your workout...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!todaysWorkout) {
    return (
      <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton} activeOpacity={1}>
              <Icon name="arrow-left" size={24} color={colors.white} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Workout Session</Text>
          </View>
          
          <View style={styles.noWorkoutContainer}>
            <Icon name="check-circle" size={64} color={colors.primary} />
            <Text style={styles.noWorkoutTitle}>All Done!</Text>
            <Text style={styles.noWorkoutText}>You've completed all workouts for today</Text>
              <TouchableOpacity 
                style={styles.backHomeButton}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={1}
              >
              <Text style={styles.backHomeText}>Back to Home</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#000000', '#0A0A0A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton} activeOpacity={1}>
            <Icon name="arrow-left" size={24} color={colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Today's Workout</Text>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
          <View style={styles.workoutHeader}>
            <Text style={styles.workoutName}>{todaysWorkout.name}</Text>
            
            {/* Workout Timer or Start Button */}
            {workoutStarted ? (
              <View style={styles.timerContainer}>
                <Text style={styles.timerText}>{formattedTime}</Text>
                
                <View style={styles.timerControls}>
                  <TouchableOpacity 
                    style={[styles.timerButton, styles.resetButton]} 
                    onPress={handleResetTimer}
                    activeOpacity={1}
                  >
                    <Icon name="refresh-cw" size={16} color={colors.white} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.timerButton, isRunning ? styles.pauseButton : styles.playButton]} 
                    onPress={isRunning ? pauseTimer : resumeTimer}
                    activeOpacity={1}
                  >
                    <Icon name={isRunning ? "pause" : "play"} size={16} color={colors.black} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.timerButton, styles.stopButton]} 
                    onPress={handleStopWorkout}
                    activeOpacity={1}
                  >
                    <Icon name="x" size={16} color={colors.white} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.startButtonContainer}>
                <TouchableOpacity 
                  style={styles.startWorkoutButton}
                  onPress={handleStartWorkoutPress}
                  activeOpacity={1}
                >
                  <LinearGradient
                    colors={['#00FF88', '#00CC6A']}
                    style={styles.startWorkoutGradient}
                  >
                    <Icon name="play" size={24} color={colors.black} />
                    <Text style={[styles.startWorkoutText, typography.button]}>
                      Start Workout
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={styles.workoutMeta}>
              <View style={styles.metaItem}>
                <Icon name="clock" size={16} color={colors.primary} />
                <Text style={styles.metaText}>{ensureMinimumDuration(todaysWorkout.estimatedDuration)} min</Text>
              </View>
              <View style={styles.metaItem}>
                <Icon name="target" size={16} color={colors.primary} />
                <Text style={styles.metaText}>{todaysWorkout.type}</Text>
              </View>
              {(() => {
                const today = new Date().toISOString().slice(0, 10);
                const weeklyWeightsData = getWeeklyWeightsData();
                
                const completedRaw = userProgressData?.completedWorkouts || '[]';
                let completedWorkouts: any[] = [];
                try { 
                  completedWorkouts = JSON.parse(completedRaw); 
                } catch { 
                  completedWorkouts = []; 
                }
                
                const todayWorkoutCompleted = completedWorkouts.some((w: any) => {
                  if (typeof w === 'object' && w.date) {
                    const workoutDate = new Date(w.date).toISOString().split('T')[0];
                    return workoutDate === today;
                  }
                  return false;
                });
                
                const completedExercises: Array<{ 
                  name: string; 
                  sets: number;
                  setsData?: Array<{ weightKg: number; reps: number; isCompleted: boolean }>;
                }> = [];
                
                if (!workoutStarted && !todayWorkoutCompleted) {
                  (todaysWorkout.exercises || []).forEach((ex: any) => {
                    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
                    completedExercises.push({
                      name: ex.name,
                      sets: sets
                    });
                  });
                  
                  const todayCustomExercises = weeklyWeightsData?.customExercises?.[today] || [];
                  todayCustomExercises.forEach((ex: any) => {
                    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
                    completedExercises.push({
                      name: ex.name,
                      sets: sets
                    });
                  });
                  
                  const estimatedCalories = completedExercises.length > 0 
                    ? calculateWorkoutCalories(completedExercises, userWeight)
                    : 0;
                  
                  const todayCardioEntries = weeklyWeightsData?.cardioEntries?.[today] || [];
                  const cardioCalories = todayCardioEntries.reduce((sum: number, entry: any) => {
                    return sum + (entry.calories || 0);
                  }, 0);
                  
                  const totalCalories = estimatedCalories + cardioCalories;
                  
                  return (
                    <View style={styles.metaItem}>
                      <Icon name="zap" size={16} color={colors.primary} />
                      <Text style={styles.metaText}>~{totalCalories} cal</Text>
                    </View>
                  );
                }
                
                if (todayWorkoutCompleted) {
                  (todaysWorkout.exercises || []).forEach((ex: any) => {
                    const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
                    const sessions = weeklyWeightsData?.exerciseLogs?.[exId] as
                      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    const todaySession = sessions?.find((s) => s.date === today);
                    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
                    
                    if (todaySession?.sets && todaySession.sets.length > 0) {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets,
                        setsData: todaySession.sets
                      });
                    } else {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets
                      });
                    }
                  });
                  
                  const todayCustomExercises = weeklyWeightsData?.customExercises?.[today] || [];
                  
                  todayCustomExercises.forEach((ex: any) => {
                    const sessions = weeklyWeightsData?.exerciseLogs?.[ex.id] as
                      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    const todaySession = sessions?.find((s) => s.date === today);
                    const sets = typeof ex.sets === 'number' ? ex.sets : 3;
                    
                    if (todaySession?.sets && todaySession.sets.length > 0) {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets,
                        setsData: todaySession.sets
                      });
                    } else {
                      completedExercises.push({
                        name: ex.name,
                        sets: sets
                      });
                    }
                  });
                } else {
                  (todaysWorkout.exercises || []).forEach((ex: any) => {
                    const exId = ex.id || ex.name.replace(/\s+/g, '-').toLowerCase();
                    const sessions = weeklyWeightsData?.exerciseLogs?.[exId] as
                      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    if (sessions) {
                      const todaySession = sessions.find((s) => s.date === today);
                      if (todaySession?.sets) {
                        const completedSets = todaySession.sets.filter((s) => !!s.isCompleted).length;
                        if (completedSets > 0) {
                          completedExercises.push({
                            name: ex.name,
                            sets: completedSets,
                            setsData: todaySession.sets
                          });
                        }
                      }
                    }
                  });
                  
                  const allCustomExercises = customExercises.length > 0 
                    ? customExercises 
                    : (weeklyWeightsData?.customExercises?.[today] || []);
                  
                  allCustomExercises.forEach((ex: any) => {
                    const sessions = weeklyWeightsData?.exerciseLogs?.[ex.id] as
                      | Array<{ date: string; sets: Array<{ weightKg: number; reps: number; isCompleted: boolean }> }>
                      | undefined;
                    
                    if (sessions) {
                      const todaySession = sessions.find((s) => s.date === today);
                      if (todaySession?.sets && todaySession.sets.length > 0) {
                        const completedSets = todaySession.sets.filter((s) => !!s.isCompleted).length;
                        if (completedSets > 0) {
                          completedExercises.push({
                            name: ex.name,
                            sets: completedSets,
                            setsData: todaySession.sets
                          });
                        }
                      }
                    }
                  });
                }
                
                const estimatedCalories = completedExercises.length > 0 
                  ? calculateWorkoutCalories(completedExercises, userWeight)
                  : 0;
                
                const weeklyWeightsDataForCalories = getWeeklyWeightsData();
                const todayCardioEntries = weeklyWeightsDataForCalories?.cardioEntries?.[today] || [];
                const cardioCalories = todayCardioEntries.reduce((sum: number, entry: any) => {
                  return sum + (entry.calories || 0);
                }, 0);
                
                const totalCalories = estimatedCalories + cardioCalories;
                
                return (
                  <View style={styles.metaItem}>
                    <Icon name="zap" size={16} color={colors.primary} />
                    <Text style={styles.metaText}>~{totalCalories} cal</Text>
                  </View>
                );
              })()}
            </View>
          </View>

          <View style={styles.progressIndicator}>
            <Text style={styles.progressText}>
              Week {userProgressData?.currentWeek} • Workout {userProgressData?.currentWorkout}
            </Text>
          </View>

          <View style={styles.exercisesSection}>
            <View style={styles.exercisesSectionHeader}>
              <Text style={styles.sectionTitle}>
                Exercises ({(todaysWorkout.exercises?.length || 0) + customExercises.length})
              </Text>
              {workoutStarted && (
                <View style={styles.addButtonsContainer}>
                  {customExercises.length < 3 && (
                    <TouchableOpacity
                      style={styles.addExerciseButton}
                      onPress={() => setShowAddExerciseModal(true)}
                      activeOpacity={1}
                    >
                      <Icon name="plus" size={20} color={colors.black} />
                      <Text style={styles.addExerciseButtonText}>Exercise</Text>
                    </TouchableOpacity>
                  )}
                  {(cardioEntries?.length ?? 0) < 3 && (
                    <TouchableOpacity
                      style={styles.addCardioButton}
                      onPress={() => setShowCardioModal(true)}
                      activeOpacity={1}
                    >
                      <Icon name="activity" size={20} color={colors.black} />
                      <Text style={styles.addCardioButtonText}>+ Cardio</Text>
                    </TouchableOpacity>
                  )}
                  {customExercises.length >= 3 && cardioEntries.length >= 3 && (
                    <View style={styles.maxLimitReached}>
                      <Text style={styles.maxLimitText}>Max limits reached</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            {todaysWorkout.exercises?.map((exercise: any, index: number) => {
              const exerciseWithId = {
                ...exercise,
                id: exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase(),
                targetMuscle: exercise.targetMuscle || 'General',
                restTime: exercise.restSeconds || 60,
                isCompleted:
                  getExerciseStatus(
                    exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase(),
                    exercise.sets
                  ) === 'completed',
              };
              
              return (
                <ExerciseCard
                  key={index}
                  exercise={exerciseWithId}
                  index={index}
                  onPress={() => handleExercisePress(exerciseWithId.id)}
                  status={getExerciseStatus(exerciseWithId.id, exerciseWithId.sets)}
                  prPotential={hasPRPotential(exerciseWithId.id)}
                />
              );
            }) || (
              <Text style={styles.noExercisesText}>No exercises found for today</Text>
            )}
            
            {/* Custom Exercises */}
            {customExercises.map((exercise: any, index: number) => {
              const exerciseWithId = {
                ...exercise,
                id: exercise.id,
                targetMuscle: exercise.targetMuscle || 'Custom',
                restTime: exercise.restSeconds || 60,
                isCompleted:
                  getExerciseStatus(exercise.id, exercise.sets) === 'completed',
                isCustom: true,
              };
              
              return (
                <ExerciseCard
                  key={exercise.id}
                  exercise={exerciseWithId}
                  index={todaysWorkout.exercises?.length + index}
                  onPress={() => handleExercisePress(exerciseWithId.id)}
                  status={getExerciseStatus(exerciseWithId.id, exerciseWithId.sets)}
                  prPotential={false}
                />
              );
            })}
            
            {/* Max Custom Exercises Message */}
            {customExercises.length === 3 && (
              <View style={styles.maxCustomExercisesInfo}>
                <Icon name="info" size={16} color={colors.lightGray} />
                <Text style={styles.maxCustomExercisesText}>
                  Maximum of 3 custom exercises reached
                </Text>
              </View>
            )}
            
            {/* Cardio Section */}
            {(() => {
              // Get cardio entries from both state and weeklyWeightsData to ensure we show all entries
              const today = new Date().toISOString().split('T')[0];
              const weeklyWeightsData = getWeeklyWeightsData();
              const todayCardioEntries = weeklyWeightsData?.cardioEntries?.[today] || [];
              // Merge state and database entries, preferring state (most recent)
              const allCardioEntries = [...todayCardioEntries];
              cardioEntries.forEach((stateEntry: any) => {
                if (!allCardioEntries.find((e: any) => e.id === stateEntry.id)) {
                  allCardioEntries.push(stateEntry);
                }
              });
              
              if (allCardioEntries.length === 0) return null;
              
              return (
                <View style={styles.cardioSection}>
                  <Text style={styles.cardioSectionTitle}>Cardio</Text>
                  {allCardioEntries.map((cardio: any) => {
                    const durationText = cardio.hours > 0 
                      ? `${cardio.hours}h ${cardio.minutes || 0}m`
                      : `${cardio.durationMinutes || cardio.minutes || 0}m`;
                    
                    return (
                      <View key={cardio.id} style={styles.cardioCard}>
                        <View style={styles.cardioCardContent}>
                          <Icon name="activity" size={20} color={colors.primary} />
                          <View style={styles.cardioCardInfo}>
                            <View style={styles.cardioCardHeader}>
                              <Text style={styles.cardioCardName}>{cardio.typeName}</Text>
                              <View style={styles.completedBadge}>
                                <Icon name="check-circle" size={14} color={colors.success} />
                                <Text style={styles.completedBadgeText}>Completed</Text>
                              </View>
                            </View>
                            <Text style={styles.cardioCardDetails}>
                              {durationText} • {cardio.calories} cal
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })}
                  {allCardioEntries.length === 3 && (
                    <View style={styles.maxCardioInfo}>
                      <Icon name="info" size={16} color={colors.lightGray} />
                      <Text style={styles.maxCardioText}>
                        Maximum of 3 cardio sessions reached
                      </Text>
                    </View>
                  )}
                </View>
              );
            })()}
            
            {workoutStarted && (
              <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout} activeOpacity={1}>
                <Text style={styles.finishButtonText}>
                  Finish Workout ({workoutProgress.percentage}%)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Modals */}
      <WorkoutOptionsModal
        visible={showOptionsModal}
        onClose={() => setShowOptionsModal(false)}
        onView={handleViewOption}
        onLetsGo={handleLetsGoOption}
        workoutName={todaysWorkout?.name}
      />

      <WorkoutPreviewModal
        visible={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        onStartWorkout={handleStartWorkout}
        workoutName={todaysWorkout?.name}
        exercises={todaysWorkout?.exercises?.map((exercise: any, index: number) => ({
          id: exercise.id || exercise.name.replace(/\s+/g, '-').toLowerCase(),
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          restTime: exercise.restSeconds ? `${exercise.restSeconds}s` : undefined,
        })) || []}
        estimatedDuration={`${ensureMinimumDuration(todaysWorkout?.estimatedDuration)} min`}
      />

      <WorkoutNotStartedModal
        visible={showNotStartedModal}
        onClose={() => setShowNotStartedModal(false)}
        onStartWorkout={() => {
          setShowNotStartedModal(false);
          handleStartWorkout();
        }}
      />

      {/* Add Custom Exercise Modal */}
      <AddCustomExerciseModal
        visible={showAddExerciseModal}
        onClose={() => setShowAddExerciseModal(false)}
        onAdd={handleAddCustomExercise}
      />
      
      <CardioEntryModal
        visible={showCardioModal}
        onClose={() => setShowCardioModal(false)}
        onSave={handleAddCardio}
        userWeight={userWeight}
      />

      {/* Workout Completion Modal */}
      {workoutCompletionData && (
        <Modal
          visible={showWorkoutConfirmModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowWorkoutConfirmModal(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowWorkoutConfirmModal(false)}
          >
            <View style={styles.modalContainer}>
              <LinearGradient
                colors={[colors.darkGray, colors.mediumGray]}
                style={styles.modalContent}
              >
                {workoutCompletionData.percentage === 100 ? (
                  <>
                    <Text style={styles.modalTitle}>🎉 Amazing Work!</Text>
                    <Text style={styles.modalDescription}>
                      Outstanding! You've completed all {workoutCompletionData.total} exercises. You're crushing your fitness goals!
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.singleButton]}
                        onPress={() => {
                          setShowWorkoutConfirmModal(false);
                          completeWorkoutWithPercentage();
                        }}
                        activeOpacity={1}
                      >
                        <Text style={styles.confirmButtonText}>Finish Workout</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.modalTitle}>Complete Workout?</Text>
                    <Text style={styles.modalDescription}>
                      You're at {workoutCompletionData.percentage}% completion ({workoutCompletionData.completed}/{workoutCompletionData.total} exercises). For better results do 100% next time!
                    </Text>
                    
                    <View style={styles.modalButtons}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton, styles.dualButton]}
                        onPress={() => {
                          setShowWorkoutConfirmModal(false);
                          completeWorkoutWithPercentage();
                        }}
                        activeOpacity={1}
                      >
                        <Text style={styles.cancelButtonText}>Yes, Finish</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity
                        style={[styles.modalButton, styles.confirmButton, styles.dualButton]}
                        onPress={() => setShowWorkoutConfirmModal(false)}
                        activeOpacity={1}
                      >
                        <Text style={styles.confirmButtonText}>Continue Workout</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </LinearGradient>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
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
  loadingText: {
    fontSize: 18,
    color: colors.white,
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.darkGray,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.white,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  workoutHeader: {
    marginBottom: 16,
  },
  workoutName: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  timerText: {
    ...typography.workoutTimer,
    color: colors.primary,
    textAlign: 'left',
    includeFontPadding: false,
    textAlignVertical: 'center',
    lineHeight: 52,
  },
  timerControls: {
    flexDirection: 'row',
    gap: 8,
  },
  timerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    backgroundColor: colors.primary,
  },
  pauseButton: {
    backgroundColor: colors.primary,
  },
  resetButton: {
    backgroundColor: colors.mediumGray,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  startButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  startWorkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startWorkoutGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 12,
  },
  startWorkoutText: {
    color: colors.black,
    fontSize: 18,
  },
  workoutMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: colors.lightGray,
    textTransform: 'capitalize',
  },
  progressIndicator: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    alignItems: 'center',
  },
  progressText: {
    ...typography.bodySmall,
    color: colors.primary,
  },
  exercisesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
  },

  noExercisesText: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginTop: 32,
  },
  exercisesSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addExerciseButtonText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  maxCustomExercisesInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    gap: 8,
  },
  maxCustomExercisesText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  addButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    flexWrap: 'wrap',
    flexShrink: 0,
  },
  maxLimitReached: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  maxLimitText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  addCardioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addCardioButtonText: {
    ...typography.bodySmall,
    color: colors.black,
    fontWeight: 'bold',
  },
  cardioSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  cardioSectionTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 12,
  },
  cardioCard: {
    backgroundColor: colors.darkGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.mediumGray,
  },
  cardioCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardioCardInfo: {
    flex: 1,
  },
  cardioCardName: {
    ...typography.body,
    color: colors.white,
    fontWeight: '600',
    marginBottom: 4,
  },
  cardioCardDetails: {
    ...typography.bodySmall,
    color: colors.lightGray,
  },
  cardioCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 255, 136, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 4,
  },
  completedBadgeText: {
    ...typography.caption,
    color: colors.success,
    fontSize: 11,
    fontWeight: '600',
  },
  maxCardioInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.mediumGray,
    gap: 8,
  },
  maxCardioText: {
    ...typography.bodySmall,
    color: colors.lightGray,
    fontStyle: 'italic',
  },
  finishButton: {
    marginTop: 16,
    backgroundColor: colors.success,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  finishButtonText: {
    ...typography.button,
    color: colors.black,
  },
  noWorkoutContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  noWorkoutTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.white,
    marginTop: 16,
    marginBottom: 8,
  },
  noWorkoutText: {
    fontSize: 16,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
  },
  backHomeButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  backHomeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 400,
  },
  modalContent: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  modalTitle: {
    ...typography.h3,
    color: colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  modalDescription: {
    ...typography.body,
    color: colors.lightGray,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtons: {
    display: 'flex',
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButton: {
    display: 'flex',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  cancelButton: {
    backgroundColor: colors.mediumGray,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  cancelButtonText: {
    ...typography.button,
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButtonText: {
    ...typography.button,
    color: colors.black,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  singleButton: {
    flex: 0,
    minWidth: 120,
    maxWidth: 200,
  },
  dualButton: {
    flex: 0,
    minWidth: 120,
    maxWidth: 140,
  },
});
