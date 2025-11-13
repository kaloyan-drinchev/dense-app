// Cardio Calorie Burn Calculator
// Based on MET (Metabolic Equivalent of Task) values
// Formula: Calories = MET × Weight (kg) × Duration (hours)

export interface CardioType {
  id: string;
  name: string;
  metValue: number; // MET value for moderate intensity
  description?: string;
}

export const CARDIO_TYPES: CardioType[] = [
  {
    id: 'treadmill',
    name: 'Treadmill',
    metValue: 7.0, // Running at 5 mph (8 km/h)
    description: 'Running or walking on treadmill'
  },
  {
    id: 'bicycle',
    name: 'Bicycle',
    metValue: 7.5, // Cycling at moderate pace (12-14 mph)
    description: 'Stationary or outdoor cycling'
  },
  {
    id: 'stair-master',
    name: 'Stair Master',
    metValue: 8.0, // Stair climbing machine
    description: 'Stair climbing machine'
  },
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    metValue: 7.0, // Rowing at moderate pace
    description: 'Indoor rowing machine'
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    metValue: 5.0, // Elliptical trainer moderate effort
    description: 'Elliptical trainer'
  },
  {
    id: 'jumping-rope',
    name: 'Jumping Rope',
    metValue: 11.0, // Jumping rope moderate pace
    description: 'Jump rope exercise'
  },
  {
    id: 'running-outdoor',
    name: 'Running (Outdoor)',
    metValue: 8.0, // Running at 5 mph
    description: 'Outdoor running'
  },
  {
    id: 'walking',
    name: 'Walking',
    metValue: 3.5, // Walking at 3.5 mph
    description: 'Brisk walking'
  },
  {
    id: 'swimming',
    name: 'Swimming',
    metValue: 6.0, // Swimming moderate effort
    description: 'Swimming laps'
  },
  {
    id: 'other',
    name: 'Other',
    metValue: 5.0, // Default moderate intensity
    description: 'Other cardio activity'
  }
];

/**
 * Calculate calories burned for cardio exercise
 * @param cardioType - Type of cardio exercise
 * @param durationMinutes - Duration in minutes
 * @param weightKg - User's weight in kg
 * @param intensity - Intensity level (1.0 = moderate, 0.8 = light, 1.2 = vigorous)
 * @returns Estimated calories burned
 */
export function calculateCardioCalories(
  cardioType: string,
  durationMinutes: number,
  weightKg: number = 70,
  intensity: number = 1.0
): number {
  const cardio = CARDIO_TYPES.find(c => c.id === cardioType) || CARDIO_TYPES.find(c => c.id === 'other');
  if (!cardio) return 0;
  
  // MET × Weight (kg) × Duration (hours)
  const durationHours = durationMinutes / 60;
  const adjustedMET = cardio.metValue * intensity;
  const calories = adjustedMET * weightKg * durationHours;
  
  return Math.round(calories);
}

/**
 * Get cardio type by ID
 */
export function getCardioTypeById(id: string): CardioType | undefined {
  return CARDIO_TYPES.find(c => c.id === id);
}

/**
 * Get all cardio types
 */
export function getAllCardioTypes(): CardioType[] {
  return CARDIO_TYPES;
}

