import { useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/auth-store';
import { wizardResultsService } from '@/db/services';

export const useMyGoalsLogic = () => {
  const router = useRouter();
  const { user } = useAuthStore();
  const [wizardData, setWizardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadWizardData = async () => {
      try {
        if (user?.id) {
          const data = await wizardResultsService.getByUserId(user.id);
          console.log('🎯 Loaded wizard data:', data);
          console.log('🏋️ Big 3 Stats:', {
            squatKg: data?.squatKg,
            benchKg: data?.benchKg,
            deadliftKg: data?.deadliftKg
          });
          setWizardData(data);
        }
      } catch (error) {
        console.log('Failed to load wizard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadWizardData();
  }, [user?.id]);

  const parseTdeeData = (tdeeDataString: string | null) => {
    if (!tdeeDataString) return null;
    try {
      const parsed = JSON.parse(tdeeDataString);
      
      // Handle both 'calories' and 'adjustedCalories' field names
      const calories = parsed.calories || parsed.adjustedCalories;
      return {
        calories: isNaN(Number(calories)) ? 0 : Number(calories),
        protein: isNaN(Number(parsed.protein)) ? 0 : Number(parsed.protein),
        carbs: isNaN(Number(parsed.carbs)) ? 0 : Number(parsed.carbs),
        fat: isNaN(Number(parsed.fat)) ? 0 : Number(parsed.fat),
        bmr: isNaN(Number(parsed.bmr)) ? 0 : Number(parsed.bmr),
        tdee: isNaN(Number(parsed.tdee)) ? 0 : Number(parsed.tdee)
      };
    } catch (error) {
      console.error('❌ Error parsing TDEE data:', error);
      return null;
    }
  };

  const parseMotivation = (motivationString: string | null) => {
    if (!motivationString) return [];
    try {
      return JSON.parse(motivationString);
    } catch {
      return [];
    }
  };

  const parseMusclePriorities = (prioritiesString: string | null) => {
    if (!prioritiesString) return [];
    try {
      return JSON.parse(prioritiesString);
    } catch {
      return [];
    }
  };

  // Derived state
  const tdeeData = wizardData ? parseTdeeData(wizardData.tdeeData) : null;
  const motivations = wizardData ? parseMotivation(wizardData.motivation) : [];
  const musclePriorities = wizardData ? parseMusclePriorities(wizardData.musclePriorities) : [];

  const handleBack = () => {
    router.back();
  };

  return {
    isLoading,
    wizardData,
    tdeeData,
    motivations,
    musclePriorities,
    handleBack
  };
};