import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Exercise, ExerciseSet } from '@/types/workout';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useActiveWorkout } from '@/context/ActiveWorkoutContext';
import { generateId } from '@/utils/helpers';
import {
    analyzeExercisePRs,
    getBeatLastWorkoutSuggestions,
    type ExerciseLogs,
    type ExercisePRs,
    type PersonalRecord
} from '@/utils/pr-tracking';

interface UseExerciseTrackerProps {
    exercise: Exercise;
    exerciseKey: string;
    readOnly?: boolean;
    presetSession?: {
        unit: 'kg' | 'lb';
        sets: Array<{ setNumber: number; weightKg: number; reps: number; isCompleted: boolean }>;
    };
    registerSave?: (fn: () => Promise<void>) => void;
    onCompleteStateChange?: (state: any) => void;
}

export const useExerciseTracker = ({
    exercise,
    exerciseKey,
    readOnly = false,
    presetSession,
    registerSave,
    onCompleteStateChange,
}: UseExerciseTrackerProps) => {
    const router = useRouter();
    const { updateExerciseSet } = useWorkoutStore();
    const { user } = useAuthStore();
    const {
        sessionId,
        exercises: sessionExercises,
        updateSetCompletion,
        updateExerciseStatus,
        refreshSession,
        getExerciseById
    } = useActiveWorkout();

    // Constants
    const MAX_SETS = 8;
    const MIN_SETS = 1;
    const MAX_WEIGHT_KG = 300;
    const MAX_REPS = 50;

    // State
    const [unit, setUnit] = useState<'kg' | 'lb'>('kg');
    const initialCount = Math.min(
        Math.max(typeof exercise.sets === 'number' ? exercise.sets : MIN_SETS, MIN_SETS),
        MAX_SETS
    );

    const [sets, setSets] = useState<ExerciseSet[]>(
        exercise.userSets ||
        Array.from({ length: initialCount }, () => ({
            id: generateId(),
            reps: 10,
            weight: 10,
            isCompleted: false,
        }))
    );

    const [isLoadingSets, setIsLoadingSets] = useState(!presetSession);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [completionData, setCompletionData] = useState<{ percentage: number, completed: number, total: number } | null>(null);
    const [isCompletingExercise, setIsCompletingExercise] = useState(false);

    // PR State
    const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogs>({});
    const [exercisePRs, setExercisePRs] = useState<ExercisePRs>({});
    const [beatLastSuggestions, setBeatLastSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [isPRDataLoaded, setIsPRDataLoaded] = useState(false);
    const [achievedPRs, setAchievedPRs] = useState<PersonalRecord[]>([]);

    // Timer State
    const [restTimerActive, setRestTimerActive] = useState(false);
    const [restTimeRemaining, setRestTimeRemaining] = useState(90);
    const [isExerciseFinalized, setIsExerciseFinalized] = useState(false);

    // Refs
    const restTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const hasUserEditedRef = useRef(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isSavingRef = useRef(false);
    const pendingSaveRef = useRef(false);

    // --- Helpers ---

    const toDisplayWeight = (weightKg: number): string => {
        if (unit === 'kg') return (Math.round(weightKg * 10) / 10).toString();
        const lb = weightKg * 2.2046226218;
        return (Math.round(lb * 10) / 10).toString();
    };

    const fromDisplayWeightToKg = (value: string): number => {
        const n = parseFloat(value);
        if (!isFinite(n)) return 0;
        if (unit === 'kg') return n;
        return n / 2.2046226218;
    };

    const formatRestTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Logic Functions ---

    const startRestTimer = () => {
        if (restTimerRef.current) clearInterval(restTimerRef.current);
        setRestTimeRemaining(90);
        setRestTimerActive(true);

        restTimerRef.current = setInterval(() => {
            setRestTimeRemaining((prev) => {
                if (prev <= 1) {
                    if (restTimerRef.current) {
                        clearInterval(restTimerRef.current);
                        restTimerRef.current = null;
                    }
                    setRestTimerActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const loadPRData = async () => {
        // TODO: Implement PR tracking from workout_sessions history
        // For now, disable PR suggestions until we migrate the PR system
        setExerciseLogs({});
        setExercisePRs({});
        setBeatLastSuggestions([]);
        setIsPRDataLoaded(true);
    };

    const loadSessionData = async () => {
        if (presetSession) {
            const limitedSets = presetSession.sets.slice(0, MAX_SETS);
            const hydrated: ExerciseSet[] = (limitedSets.length > 0
                ? limitedSets
                : Array.from({ length: MIN_SETS }, () => ({ reps: 0, weightKg: 0, isCompleted: false }))
            ).map((s) => ({ id: generateId(), reps: s.reps, weight: s.weightKg, isCompleted: !!s.isCompleted }));
            setUnit(presetSession.unit || 'kg');
            setSets(hydrated);
            setIsLoadingSets(false);
            return;
        }

        if (exerciseKey.startsWith('manual-')) {
            setIsLoadingSets(false);
            return;
        }

        if (!user?.id || !exerciseKey || !sessionId) {
            setIsLoadingSets(false);
            return;
        }

        try {
            // Get exercise data from NEW system (session_exercises + session_sets)
            const exerciseData = getExerciseById(exerciseKey);

            if (exerciseData && exerciseData.sets && exerciseData.sets.length > 0) {
                setUnit('kg');
                const limitedSets = exerciseData.sets.slice(0, MAX_SETS);
                const hydrated: ExerciseSet[] = limitedSets.map((s: any) => ({
                    id: s.id || generateId(),
                    reps: s.reps || 10,
                    weight: s.weight_kg || 10,
                    isCompleted: !!s.is_completed
                }));
                setSets(hydrated);

                // Check if exercise is already completed
                if (exerciseData.status === 'COMPLETED') {
                    setIsExerciseFinalized(true);
                }
            }
            setIsLoadingSets(false);
        } catch (e) {
            console.error('❌ Error loading session:', e);
            setIsLoadingSets(false);
        }
    };

    const handleSaveSession = async () => {
        if (readOnly || !user?.id || !sessionId) return;
        if (isSavingRef.current) {
            pendingSaveRef.current = true;
            return;
        }
        isSavingRef.current = true;
        setSaveStatus('saving');

        try {
            // Save all sets to NEW system using updateSetCompletion
            const exerciseData = getExerciseById(exerciseKey);
            if (exerciseData && exerciseData.sets) {
                for (let i = 0; i < sets.length && i < exerciseData.sets.length; i++) {
                    const localSet = sets[i];
                    const dbSet = exerciseData.sets[i];

                    // Only update if changed
                    if (
                        dbSet.weight_kg !== localSet.weight ||
                        dbSet.reps !== localSet.reps ||
                        dbSet.is_completed !== localSet.isCompleted
                    ) {
                        updateSetCompletion(
                            dbSet.id,
                            localSet.isCompleted,
                            localSet.weight,
                            localSet.reps
                        );
                    }
                }
            }
            setSaveStatus('saved');
        } catch (e) {
            console.error(`❌ Failed to save ${exerciseKey}:`, e);
            setSaveStatus('error');
            await loadSessionData().catch(() => { });
        } finally {
            isSavingRef.current = false;
            if (pendingSaveRef.current) {
                pendingSaveRef.current = false;
                handleSaveSession();
            }
        }
    };

    const scheduleAutoSave = () => {
        if (!hasUserEditedRef.current) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            handleSaveSession();
        }, 250);
    };

    // --- Handlers ---

    const handleWeightChange = (setId: string, weight: string) => {
        if (readOnly) return;
        const rawWeight = fromDisplayWeightToKg(weight);
        const numWeight = Math.max(0, Math.min(MAX_WEIGHT_KG, rawWeight));

        const set = sets.find(s => s.id === setId);
        if (!set) return;

        // Update local state
        setSets(prev => prev.map(s => s.id === setId ? { ...s, weight: numWeight } : s));
        updateExerciseSet(exerciseKey, setId, { weight: numWeight });

        // Save to database immediately
        updateSetCompletion(setId, set.isCompleted, numWeight, set.reps);
        hasUserEditedRef.current = true;
    };

    const handleRepsChange = (setId: string, reps: string) => {
        if (readOnly) return;
        const rawReps = parseInt(reps) || 0;
        const numReps = Math.max(0, Math.min(MAX_REPS, rawReps));

        const set = sets.find(s => s.id === setId);
        if (!set) return;

        // Update local state
        setSets(prev => prev.map(s => s.id === setId ? { ...s, reps: numReps } : s));
        updateExerciseSet(exerciseKey, setId, { reps: numReps });

        // Save to database immediately
        updateSetCompletion(setId, set.isCompleted, set.weight, numReps);
        hasUserEditedRef.current = true;
    };

    const handleToggleSetComplete = (setId: string) => {
        if (readOnly || isExerciseFinalized) return;
        hasUserEditedRef.current = true;

        const set = sets.find((s) => s.id === setId);
        if (!set) return;

        const newCompleted = !set.isCompleted;

        // Update local state immediately
        setSets(prev => prev.map(s => s.id === setId ? { ...s, isCompleted: newCompleted } : s));
        updateExerciseSet(exerciseKey, setId, { isCompleted: newCompleted });

        // Update database immediately via context
        updateSetCompletion(setId, newCompleted, set.weight, set.reps);

        if (newCompleted && set.weight > 0 && set.reps > 0) {
            startRestTimer();
        } else if (!newCompleted) {
            if (restTimerRef.current) {
                clearInterval(restTimerRef.current);
                restTimerRef.current = null;
            }
            setRestTimerActive(false);
        }
    };

    const handleAdjustWeight = (setId: string, deltaDisplayUnits: number) => {
        const set = sets.find((s) => s.id === setId);
        if (!set) return;
        const currentDisplay = parseFloat(toDisplayWeight(set.weight)) || 0;
        const nextDisplay = Math.max(0, Math.min(MAX_WEIGHT_KG, currentDisplay + deltaDisplayUnits));
        handleWeightChange(setId, nextDisplay.toString());
    };

    const handleAdjustReps = (setId: string, delta: number) => {
        const set = sets.find((s) => s.id === setId);
        if (!set) return;
        const next = Math.max(0, Math.min(MAX_REPS, (set.reps || 0) + delta));
        handleRepsChange(setId, next.toString());
    };

    const handleAddSet = () => {
        if (readOnly) return;
        setSets((prev) => {
            if (prev.length >= MAX_SETS) return prev;
            const next = [...prev, { id: generateId(), reps: 10, weight: 10, isCompleted: false }];
            hasUserEditedRef.current = true;
            scheduleAutoSave();
            return next;
        });
    };

    const handleRemoveSet = (setId?: string) => {
        if (readOnly) return;
        setSets((prev) => {
            if (prev.length <= MIN_SETS) return prev;
            let next;
            if (setId) {
                const filtered = prev.filter((s) => s.id !== setId);
                next = filtered.length >= MIN_SETS ? filtered : prev;
            } else {
                next = prev.slice(0, -1);
            }
            if (next !== prev) {
                hasUserEditedRef.current = true;
                scheduleAutoSave();
            }
            return next;
        });
    };

    const completeExercise = async () => {
        if (!user?.id || !sessionId) {
            console.error('❌ No user ID or session ID available');
            Alert.alert('Error', 'No active workout session found');
            return;
        }

        setIsCompletingExercise(true);

        try {
            // Step 1: Get current exercise data from context
            const exerciseData = getExerciseById(exerciseKey);
            if (!exerciseData) {
                throw new Error('Exercise not found in session');
            }

            // Step 2: Update React state IMMEDIATELY (optimistic UI)
            console.log(`✅ Completing exercise: ${exerciseKey}`);

            // Step 3: Update all sets in memory + DB (optimistic)
            // Do this first, as it will trigger the DB trigger
            const setUpdatePromises: Promise<void>[] = [];
            for (let i = 0; i < sets.length && i < exerciseData.sets.length; i++) {
                const localSet = sets[i];
                const dbSet = exerciseData.sets[i];
                updateSetCompletion(
                    dbSet.id,
                    localSet.isCompleted,
                    localSet.weight || 0,
                    localSet.reps || 0
                );
            }

            // Step 4: Wait a moment for set updates to process (so DB trigger fires first)
            await new Promise(resolve => setTimeout(resolve, 50));

            // Step 5: Mark exercise as COMPLETED in React state + DB (this is the FINAL status)
            // This MUST come AFTER set updates, so it overrides the DB trigger's automatic status calculation
            console.log(`📝 Marking exercise ${exerciseKey} as COMPLETED (final override)`);
            await updateExerciseStatus(exerciseKey, 'COMPLETED');

            // Step 6: Mark exercise as finalized in local component state
            setIsExerciseFinalized(true);

            // Step 7: Navigate back IMMEDIATELY - UI already updated!
            console.log(`✅ Exercise ${exerciseKey} completed - navigating back`);
            router.back();

            // Database writes happen in background - no need to wait or refresh!

        } catch (e) {
            console.error('❌ Failed to complete exercise:', e);
            setSets(prev => prev.map(s => ({ ...s, isCompleted: false })));
            setIsCompletingExercise(false);
            Alert.alert('Failed to Save', 'Please check your connection and try again.');
        }
    };

    const handleCompleteRequest = () => {
        console.log('🎯 Complete Exercise button clicked!');
        console.log('📊 Current state:', {
            readOnly,
            isExerciseFinalized,
            sessionId,
            setsCount: sets.length,
            completedSets: sets.filter(s => s.isCompleted).length
        });

        if (readOnly) {
            console.log('❌ Blocked: Exercise is read-only');
            return;
        }

        if (isExerciseFinalized) {
            console.log('❌ Blocked: Exercise already finalized');
            return;
        }

        const completedSets = sets.filter(s => s.isCompleted).length;
        const totalSets = sets.length;
        const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

        console.log('✅ Opening confirmation modal:', { completedSets, totalSets, percentage });
        setCompletionData({ percentage, completed: completedSets, total: totalSets });
        setShowConfirmModal(true);
    };

    // --- Effects ---

    useEffect(() => {
        return () => {
            if (restTimerRef.current) clearInterval(restTimerRef.current);
        };
    }, []);

    useEffect(() => {
        loadSessionData();
        loadPRData();
    }, [user?.id, exerciseKey, sessionId, presetSession?.unit, JSON.stringify(presetSession?.sets)]);

    useFocusEffect(
        useCallback(() => {
            if (!readOnly) {
                setIsLoadingSets(true);
                loadSessionData();
            }
        }, [user?.id, exerciseKey, sessionId, readOnly])
    );

    useEffect(() => {
        if (!registerSave) return;
        registerSave(async () => {
            if (debounceRef.current) {
                clearTimeout(debounceRef.current);
                debounceRef.current = null;
            }
            if (!readOnly) await handleSaveSession();
        });
    }, [registerSave, unit, sets, readOnly, user?.id, exerciseKey]);

    useFocusEffect(
        useCallback(() => {
            return () => {
                if (hasUserEditedRef.current) {
                    if (debounceRef.current) {
                        clearTimeout(debounceRef.current);
                        debounceRef.current = null;
                    }
                    handleSaveSession();
                }
            };
        }, [unit, sets])
    );

    useEffect(() => {
        if (onCompleteStateChange) {
            onCompleteStateChange({
                allCompleted: isExerciseFinalized,
                isCompleting: isCompletingExercise,
                isLoading: isLoadingSets,
                onComplete: handleCompleteRequest
            });
        }
    }, [isExerciseFinalized, isCompletingExercise, isLoadingSets, onCompleteStateChange]);

    return {
        sets,
        unit,
        setUnit,
        isLoadingSets,
        isCompletingExercise,
        isExerciseFinalized,
        saveStatus,
        showConfirmModal,
        setShowConfirmModal,
        completionData,
        beatLastSuggestions,
        showSuggestions,
        setShowSuggestions,
        isPRDataLoaded,
        restTimerActive,
        setRestTimerActive,
        restTimeRemaining,
        MAX_SETS,
        MIN_SETS,
        MAX_WEIGHT_KG,
        MAX_REPS,

        // Actions
        toDisplayWeight,
        handleWeightChange,
        handleRepsChange,
        handleAdjustWeight,
        handleAdjustReps,
        handleToggleSetComplete,
        handleAddSet,
        handleRemoveSet,
        handleCompleteRequest,
        completeExercise,
        formatRestTime,
        stopRestTimer: () => {
            if (restTimerRef.current) clearInterval(restTimerRef.current);
            setRestTimerActive(false);
        },
        setAchievedPRs, // needed for modal reset
    };
};