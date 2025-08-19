// DENSE AI Program Generator V2
// Generates custom Push/Pull/Legs programs following DENSE training philosophy
// Focus: Dense muscle, smart volume, failure-based training

export interface WizardResponses {
  // Step 2: Current Strength (optional)
  squatKg?: number;
  benchKg?: number;
  deadliftKg?: number;
  
  // Step 3: Training Experience
  trainingExperience: 'new' | '6_18_months' | '2_plus_years';
  
  // Step 4: Body Fat Level
  bodyFatLevel: 'lean_10_14' | 'athletic_15_18' | 'average_18_22' | 'high_22_plus';
  
  // Step 5: Weekly Schedule
  trainingDaysPerWeek: number; // 3, 4, 5, or 6
  preferredTrainingDays: string[];
  
  // Step 6: Muscle Priorities (max 3)
  musclePriorities: string[];
  
  // Step 7: Pump Work Preference
  pumpWorkPreference: 'yes_love_burn' | 'maybe_sometimes' | 'no_minimal';
  
  // Step 8: Recovery Profile
  recoveryProfile: 'fast_recovery' | 'need_more_rest' | 'not_sure';
  
  // Step 9: Program Duration
  programDurationWeeks: number; // 4, 8, or 12
}

export interface Exercise {
  name: string;
  sets: number;
  reps: string;
  restSeconds: number;
  notes?: string;
  isPriority?: boolean; // Extra volume for user's weak points
  isPump?: boolean; // Pump/isolation work
  type: 'compound' | 'isolation' | 'pump';
  warmupSets?: { reps: number; intensity: number }[]; // 50% and 80% warm-ups
}

export interface WorkoutDay {
  name: string;
  type: 'push' | 'pull' | 'legs' | 'rest';
  exercises: Exercise[];
  estimatedDuration: number; // minutes
}

export interface GeneratedProgram {
  programName: string;
  overview: string;
  weeklyStructure: WorkoutDay[]; // Only workout days, no rest days
  totalWeeks: number;
  progressionNotes: string[];
  nutritionTips: string[];
  trainingSchedule: string[]; // Days to train: ['monday', 'tuesday', 'thursday', etc.]
  restDays: string[]; // Suggested rest days: ['wednesday', 'saturday']
}

// DENSE Exercise Database - Refined for Optimal Progress
// Focus: High-quality movements, progressive overload, universal availability
const EXERCISE_DATABASE = {
  // PUSH EXERCISES - Horizontal & Vertical Pressing
  push: {
    chest_compound: [
      { name: 'Barbell Bench Press', difficulty: 'intermediate', targets: ['chest', 'triceps'], repRange: '6-12', type: 'compound' },
      { name: 'Dumbbell Bench Press', difficulty: 'beginner', targets: ['chest', 'triceps'], repRange: '6-12', type: 'compound' },
      { name: 'Incline Barbell Press', difficulty: 'intermediate', targets: ['upper_chest', 'triceps'], repRange: '6-12', type: 'compound' },
      { name: 'Incline Dumbbell Press', difficulty: 'beginner', targets: ['upper_chest', 'triceps'], repRange: '6-12', type: 'compound' },
    ],
    chest_isolation: [
      { name: 'Dumbbell Flyes', difficulty: 'beginner', targets: ['chest'], repRange: '10-15', type: 'isolation' },
      { name: 'Cable Flyes', difficulty: 'beginner', targets: ['chest'], repRange: '10-15', type: 'isolation' },
      { name: 'Pec Deck', difficulty: 'beginner', targets: ['chest'], repRange: '10-15', type: 'isolation' },
    ],
    shoulder_compound: [
      { name: 'Overhead Barbell Press', difficulty: 'intermediate', targets: ['shoulders', 'triceps'], repRange: '6-12', type: 'compound' },
      { name: 'Seated Dumbbell Press', difficulty: 'beginner', targets: ['shoulders', 'triceps'], repRange: '6-12', type: 'compound' },
      { name: 'Machine Shoulder Press', difficulty: 'beginner', targets: ['shoulders', 'triceps'], repRange: '6-12', type: 'compound' },
    ],
    shoulder_isolation: [
      { name: 'Lateral Raises', difficulty: 'beginner', targets: ['side_delts'], repRange: '10-15', type: 'isolation' },
      { name: 'Rear Delt Flyes', difficulty: 'beginner', targets: ['rear_delts'], repRange: '10-15', type: 'isolation' },
      { name: 'Face Pulls', difficulty: 'beginner', targets: ['rear_delts'], repRange: '10-15', type: 'isolation' },
    ],
    triceps: [
      { name: 'Close-Grip Bench Press', difficulty: 'intermediate', targets: ['triceps'], repRange: '6-12', type: 'compound' },
      { name: 'Tricep Dips', difficulty: 'beginner', targets: ['triceps'], repRange: '8-15', type: 'compound' },
      { name: 'Overhead Tricep Extension', difficulty: 'beginner', targets: ['triceps'], repRange: '10-15', type: 'isolation' },
      { name: 'Tricep Pushdowns', difficulty: 'beginner', targets: ['triceps'], repRange: '10-15', type: 'isolation' },
    ]
  },

  // PULL EXERCISES - Horizontal & Vertical Pulling
  pull: {
    back_compound: [
      { name: 'Conventional Deadlift', difficulty: 'intermediate', targets: ['back', 'hamstrings', 'glutes'], repRange: '6-8', type: 'compound' },
      { name: 'Barbell Rows', difficulty: 'intermediate', targets: ['back', 'biceps'], repRange: '6-12', type: 'compound' },
      { name: 'Dumbbell Rows', difficulty: 'beginner', targets: ['back', 'biceps'], repRange: '8-12', type: 'compound' },
      { name: 'Pull-ups', difficulty: 'intermediate', targets: ['back', 'biceps'], repRange: '6-12', type: 'compound' },
      { name: 'Lat Pulldowns', difficulty: 'beginner', targets: ['back', 'biceps'], repRange: '8-12', type: 'compound' },
      { name: 'Cable Rows', difficulty: 'beginner', targets: ['back', 'biceps'], repRange: '8-12', type: 'compound' },
    ],
    back_isolation: [
      { name: 'Cable Pullovers', difficulty: 'beginner', targets: ['lats'], repRange: '10-15', type: 'isolation' },
      { name: 'Shrugs', difficulty: 'beginner', targets: ['traps'], repRange: '10-15', type: 'isolation' },
      { name: 'Reverse Flyes', difficulty: 'beginner', targets: ['rear_delts'], repRange: '12-15', type: 'isolation' },
    ],
    biceps: [
      { name: 'Barbell Bicep Curls', difficulty: 'beginner', targets: ['biceps'], repRange: '8-12', type: 'isolation' },
      { name: 'Dumbbell Bicep Curls', difficulty: 'beginner', targets: ['biceps'], repRange: '10-15', type: 'isolation' },
      { name: 'Hammer Curls', difficulty: 'beginner', targets: ['biceps', 'forearms'], repRange: '10-15', type: 'isolation' },
      { name: 'Cable Bicep Curls', difficulty: 'beginner', targets: ['biceps'], repRange: '10-15', type: 'isolation' },
    ]
  },

  // LEG EXERCISES - Squat Pattern & Hip Hinge
  legs: {
    quad_compound: [
      { name: 'Back Squat', difficulty: 'intermediate', targets: ['quads', 'glutes'], repRange: '6-12', type: 'compound' },
      { name: 'Goblet Squat', difficulty: 'beginner', targets: ['quads', 'glutes'], repRange: '8-15', type: 'compound' },
      { name: 'Leg Press', difficulty: 'beginner', targets: ['quads', 'glutes'], repRange: '8-15', type: 'compound' },
      { name: 'Bulgarian Split Squats', difficulty: 'beginner', targets: ['quads', 'glutes'], repRange: '8-12', type: 'compound' },
    ],
    hamstring_compound: [
      { name: 'Romanian Deadlift', difficulty: 'beginner', targets: ['hamstrings', 'glutes'], repRange: '8-12', type: 'compound' },
      { name: 'Hip Thrusts', difficulty: 'beginner', targets: ['glutes', 'hamstrings'], repRange: '8-15', type: 'compound' },
      { name: 'Stiff Leg Deadlift', difficulty: 'beginner', targets: ['hamstrings'], repRange: '10-15', type: 'compound' },
    ],
    leg_isolation: [
      { name: 'Leg Curls', difficulty: 'beginner', targets: ['hamstrings'], repRange: '10-15', type: 'isolation' },
      { name: 'Leg Extensions', difficulty: 'beginner', targets: ['quads'], repRange: '12-15', type: 'isolation' },
      { name: 'Calf Raises', difficulty: 'beginner', targets: ['calves'], repRange: '12-20', type: 'isolation' },
      { name: 'Walking Lunges', difficulty: 'beginner', targets: ['quads', 'glutes'], repRange: '10-15', type: 'isolation' },
    ]
  },

  // PUMP WORK - High-rep finishers for weak points
  pump: {
    chest: [
      { name: 'Cable Flyes Drop Set', difficulty: 'beginner', targets: ['chest'], repRange: '15-25', type: 'pump' },
      { name: 'Push-up to Failure', difficulty: 'beginner', targets: ['chest'], repRange: 'failure', type: 'pump' },
    ],
    shoulders: [
      { name: 'Lateral Raise Drop Set', difficulty: 'beginner', targets: ['side_delts'], repRange: '12-20', type: 'pump' },
      { name: 'Rear Delt Flye Burnout', difficulty: 'beginner', targets: ['rear_delts'], repRange: '15-25', type: 'pump' },
    ],
    back: [
      { name: 'Cable Pullover Burnout', difficulty: 'beginner', targets: ['lats'], repRange: '15-25', type: 'pump' },
      { name: 'Band Pull-Aparts', difficulty: 'beginner', targets: ['rear_delts'], repRange: '20-30', type: 'pump' },
    ],
    arms: [
      { name: 'Bicep Curl 21s', difficulty: 'beginner', targets: ['biceps'], repRange: '21', type: 'pump' },
      { name: 'Tricep Pushdown Drop Set', difficulty: 'beginner', targets: ['triceps'], repRange: '12-20', type: 'pump' },
    ],
    legs: [
      { name: 'Leg Extension Burnout', difficulty: 'beginner', targets: ['quads'], repRange: '20-30', type: 'pump' },
      { name: 'Calf Raise Drop Set', difficulty: 'beginner', targets: ['calves'], repRange: '15-25', type: 'pump' },
    ]
  }
};

// DENSE Volume Structure - 12 sets/week base, 16 sets for weak points
const VOLUME_STRUCTURE: {
  base: Record<string, number>;
  priority: Record<string, number>;
} = {
  base: {
    chest: 12,
    shoulders: 12, 
    triceps: 12,
    back: 12,
    biceps: 12,
    quads: 12,
    hamstrings: 12,
    calves: 12
  },
  priority: {
    chest: 16,
    shoulders: 16,
    triceps: 14, // Arms get slightly less
    back: 16,
    biceps: 14,
    quads: 16,
    hamstrings: 16,
    calves: 14
  }
};

// AI Program Generator Class
export class ProgramGenerator {
  
  static generateProgram(responses: WizardResponses): GeneratedProgram {
    console.log('🧠 DENSE AI generating custom program from responses:', responses);
    
    // 1. Determine training split based on days per week
    const split = this.calculateTrainingSplit(responses.trainingDaysPerWeek, responses.recoveryProfile);
    
    // 2. Calculate volume distribution for each muscle group
    const volumeDistribution = this.calculateVolumeDistribution(responses.musclePriorities);
    
    // 3. Select exercises based on experience and priorities
    const exerciseSelection = this.selectExercises(responses.musclePriorities, responses.trainingExperience);
    
    // 4. Add pump work based on preference and priorities
    const pumpWork = this.addPumpWork(responses.pumpWorkPreference, responses.musclePriorities);
    
    // 5. Generate workout days with DENSE programming
    const weeklyStructure = this.buildWeeklyStructure(split, exerciseSelection, volumeDistribution, pumpWork, responses.trainingExperience);
    
    // 6. Create program overview
    const programDetails = this.createProgramDetails(responses, split);
    
    // 7. Generate training schedule
    const schedule = this.generateTrainingSchedule(responses.trainingDaysPerWeek, responses.preferredTrainingDays);
    
    return {
      programName: programDetails.name,
      overview: programDetails.overview,
      weeklyStructure, // Only workout days, no rest days
      totalWeeks: responses.programDurationWeeks,
      progressionNotes: this.generateProgressionNotes(responses),
      nutritionTips: this.generateNutritionTips(responses.bodyFatLevel),
      trainingSchedule: schedule.workoutDays,
      restDays: schedule.restDays
    };
  }
  
  private static calculateTrainingSplit(daysPerWeek: number, recovery: string) {
    switch (daysPerWeek) {
      case 3:
        return { type: 'ppl_once', days: ['push', 'pull', 'legs'] };
      case 4:
        return { type: 'ppl_plus_push', days: ['push', 'pull', 'legs', 'push'] };
      case 5:
        return { type: 'ppl_plus_weak', days: ['push', 'pull', 'legs', 'push', 'pull'] };
      case 6:
        return { type: 'ppl_twice', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs'] };
      default:
        return { type: 'ppl_once', days: ['push', 'pull', 'legs'] };
    }
  }
  
  private static calculateVolumeDistribution(priorities: string[]) {
    const distribution = { ...VOLUME_STRUCTURE.base };
    
    // Increase volume for priority muscles
    priorities.forEach(priority => {
      const muscleGroup = priority.toLowerCase().replace(/\s+/g, '_');
      if (VOLUME_STRUCTURE.priority[muscleGroup]) {
        distribution[muscleGroup] = VOLUME_STRUCTURE.priority[muscleGroup];
      }
    });
    
    return distribution;
  }
  
  private static selectExercises(priorities: string[], experience: string) {
    const difficulty = experience === 'new' ? 'beginner' : 
                     experience === '6_18_months' ? 'intermediate' : 'intermediate'; // Keep most at intermediate
    
    // Base exercise selection - fewer exercises, higher quality
    const selection = {
      chest: this.filterByDifficulty(EXERCISE_DATABASE.push.chest_compound, difficulty).slice(0, 1),
      shoulders: this.filterByDifficulty(EXERCISE_DATABASE.push.shoulder_compound, difficulty).slice(0, 1),
      triceps: this.filterByDifficulty(EXERCISE_DATABASE.push.triceps, difficulty).slice(0, 1),
      back: this.filterByDifficulty(EXERCISE_DATABASE.pull.back_compound, difficulty).slice(0, 2),
      biceps: this.filterByDifficulty(EXERCISE_DATABASE.pull.biceps, difficulty).slice(0, 1),
      quads: this.filterByDifficulty(EXERCISE_DATABASE.legs.quad_compound, difficulty).slice(0, 1),
      hamstrings: this.filterByDifficulty(EXERCISE_DATABASE.legs.hamstring_compound, difficulty).slice(0, 1),
      legs_iso: this.filterByDifficulty(EXERCISE_DATABASE.legs.leg_isolation, difficulty).slice(0, 1),
    };
    
    // Add priority exercises for weak points
    priorities.forEach(priority => {
      switch (priority.toLowerCase()) {
        case 'chest':
          selection.chest.push(...EXERCISE_DATABASE.push.chest_isolation.slice(0, 1));
          break;
        case 'back':
          selection.back.push(...EXERCISE_DATABASE.pull.back_isolation.slice(0, 1));
          break;
        case 'shoulders':
          selection.shoulders.push(...EXERCISE_DATABASE.push.shoulder_isolation.slice(0, 1));
          break;
        case 'arms':
          selection.triceps.push(...EXERCISE_DATABASE.push.triceps.slice(1, 2));
          selection.biceps.push(...EXERCISE_DATABASE.pull.biceps.slice(1, 2));
          break;
        case 'quads':
          selection.legs_iso.push(...EXERCISE_DATABASE.legs.leg_isolation.slice(0, 1));
          break;
        case 'hamstrings & glutes':
          selection.hamstrings.push(...EXERCISE_DATABASE.legs.hamstring_compound.slice(1, 2));
          break;
      }
    });
    
    return selection;
  }
  
  private static addPumpWork(preference: string, priorities: string[]) {
    if (preference === 'no_minimal') return [];
    
    const pumpExercises: Exercise[] = [];
    const intensity = preference === 'yes_love_burn' ? 2 : 1;
    
    priorities.forEach(priority => {
      const muscleGroup = priority.toLowerCase().replace(/\s+&\s+/g, '_').replace(/\s+/g, '_');
      
      switch (muscleGroup) {
        case 'chest':
          pumpExercises.push(...this.convertToPumpExercises(
            EXERCISE_DATABASE.pump.chest.slice(0, intensity)
          ));
          break;
        case 'shoulders':
          pumpExercises.push(...this.convertToPumpExercises(
            EXERCISE_DATABASE.pump.shoulders.slice(0, intensity)
          ));
          break;
        case 'back':
          pumpExercises.push(...this.convertToPumpExercises(
            EXERCISE_DATABASE.pump.back.slice(0, intensity)
          ));
          break;
        case 'arms':
          pumpExercises.push(...this.convertToPumpExercises(
            EXERCISE_DATABASE.pump.arms.slice(0, intensity)
          ));
          break;
        case 'quads':
        case 'hamstrings_glutes':
          pumpExercises.push(...this.convertToPumpExercises(
            EXERCISE_DATABASE.pump.legs.slice(0, intensity)
          ));
          break;
      }
    });
    
    return pumpExercises;
  }
  
  private static buildWeeklyStructure(
    split: any, 
    exercises: any, 
    volume: any, 
    pumpWork: Exercise[], 
    experience: string
  ): WorkoutDay[] {
    const structure: WorkoutDay[] = [];
    let workoutDayNumber = 1;
    
    split.days.forEach((dayType: string) => {
      // Skip rest days (they should not exist in the new structure)
      if (dayType === 'rest') {
        return;
      }
      
      let dayExercises: Exercise[] = [];
      let dayName = '';
      
      switch (dayType) {
        case 'push':
          dayName = `Day ${workoutDayNumber}: Push (Chest, Shoulders, Triceps)`;
          dayExercises = [
            ...this.convertToExercises(exercises.chest, volume.chest, 'compound'),
            ...this.convertToExercises(exercises.shoulders, volume.shoulders, 'compound'),
            ...this.convertToExercises(exercises.triceps, volume.triceps, 'isolation'),
            ...pumpWork.filter(ex => ['chest', 'shoulders', 'triceps'].some(muscle => 
              ex.name.toLowerCase().includes(muscle) || 
              ex.name.toLowerCase().includes('lateral') || 
              ex.name.toLowerCase().includes('push')
            ))
          ];
          break;
          
        case 'pull':
          dayName = `Day ${workoutDayNumber}: Pull (Back, Biceps)`;
          dayExercises = [
            ...this.convertToExercises(exercises.back, volume.back, 'compound'),
            ...this.convertToExercises(exercises.biceps, volume.biceps, 'isolation'),
            ...pumpWork.filter(ex => ['back', 'biceps', 'pull'].some(muscle => 
              ex.name.toLowerCase().includes(muscle) || 
              ex.name.toLowerCase().includes('curl')
            ))
          ];
          break;
          
        case 'legs':
          dayName = `Day ${workoutDayNumber}: Legs (Quads, Hamstrings, Glutes)`;
          dayExercises = [
            ...this.convertToExercises(exercises.quads, volume.quads, 'compound'),
            ...this.convertToExercises(exercises.hamstrings, volume.hamstrings, 'compound'),
            ...this.convertToExercises(exercises.legs_iso, volume.legs_iso || 8, 'isolation'),
            ...pumpWork.filter(ex => ['leg', 'squat', 'lunge', 'calf'].some(muscle => 
              ex.name.toLowerCase().includes(muscle)
            ))
          ];
          break;
      }
      
      // Calculate estimated duration (DENSE style)
      const duration = this.calculateDuration(dayExercises);
      
      structure.push({
        name: dayName,
        type: dayType as 'push' | 'pull' | 'legs',
        exercises: dayExercises,
        estimatedDuration: duration
      });
      
      workoutDayNumber++;
    });
    
    return structure;
  }
  
  private static convertToExercises(exerciseList: any[], totalVolume: number, exerciseType: string): Exercise[] {
    const exercises: Exercise[] = [];
    const setsPerExercise = Math.ceil(totalVolume / exerciseList.length);
    
    exerciseList.forEach(ex => {
      const isCompound = exerciseType === 'compound';
      
      exercises.push({
        name: ex.name,
        sets: 2, // DENSE: Start with 2 working sets (Weeks 1-5)
        reps: ex.repRange || (isCompound ? '6-12' : '10-15'),
        restSeconds: isCompound ? 180 : 90, // Compounds: 3min, Isolation: 90s
        type: exerciseType as 'compound' | 'isolation',
        notes: 'Train to failure on every working set. Stop at last clean rep.',
        warmupSets: isCompound ? [
          { reps: 8, intensity: 50 }, // 50% warm-up
          { reps: 3, intensity: 80 }  // 80% warm-up
        ] : undefined
      });
    });
    
    return exercises;
  }
  
  private static convertToPumpExercises(exerciseList: any[]): Exercise[] {
    return exerciseList.map(ex => ({
      name: ex.name,
      sets: 1,
      reps: ex.repRange,
      restSeconds: 30, // DENSE: 15-30s for pump work
      type: 'pump' as const,
      isPump: true,
      notes: 'Pump work - light weight, high reps, minimal rest'
    }));
  }
  
  private static calculateDuration(exercises: Exercise[]): number {
    let totalTime = 0;
    
    exercises.forEach(ex => {
      const workingSets = ex.sets;
      const warmupTime = ex.warmupSets ? (ex.warmupSets.length * 2.5) : 0; // 2.5min per warmup
      const workingSetTime = workingSets * 2.5; // 2.5min per working set (including exercise execution)
      const restTime = (workingSets - 1) * (ex.restSeconds / 60); // Rest between sets
      const setupTime = 1; // 1min setup/transition time per exercise
      
      totalTime += warmupTime + workingSetTime + restTime + setupTime;
    });
    
    // Ensure minimum 45 minutes, maximum 60 minutes
    const calculatedTime = Math.round(totalTime);
    
    if (calculatedTime < 45) {
      return 45; // Set minimum to 45 minutes
    } else if (calculatedTime > 60) {
      return 60; // Cap at 60 minutes
    }
    
    return calculatedTime;
  }
  
  private static filterByDifficulty(exercises: any[], targetDifficulty: string) {
    return exercises.filter(ex => ex.difficulty === targetDifficulty || ex.difficulty === 'beginner');
  }
  
  private static createProgramDetails(responses: WizardResponses, split: any) {
    const priorityText = responses.musclePriorities.join(', ').replace(/_/g, ' ');
    
    return {
      name: `DENSE ${responses.trainingDaysPerWeek}-Day ${priorityText} Focus`,
      overview: `Your personalized DENSE program focuses on building dense, natural muscle through smart volume and failure-based training. Each muscle group is trained twice per week with ${split.type.includes('twice') ? 'full' : 'moderate'} frequency. Priority muscles (${priorityText}) receive extra volume and pump work for accelerated development.`
    };
  }
  
  private static generateProgressionNotes(responses: WizardResponses): string[] {
    return [
      '🎯 DENSE Progression System:',
      '• Weeks 1-5: 2 working sets per exercise',
      '• Weeks 6-12: Increase to 3 working sets', 
      '• Week 8: Add +2 sets to priority muscles',
      '• Every 4th week: Add 1 extra set to main lifts',
      '',
      '📈 Progressive Overload:',
      '• Train every working set to failure',
      '• Add reps OR add weight each session',
      '• Once you exceed rep range, increase weight',
      '• Track all sets for AI-guided progression',
      '',
      '⏱️ Rest Periods:',
      '• Compounds: 2-4 minutes',
      '• Isolations: 30-90 seconds', 
      '• Pump work: 15-30 seconds only'
    ];
  }
  
  private static generateNutritionTips(bodyFatLevel: string): string[] {
    const baseNutrition = [
      '🥩 DENSE Nutrition for Dense Muscle:',
      '• Protein: 1g per lb bodyweight minimum',
      '• Eat in slight surplus for muscle growth',
      '• Time protein around workouts',
      '• Focus on whole foods, not supplements'
    ];
    
    switch (bodyFatLevel) {
      case 'lean_10_14':
        return [...baseNutrition, '• You can bulk aggressively - add 300-500 calories'];
      case 'athletic_15_18':
        return [...baseNutrition, '• Lean bulk - add 200-300 calories above maintenance'];
      case 'average_18_22':
        return [...baseNutrition, '• Body recomp - eat at maintenance, focus on protein'];
      case 'high_22_plus':
        return [...baseNutrition, '• Cut first - eat 300-500 calories below maintenance'];
      default:
        return baseNutrition;
    }
  }

  private static generateTrainingSchedule(daysPerWeek: number, preferredDays: string[]) {
    const allDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    // Use preferred days if available and matches training days count
    if (preferredDays && preferredDays.length === daysPerWeek) {
      const workoutDays = preferredDays;
      const restDays = allDays.filter(day => !workoutDays.includes(day));
      return { workoutDays, restDays };
    }
    
    // Generate optimal schedule based on training days per week
    let workoutDays: string[] = [];
    
    switch (daysPerWeek) {
      case 3:
        workoutDays = ['monday', 'wednesday', 'friday'];
        break;
      case 4:
        workoutDays = ['monday', 'tuesday', 'thursday', 'friday'];
        break;
      case 5:
        workoutDays = ['monday', 'tuesday', 'thursday', 'friday', 'saturday'];
        break;
      case 6:
        workoutDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        break;
      default:
        workoutDays = ['monday', 'wednesday', 'friday'];
    }
    
    const restDays = allDays.filter(day => !workoutDays.includes(day));
    return { workoutDays, restDays };
  }
}