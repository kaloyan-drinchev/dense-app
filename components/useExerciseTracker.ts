import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Exercise, ExerciseSet } from '@/types/workout';
import { useWorkoutStore } from '@/store/workout-store';
import { useAuthStore } from '@/store/auth-store';
import { useWorkoutCacheStore } from '@/store/workout-cache-store';
import { userProgressService, activeWorkoutSessionService } from '@/db/services';
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
        if (!user?.id) return;
        if (exerciseKey.startsWith('manual-')) {
            setExerciseLogs({});
            setExercisePRs({});
            setBeatLastSuggestions([]);
            setIsPRDataLoaded(true);
            return;
        }

        try {
            const cache = useWorkoutCacheStore.getState();
            let progress = cache.userProgressData;

            if (!progress || !cache.isCacheValid()) {
                progress = await userProgressService.getByUserId(user.id);
            }

            if (progress?.weeklyWeights) {
                const weeklyWeights = typeof progress.weeklyWeights === 'string'
                    ? JSON.parse(progress.weeklyWeights)
                    : progress.weeklyWeights;
                const logs = weeklyWeights?.exerciseLogs || {};

                setExerciseLogs(logs);
                const currentExerciseLogs = logs[exerciseKey] || [];
                const singleExerciseLog: ExerciseLogs = { [exerciseKey]: currentExerciseLogs };
                const currentExercisePRs = analyzeExercisePRs(singleExerciseLog);
                setExercisePRs(currentExercisePRs);
                const suggestions = getBeatLastWorkoutSuggestions(exerciseKey, currentExercisePRs);
                setBeatLastSuggestions(suggestions);
            }
            setIsPRDataLoaded(true);
        } catch (error) {
            console.error('Failed to load PR data:', error);
            setIsPRDataLoaded(true);
        }
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

        if (!user?.id || !exerciseKey) {
            setIsLoadingSets(false);
            return;
        }

        try {
            const activeSession = await activeWorkoutSessionService.getActive(user.id);
            if (activeSession?.session_data?.exercises?.[exerciseKey]) {
                const exerciseData = activeSession.session_data.exercises[exerciseKey];
                const activeSets = exerciseData.sets || [];

                if (activeSets.length > 0) {
                    setUnit('kg');
                    const limitedSets = activeSets.slice(0, MAX_SETS);
                    const hydrated: ExerciseSet[] = limitedSets.map((s: any) => ({
                        id: generateId(),
                        reps: s.reps || 0,
                        weight: s.weightKg || 0,
                        isCompleted: !!s.isCompleted
                    }));
                    setSets(hydrated);
                    setIsLoadingSets(false);
                    return;
                }
            }
            setIsLoadingSets(false);
        } catch (e) {
            console.error('❌ Error loading session:', e);
            setIsLoadingSets(false);
        }
    };

    const handleSaveSession = async () => {
        if (readOnly || !user?.id) return;
        if (isSavingRef.current) {
            pendingSaveRef.current = true;
            return;
        }
        isSavingRef.current = true;
        setSaveStatus('saving');
        const payload = {
            unit,
            sets: sets.map((s, idx) => ({
                setNumber: idx + 1,
                weightKg: s.weight ?? 0,
                reps: s.reps ?? 0,
                isCompleted: !!s.isCompleted,
            })),
        };
        try {
            await userProgressService.upsertTodayExerciseSession(user.id, exerciseKey, payload);
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

        setSets(prev => prev.map(set => set.id === setId ? { ...set, weight: numWeight } : set));
        updateExerciseSet(exerciseKey, setId, { weight: numWeight });
        hasUserEditedRef.current = true;
        scheduleAutoSave();
    };

    const handleRepsChange = (setId: string, reps: string) => {
        if (readOnly) return;
        const rawReps = parseInt(reps) || 0;
        const numReps = Math.max(0, Math.min(MAX_REPS, rawReps));

        setSets(prev => prev.map(set => set.id === setId ? { ...set, reps: numReps } : set));
        updateExerciseSet(exerciseKey, setId, { reps: numReps });
        hasUserEditedRef.current = true;
        scheduleAutoSave();
    };

    const handleToggleSetComplete = (setId: string) => {
        if (readOnly || isExerciseFinalized) return;
        hasUserEditedRef.current = true;

        const set = sets.find((s) => s.id === setId);
        if (!set) return;

        const newCompleted = !set.isCompleted;
        setSets(prev => prev.map(s => s.id === setId ? { ...s, isCompleted: newCompleted } : s));
        updateExerciseSet(exerciseKey, setId, { isCompleted: newCompleted });

        if (newCompleted && set.weight > 0 && set.reps > 0) {
            startRestTimer();
        } else if (!newCompleted) {
            if (restTimerRef.current) {
                clearInterval(restTimerRef.current);
                restTimerRef.current = null;
            }
            setRestTimerActive(false);
        }
        scheduleAutoSave();
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
        if (!user?.id) {
            console.error('❌ No user ID available');
            return;
        }

        setIsCompletingExercise(true);

        const updatedSets = sets.map((set) => ({
            ...set,
            reps: set.reps > 0 ? set.reps : 1,
            weight: set.weight > 0 ? set.weight : 0,
        }));

        setSets(updatedSets);

        const payload = {
            unit,
            sets: updatedSets.map((s, idx) => ({
                setNumber: idx + 1,
                weightKg: s.weight ?? 0,
                reps: s.reps ?? 0,
                isCompleted: s.isCompleted,
            })),
        };

        const today = new Date().toISOString().slice(0, 10);
        const isManualExercise = exerciseKey.startsWith('manual-');

        // --- MANUAL EXERCISE FLOW ---
        if (isManualExercise) {
            try {
                await userProgressService.upsertTodayExerciseSession(user.id, exerciseKey, payload);
                const freshProgress = await userProgressService.getByUserId(user.id);
                if (freshProgress) {
                    useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: freshProgress });
                }

                // Update new DB
                try {
                    const { workoutSessionService } = await import('@/db/services');
                    const activeSession = await workoutSessionService.getActiveSession(user.id);
                    if (activeSession) {
                        const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
                        const exerciseData = sessionData?.exercises.find((ex: any) => ex.exercise_id === exerciseKey);
                        if (exerciseData) {
                            for (const dbSet of exerciseData.sets || []) {
                                const localSet = sets.find((s) => s.id === dbSet.id);
                                if (localSet && localSet.isCompleted) {
                                    await workoutSessionService.updateSet(dbSet.id, {
                                        is_completed: true,
                                        weight_kg: localSet.weight || 0,
                                        reps: localSet.reps || 0,
                                    });
                                }
                            }
                        }
                    }
                } catch (err) {
                    console.warn('⚠️ Failed to update new database system:', err);
                }

                setIsExerciseFinalized(true);
                router.back();
                return;
            } catch (error) {
                console.error('❌ Failed to save manual exercise:', error);
                Alert.alert('Error', 'Failed to save exercise progress');
                setIsCompletingExercise(false);
                return;
            }
        }

        // --- NORMAL WORKOUT FLOW ---
        const currentProgress = useWorkoutCacheStore.getState().userProgressData;
        let originalProgress: any = null;

        if (currentProgress) {
            originalProgress = JSON.parse(JSON.stringify(currentProgress));
            let weeklyWeights = currentProgress.weeklyWeights;
            if (typeof weeklyWeights === 'string') weeklyWeights = JSON.parse(weeklyWeights);
            weeklyWeights = JSON.parse(JSON.stringify(weeklyWeights || {}));

            if (!weeklyWeights.exerciseLogs) weeklyWeights.exerciseLogs = {};
            if (!weeklyWeights.exerciseLogs[exerciseKey]) weeklyWeights.exerciseLogs[exerciseKey] = [];

            const sessions = weeklyWeights.exerciseLogs[exerciseKey];
            const todaySessionIndex = sessions.findIndex((s: any) => s.date === today);

            const completedSession = { date: today, unit: payload.unit, sets: payload.sets };

            if (todaySessionIndex >= 0) {
                sessions[todaySessionIndex] = completedSession;
            } else {
                sessions.push(completedSession);
            }

            const optimisticProgress = { ...currentProgress, weeklyWeights: weeklyWeights };
            useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: optimisticProgress });
        }

        try {
            let session = await activeWorkoutSessionService.getActive(user.id);
            if (!session) {
                const workoutType = currentProgress?.currentWorkout || 'push-a';
                session = await activeWorkoutSessionService.create(user.id, workoutType, exercise.name);
            }

            const sessionData = session.session_data || { exercises: {}, startTime: new Date().toISOString(), lastUpdated: new Date().toISOString() };
            if (!sessionData.exercises) sessionData.exercises = {};

            sessionData.exercises[exerciseKey] = { completed: true, sets: payload.sets };
            await activeWorkoutSessionService.updateSessionData(session.id, sessionData);

            // Update new DB
            try {
                const { workoutSessionService } = await import('@/db/services');
                const activeSession = await workoutSessionService.getActiveSession(user.id);
                if (activeSession) {
                    const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
                    const exerciseData = sessionData?.exercises.find((ex: any) => ex.exercise_id === exerciseKey);
                    if (exerciseData) {
                        for (const dbSet of exerciseData.sets || []) {
                            const localSet = sets.find((s) => s.id === dbSet.id);
                            if (localSet && localSet.isCompleted) {
                                await workoutSessionService.updateSet(dbSet.id, {
                                    is_completed: true,
                                    weight_kg: localSet.weight || 0,
                                    reps: localSet.reps || 0,
                                });
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('⚠️ Failed to update new database system:', err);
            }

            setIsExerciseFinalized(true);

            // Optimistic cache update for navigation
            try {
                const { workoutSessionService } = await import('@/db/services');
                const activeSession = await workoutSessionService.getActiveSession(user.id);
                if (activeSession) {
                    const sessionData = await workoutSessionService.getSessionWithExercises(activeSession.id);
                    if (sessionData?.exercises) {
                        const exerciseIndex = sessionData.exercises.findIndex((ex: any) => ex.exercise_id === exerciseKey);
                        if (exerciseIndex !== -1) {
                            sessionData.exercises[exerciseIndex].status = 'COMPLETED';
                            if (typeof window !== 'undefined') {
                                (window as any).__optimisticSessionUpdate = sessionData;
                            }
                        }
                    }
                }
            } catch (err) {
                console.warn('⚠️ Failed to create optimistic update:', err);
            }

            router.back();

        } catch (e) {
            console.error('❌ Failed to complete exercise:', e);
            if (originalProgress) {
                useWorkoutCacheStore.getState().setWorkoutData({ userProgressData: originalProgress });
            }
            setSets(prev => prev.map(s => ({ ...s, isCompleted: false })));
            setIsCompletingExercise(false);
            Alert.alert('Failed to Save', 'Please check your connection and try again.');
        }
    };

    const handleCompleteRequest = () => {
        const allSetsChecked = sets.some(s => s.isCompleted && s.weight > 0 && s.reps > 0);
        if (readOnly || isExerciseFinalized || !allSetsChecked) return;

        const completedSets = sets.filter(s => s.isCompleted).length;
        const totalSets = sets.length;
        const percentage = totalSets > 0 ? Math.round((completedSets / totalSets) * 100) : 0;

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
    }, [user?.id, exerciseKey, presetSession?.unit, JSON.stringify(presetSession?.sets)]);

    useFocusEffect(
        useCallback(() => {
            if (!readOnly) {
                setIsLoadingSets(true);
                loadSessionData();
            }
        }, [user?.id, exerciseKey, readOnly])
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
    }, [registerSave, unit, sets, readOnly]);

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