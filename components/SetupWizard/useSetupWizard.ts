import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'expo-router';
import { Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/store/auth-store';
import { useSubscriptionStore } from '@/store/subscription-store.js';
import { wizardResultsService } from '@/db/services';
import { ProgramGenerator, type WizardResponses } from '@/utils/program-generator';
import { calculateTDEEAndMacros, validateTDEEInputs } from '@/utils/tdee-calculator';
import { steps, aiGenerationSteps } from '@/constants/wizard.constants';
import { type WizardPreferences } from './types';

// Simple phase-based state machine
export type WizardPhase = 'wizard' | 'generating' | 'subscription' | 'complete';

interface UseSetupWizardProps {
    onClose: () => void;
}

export const useSetupWizard = ({ onClose }: UseSetupWizardProps) => {
    const router = useRouter();
    const { user, setWizardCompleted, hasCompletedWizard, setWizardGenerating, isWizardGenerating } = useAuthStore();

    // State
    const [phase, setPhase] = useState<WizardPhase>(isWizardGenerating ? 'generating' : 'wizard');
    const [[currentStep, direction], setStepAndDirection] = useState<[number, number]>([0, 1]);
    const [validationError, setValidationError] = useState('');
    const [scrollKey, setScrollKey] = useState(0);
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

    // Generation state
    const [generationStep, setGenerationStep] = useState('');
    const [generationProgress, setGenerationProgress] = useState(0);
    const [showCheckProgramButton, setShowCheckProgramButton] = useState(false);
    const [generatedProgramData, setGeneratedProgramData] = useState<any>(null);
    const [isNavigatingToProgram, setIsNavigatingToProgram] = useState(false);
    const [showProgramView, setShowProgramView] = useState(false);

    const [preferences, setPreferences] = useState<WizardPreferences>({
        motivation: [],
        name: '',
        squatKg: '0',
        benchKg: '0',
        deadliftKg: '0',
        trainingExperience: '6_18_months',
        age: '',
        gender: '',
        weight: '',
        height: '',
        activityLevel: '',
        goal: '',
        trainingDaysPerWeek: 4,
        preferredTrainingDays: ['monday', 'tuesday', 'thursday', 'friday'],
        musclePriorities: ['chest', 'back'],
        pumpWorkPreference: 'maybe_sometimes',
        recoveryProfile: 'need_more_rest',
        programDurationWeeks: 12
    });

    // --- Helper Functions ---
    const getActivityLevelFromTrainingDays = (trainingDays: number): string => {
        if (trainingDays <= 3) return 'lightly_active';
        if (trainingDays <= 5) return 'moderately_active';
        return 'very_active';
    };

    const handleInputChange = (field: keyof WizardPreferences, value: any) => {
        setPreferences(prev => ({ ...prev, [field]: value }));
        setValidationError('');
    };

    const toggleMotivation = (motivationId: string) => {
        const current = preferences.motivation;
        const isSelected = current.includes(motivationId);
        if (isSelected) {
            handleInputChange('motivation', current.filter(m => m !== motivationId));
        } else {
            handleInputChange('motivation', [...current, motivationId]);
        }
    };

    const toggleMusclePriority = (muscle: string) => {
        const current = preferences.musclePriorities;
        const isSelected = current.includes(muscle);
        if (isSelected) {
            handleInputChange('musclePriorities', current.filter(m => m !== muscle));
        } else {
            if (current.length < 3) {
                handleInputChange('musclePriorities', [...current, muscle]);
            } else if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
        }
    };

    // --- Effects ---

    // Initialization Effect
    useEffect(() => {
        const initializePhase = async () => {
            if (isWizardGenerating) {
                setPhase('generating');
                setGenerationStep('Finalizing your program...');

                // Resume animation
                const animateResume = async () => {
                    const steps = 60;
                    const duration = 2000;
                    const stepTime = duration / steps;
                    for (let i = 0; i <= steps; i++) {
                        const ratio = i / steps;
                        const progress = 0.9 * (1 - Math.pow(1 - ratio, 2));
                        setGenerationProgress(progress);
                        await new Promise(resolve => setTimeout(resolve, stepTime));
                    }
                };
                animateResume().catch(() => { });
                return;
            }

            if (hasCompletedWizard) {
                setPhase('complete');
                return;
            }

            if (!user?.id) {
                setPhase('wizard');
                return;
            }

            try {
                const wizardResults = await wizardResultsService.getByUserId(user.id) as any;
                if (wizardResults?.generatedSplit) {
                    const programData = typeof wizardResults.generatedSplit === 'string'
                        ? JSON.parse(wizardResults.generatedSplit)
                        : wizardResults.generatedSplit;
                    setGeneratedProgramData(programData);
                    setPhase('subscription');
                } else {
                    setPhase(isWizardGenerating ? 'generating' : 'wizard');
                }
            } catch (error) {
                setPhase(isWizardGenerating ? 'generating' : 'wizard');
            }
        };

        initializePhase();
    }, []);

    // Polling Effect
    useEffect(() => {
        const checkCompletion = async () => {
            if (!isWizardGenerating && phase === 'generating') {
                let currentUserId = user?.id;

                if (!currentUserId) {
                    // Basic polling logic for user ID simplified for hook
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const currentUser = useAuthStore.getState().user;
                    if (currentUser?.id) currentUserId = currentUser.id;
                }

                if (currentUserId) {
                    try {
                        // Give DB a moment
                        await new Promise(resolve => setTimeout(resolve, 500));
                        let wizardResults = null;
                        let retries = 0;
                        while (!wizardResults && retries < 20) {
                            try {
                                const results = await wizardResultsService.getByUserId(currentUserId) as any;
                                if (results?.generatedSplit) {
                                    wizardResults = results;
                                    break;
                                }
                            } catch (e) { }
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            retries++;
                        }

                        if (wizardResults?.generatedSplit) {
                            const programData = typeof (wizardResults as any).generatedSplit === 'string'
                                ? JSON.parse((wizardResults as any).generatedSplit)
                                : (wizardResults as any).generatedSplit;
                            setGeneratedProgramData(programData);
                            setPhase('subscription');
                            setStepAndDirection([0, 0]);
                        } else {
                            setPhase('wizard');
                            Alert.alert('Error', 'Program generation failed. Please try again.');
                        }
                    } catch (e) {
                        setPhase('wizard');
                    }
                }
            }
        };

        checkCompletion();
    }, [isWizardGenerating, phase, user?.id]);

    // Validation
    const validateCurrentStep = (): boolean => {
        setValidationError('');
        if (currentStep < 0 || currentStep >= steps.length) {
            setStepAndDirection([0, 0]);
            return false;
        }

        const step = steps[currentStep];
        if (!step) return false;

        switch (step.id) {
            case 'welcome': return true;
            case 'motivation':
                if (preferences.motivation.length === 0) {
                    setValidationError('Please select at least one motivation');
                    return false;
                }
                return true;
            case 'name':
                if (!preferences.name.trim()) {
                    setValidationError('Please enter your name');
                    return false;
                }
                if (preferences.name.length > 25) {
                    setValidationError('Name must be 25 characters or less');
                    return false;
                }
                return true;
            case 'current-strength':
                const squat = parseFloat(preferences.squatKg) || 0;
                const bench = parseFloat(preferences.benchKg) || 0;
                const deadlift = parseFloat(preferences.deadliftKg) || 0;
                if (squat > 400) { setValidationError('Squat max: 400 kg'); return false; }
                if (bench > 300) { setValidationError('Bench max: 300 kg'); return false; }
                if (deadlift > 400) { setValidationError('Deadlift max: 400 kg'); return false; }
                return true;
            case 'training-experience':
                if (!preferences.trainingExperience) {
                    setValidationError('Please select your experience');
                    return false;
                }
                return true;
            case 'tdee-calculation':
                const errors: Record<string, boolean> = {};
                let hasError = false;
                const age = preferences.age ? parseInt(preferences.age) : undefined;
                if (!age || age < 16 || age > 100) { errors.age = true; hasError = true; }
                if (!preferences.gender) { errors.gender = true; hasError = true; }
                const weight = preferences.weight ? parseFloat(preferences.weight) : undefined;
                if (!weight || weight < 30 || weight > 300) { errors.weight = true; hasError = true; }
                const height = preferences.height ? parseFloat(preferences.height) : undefined;
                if (!height || height < 120 || height > 250) { errors.height = true; hasError = true; }
                if (!preferences.goal) { errors.goal = true; hasError = true; }
                if (!preferences.trainingDaysPerWeek) { errors.trainingDays = true; hasError = true; }

                setFieldErrors(errors);

                if (hasError) {
                    if (!preferences.trainingDaysPerWeek) {
                        setValidationError('Please select how many days you can train');
                    } else {
                        setValidationError('Please check your inputs');
                    }
                    return false;
                }
                return true;
            case 'muscle-priorities':
                if (preferences.musclePriorities.length === 0) {
                    setValidationError('Select at least 1 muscle group');
                    return false;
                }
                if (preferences.musclePriorities.length > 3) {
                    const fixed = preferences.musclePriorities.slice(0, 3);
                    handleInputChange('musclePriorities', fixed);
                    setValidationError('Max 3 muscle groups - adjusted');
                    return false;
                }
                return true;
            case 'pump-work':
                if (!preferences.pumpWorkPreference) {
                    setValidationError('Select preference');
                    return false;
                }
                return true;
            case 'program-duration':
                if (!preferences.programDurationWeeks) {
                    setValidationError('Select duration');
                    return false;
                }
                return true;
            default: return true;
        }
    };

    const paginate = (newDirection: number) => {
        const newStep = currentStep + newDirection;
        if (newStep >= 0 && newStep < steps.length) {
            setStepAndDirection([newStep, newDirection]);
            setValidationError('');
            setScrollKey(prev => prev + 1);
        }
    };

    const handleNext = () => {
        if (!validateCurrentStep()) {
            setScrollKey(prev => prev + 1);
            return;
        }
        if (currentStep < steps.length - 1) {
            paginate(1);
        } else {
            handleComplete();
        }
    };

    const simulateAIGeneration = async () => {
        const totalSteps = aiGenerationSteps.length;
        for (let i = 0; i < aiGenerationSteps.length; i++) {
            const step = aiGenerationSteps[i];
            setGenerationStep(step.text);
            setGenerationProgress((i + 1) / totalSteps);
            await new Promise(resolve => setTimeout(resolve, step.duration));
        }
    };

    const handleComplete = async () => {
        try {
            useAuthStore.getState().setWizardGenerating(true);
            setGeneratedProgramData(null);
            setPhase('generating');
            setGenerationStep('Initializing...');
            setGenerationProgress(0);

            let currentUser = user;
            if (!currentUser || !currentUser.id) {
                const { setupNewUser } = useAuthStore.getState();
                const result = await setupNewUser(preferences.name);
                if (!result.success) throw new Error(result.error);
                currentUser = useAuthStore.getState().user;
            }

            await simulateAIGeneration();

            const wizardResponses: WizardResponses = {
                trainingExperience: preferences.trainingExperience as any,
                bodyFatLevel: 'athletic_15_18' as any,
                trainingDaysPerWeek: preferences.trainingDaysPerWeek,
                musclePriorities: preferences.musclePriorities,
                pumpWorkPreference: preferences.pumpWorkPreference as any,
                recoveryProfile: preferences.recoveryProfile as any,
                programDurationWeeks: preferences.programDurationWeeks,
                preferredTrainingDays: preferences.preferredTrainingDays
            };

            const generatedProgram = ProgramGenerator.generateProgram(wizardResponses);

            if (currentUser && currentUser.id) {
                let tdeeData = null;
                try {
                    if (preferences.age && preferences.gender && preferences.weight && preferences.height && preferences.trainingDaysPerWeek && preferences.goal) {
                        const activityLevel = getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek);
                        tdeeData = calculateTDEEAndMacros({
                            age: parseInt(preferences.age),
                            gender: preferences.gender as 'male' | 'female',
                            weight: parseFloat(preferences.weight),
                            height: parseFloat(preferences.height),
                            activityLevel: activityLevel,
                            goal: preferences.goal
                        });
                    }
                } catch (e) { }

                await wizardResultsService.create({
                    userId: currentUser.id,
                    motivation: JSON.stringify(preferences.motivation),
                    trainingExperience: preferences.trainingExperience,
                    bodyFatLevel: 'athletic_15_18',
                    trainingDaysPerWeek: preferences.trainingDaysPerWeek,
                    preferredTrainingDays: JSON.stringify(preferences.preferredTrainingDays),
                    musclePriorities: JSON.stringify(preferences.musclePriorities),
                    pumpWorkPreference: preferences.pumpWorkPreference,
                    recoveryProfile: preferences.recoveryProfile,
                    programDurationWeeks: preferences.programDurationWeeks,
                    generatedSplit: JSON.stringify(generatedProgram),
                    suggestedPrograms: JSON.stringify([generatedProgram.programName]),
                    squatKg: parseFloat(preferences.squatKg) || 0,
                    benchKg: parseFloat(preferences.benchKg) || 0,
                    deadliftKg: parseFloat(preferences.deadliftKg) || 0,
                    tdeeData: tdeeData ? JSON.stringify(tdeeData) : null,
                    age: preferences.age ? parseInt(preferences.age) : null,
                    gender: preferences.gender || null,
                    weight: preferences.weight ? parseFloat(preferences.weight) : null,
                    height: preferences.height ? parseFloat(preferences.height) : null,
                    activityLevel: preferences.trainingDaysPerWeek ? getActivityLevelFromTrainingDays(preferences.trainingDaysPerWeek) : null,
                    goal: preferences.goal || null,
                } as any);
            }

            setGeneratedProgramData(generatedProgram);
            setPhase('subscription');
            setStepAndDirection([0, 0]);
            useAuthStore.getState().setWizardGenerating(false);

        } catch (error: any) {
            useAuthStore.getState().setWizardGenerating(false);
            setPhase('wizard');
            const msg = error?.message || 'Unknown error';
            Alert.alert('Error', msg);
        }
    };

    const handleSubscriptionComplete = async () => {
        setWizardCompleted();
        setPhase('complete');
        const { refreshSubscriptionStatus } = useSubscriptionStore.getState();
        await refreshSubscriptionStatus();
        router.replace('/(tabs)/home' as any);
        onClose();
    };

    const handleSubscriptionSkip = async () => {
        setWizardCompleted();
        setPhase('complete');
        router.replace('/(tabs)' as any);
        onClose();
    };

    return {
        phase,
        setPhase,
        currentStep,
        direction,
        preferences,
        validationError,
        scrollKey,
        fieldErrors,
        setFieldErrors,
        generationStep,
        generationProgress,
        showCheckProgramButton,
        setShowCheckProgramButton,
        generatedProgramData,
        showProgramView,
        setShowProgramView,
        isNavigatingToProgram,

        // Handlers
        handleNext,
        paginate,
        handleInputChange,
        toggleMotivation,
        toggleMusclePriority,
        handleSubscriptionComplete,
        handleSubscriptionSkip,
        setWizardCompleted, // Exposed for direct access if needed

        // Helper access
        getActivityLevelFromTrainingDays,
        calculateTDEEAndMacros, // Exposed for UI rendering
    };
};