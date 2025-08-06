// AI Program Generator for DENSE V1
// Takes user wizard responses and generates custom Push/Pull/Legs program

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
  weeklyStructure: WorkoutDay[];
  totalWeeks: number;
  progressionNotes: string[];
  nutritionTips: string[];
}

// Exercise Database
const EXERCISE_DATABASE = {
  // PUSH EXERCISES
  push: {
    chest_compound: [
      { name: 'Barbell Bench Press', difficulty: 'advanced', targets: ['chest', 'triceps', 'front_delts'] },
      { name: 'Dumbbell Bench Press', difficulty: 'intermediate', targets: ['chest', 'triceps'] },
      { name: 'Push-ups', difficulty: 'beginner', targets: ['chest', 'triceps'] },
      { name: 'Incline Barbell Press', difficulty: 'advanced', targets: ['upper_chest', 'triceps'] },
      { name: 'Incline Dumbbell Press', difficulty: 'intermediate', targets: ['upper_chest', 'triceps'] },
    ],
    chest_isolation: [
      { name: 'Dumbbell Flyes', difficulty: 'intermediate', targets: ['chest'] },
      { name: 'Cable Flyes', difficulty: 'intermediate', targets: ['chest'] },
      { name: 'Pec Deck', difficulty: 'beginner', targets: ['chest'] },
      { name: 'Incline Flyes', difficulty: 'intermediate', targets: ['upper_chest'] },
    ],
    shoulder_compound: [
      { name: 'Overhead Barbell Press', difficulty: 'advanced', targets: ['shoulders', 'triceps'] },
      { name: 'Seated Dumbbell Press', difficulty: 'intermediate', targets: ['shoulders', 'triceps'] },
      { name: 'Pike Push-ups', difficulty: 'beginner', targets: ['shoulders'] },
    ],
    shoulder_isolation: [
      { name: 'Lateral Raises', difficulty: 'beginner', targets: ['side_delts'] },
      { name: 'Front Raises', difficulty: 'beginner', targets: ['front_delts'] },
      { name: 'Rear Delt Flyes', difficulty: 'intermediate', targets: ['rear_delts'] },
      { name: 'Face Pulls', difficulty: 'intermediate', targets: ['rear_delts', 'traps'] },
    ],
    triceps: [
      { name: 'Close-Grip Bench Press', difficulty: 'advanced', targets: ['triceps'] },
      { name: 'Tricep Dips', difficulty: 'intermediate', targets: ['triceps'] },
      { name: 'Overhead Tricep Extension', difficulty: 'intermediate', targets: ['triceps'] },
      { name: 'Tricep Pushdowns', difficulty: 'beginner', targets: ['triceps'] },
      { name: 'Diamond Push-ups', difficulty: 'intermediate', targets: ['triceps'] },
    ]
  },

  // PULL EXERCISES  
  pull: {
    back_compound: [
      { name: 'Conventional Deadlift', difficulty: 'advanced', targets: ['back', 'hamstrings', 'glutes'] },
      { name: 'Barbell Rows', difficulty: 'advanced', targets: ['back', 'biceps'] },
      { name: 'T-Bar Rows', difficulty: 'intermediate', targets: ['back', 'biceps'] },
      { name: 'Pull-ups', difficulty: 'advanced', targets: ['lats', 'biceps'] },
      { name: 'Lat Pulldowns', difficulty: 'beginner', targets: ['lats', 'biceps'] },
      { name: 'Seated Cable Rows', difficulty: 'beginner', targets: ['back', 'biceps'] },
    ],
    back_isolation: [
      { name: 'Single-Arm Dumbbell Rows', difficulty: 'intermediate', targets: ['back'] },
      { name: 'Chest Supported Rows', difficulty: 'intermediate', targets: ['back'] },
      { name: 'Straight-Arm Pulldowns', difficulty: 'intermediate', targets: ['lats'] },
      { name: 'Shrugs', difficulty: 'beginner', targets: ['traps'] },
    ],
    biceps: [
      { name: 'Barbell Curls', difficulty: 'intermediate', targets: ['biceps'] },
      { name: 'Dumbbell Curls', difficulty: 'beginner', targets: ['biceps'] },
      { name: 'Hammer Curls', difficulty: 'beginner', targets: ['biceps', 'forearms'] },
      { name: 'Cable Curls', difficulty: 'intermediate', targets: ['biceps'] },
      { name: 'Preacher Curls', difficulty: 'intermediate', targets: ['biceps'] },
    ]
  },

  // LEG EXERCISES
  legs: {
    quad_compound: [
      { name: 'Back Squats', difficulty: 'advanced', targets: ['quads', 'glutes'] },
      { name: 'Front Squats', difficulty: 'advanced', targets: ['quads'] },
      { name: 'Goblet Squats', difficulty: 'beginner', targets: ['quads', 'glutes'] },
      { name: 'Leg Press', difficulty: 'beginner', targets: ['quads', 'glutes'] },
      { name: 'Bulgarian Split Squats', difficulty: 'intermediate', targets: ['quads', 'glutes'] },
    ],
    hamstring_compound: [
      { name: 'Romanian Deadlifts', difficulty: 'intermediate', targets: ['hamstrings', 'glutes'] },
      { name: 'Stiff-Leg Deadlifts', difficulty: 'intermediate', targets: ['hamstrings'] },
      { name: 'Good Mornings', difficulty: 'advanced', targets: ['hamstrings', 'lower_back'] },
    ],
    leg_isolation: [
      { name: 'Leg Extensions', difficulty: 'beginner', targets: ['quads'] },
      { name: 'Leg Curls', difficulty: 'beginner', targets: ['hamstrings'] },
      { name: 'Calf Raises', difficulty: 'beginner', targets: ['calves'] },
      { name: 'Walking Lunges', difficulty: 'intermediate', targets: ['quads', 'glutes'] },
    ],
    glutes: [
      { name: 'Hip Thrusts', difficulty: 'intermediate', targets: ['glutes'] },
      { name: 'Glute Bridges', difficulty: 'beginner', targets: ['glutes'] },
      { name: 'Cable Kickbacks', difficulty: 'beginner', targets: ['glutes'] },
    ]
  }
};

// AI Program Generator Class
export class ProgramGenerator {
  
  static generateProgram(responses: WizardResponses): GeneratedProgram {
    console.log('🧠 AI generating custom program from responses:', responses);
    
    // 1. Determine training split based on days per week
    const split = this.calculateTrainingSplit(responses.trainingDaysPerWeek, responses.recoveryProfile);
    
    // 2. Set rep ranges and intensity based on experience
    const intensity = this.calculateIntensity(responses.trainingExperience);
    
    // 3. Select exercises based on muscle priorities
    const exerciseSelection = this.selectExercises(responses.musclePriorities, responses.trainingExperience);
    
    // 4. Add pump work based on preference
    const pumpWork = this.addPumpWork(responses.pumpWorkPreference, responses.musclePriorities);
    
    // 5. Generate workout days
    const weeklyStructure = this.buildWeeklyStructure(split, exerciseSelection, intensity, pumpWork);
    
    // 6. Create program overview
    const programDetails = this.createProgramDetails(responses, split);
    
    return {
      programName: programDetails.name,
      overview: programDetails.overview,
      weeklyStructure,
      totalWeeks: responses.programDurationWeeks,
      progressionNotes: this.generateProgressionNotes(responses),
      nutritionTips: this.generateNutritionTips(responses.bodyFatLevel)
    };
  }
  
  private static calculateTrainingSplit(daysPerWeek: number, recovery: string) {
    switch (daysPerWeek) {
      case 3:
        return { type: 'ppl_once', days: ['push', 'pull', 'legs'], restDays: 2 };
      case 4:
        return recovery === 'fast_recovery' 
          ? { type: 'ppl_plus_arms', days: ['push', 'pull', 'legs', 'arms'], restDays: 1 }
          : { type: 'ppl_spaced', days: ['push', 'rest', 'pull', 'legs'], restDays: 1 };
      case 5:
        return { type: 'ppl_plus_weak', days: ['push', 'pull', 'legs', 'weak_point', 'weak_point'], restDays: 1 };
      case 6:
        return { type: 'ppl_twice', days: ['push', 'pull', 'legs', 'push', 'pull', 'legs'], restDays: 0 };
      default:
        return { type: 'ppl_once', days: ['push', 'pull', 'legs'], restDays: 2 };
    }
  }
  
  private static calculateIntensity(experience: string) {
    switch (experience) {
      case 'new':
        return { sets: 3, reps: '8-12', rest: 60, difficulty: 'beginner' };
      case '6_18_months':
        return { sets: 4, reps: '6-10', rest: 90, difficulty: 'intermediate' };
      case '2_plus_years':
        return { sets: 5, reps: '3-8', rest: 120, difficulty: 'advanced' };
      default:
        return { sets: 3, reps: '8-12', rest: 60, difficulty: 'beginner' };
    }
  }
  
  private static selectExercises(priorities: string[], experience: string) {
    const difficulty = experience === 'new' ? 'beginner' : 
                     experience === '6_18_months' ? 'intermediate' : 'advanced';
    
    // Base exercise selection for each muscle group
    const selection = {
      chest: this.filterByDifficulty(EXERCISE_DATABASE.push.chest_compound, difficulty).slice(0, 2),
      shoulders: this.filterByDifficulty(EXERCISE_DATABASE.push.shoulder_compound, difficulty).slice(0, 1),
      triceps: this.filterByDifficulty(EXERCISE_DATABASE.push.triceps, difficulty).slice(0, 1),
      back: this.filterByDifficulty(EXERCISE_DATABASE.pull.back_compound, difficulty).slice(0, 2),
      biceps: this.filterByDifficulty(EXERCISE_DATABASE.pull.biceps, difficulty).slice(0, 1),
      quads: this.filterByDifficulty(EXERCISE_DATABASE.legs.quad_compound, difficulty).slice(0, 1),
      hamstrings: this.filterByDifficulty(EXERCISE_DATABASE.legs.hamstring_compound, difficulty).slice(0, 1),
      legs_iso: this.filterByDifficulty(EXERCISE_DATABASE.legs.leg_isolation, difficulty).slice(0, 2),
    };
    
    // Add extra exercises for priority muscles
    priorities.forEach(priority => {
      switch (priority.toLowerCase()) {
        case 'chest':
          selection.chest.push(...EXERCISE_DATABASE.push.chest_isolation.slice(0, 1));
          break;
        case 'back':
          selection.back.push(...EXERCISE_DATABASE.pull.back_isolation.slice(0, 1));
          break;
        case 'shoulders':
          selection.shoulders.push(...EXERCISE_DATABASE.push.shoulder_isolation.slice(0, 2));
          break;
        case 'arms':
          selection.triceps.push(...EXERCISE_DATABASE.push.triceps.slice(1, 2));
          selection.biceps.push(...EXERCISE_DATABASE.pull.biceps.slice(1, 2));
          break;
        case 'quads':
          selection.quads.push(...EXERCISE_DATABASE.legs.quad_compound.slice(1, 2));
          break;
        case 'hamstrings & glutes':
          selection.hamstrings.push(...EXERCISE_DATABASE.legs.glutes.slice(0, 1));
          break;
      }
    });
    
    return selection;
  }
  
  private static filterByDifficulty(exercises: any[], difficulty: string) {
    return exercises.filter(ex => 
      difficulty === 'beginner' ? true :
      difficulty === 'intermediate' ? ex.difficulty !== 'advanced' :
      true // advanced can do all
    );
  }
  
  private static addPumpWork(preference: string, priorities: string[]) {
    const pumpExercises: Exercise[] = [];
    
    if (preference === 'no_minimal') return pumpExercises;
    
    const intensity = preference === 'yes_love_burn' ? 2 : 1; // Number of pump exercises
    
    priorities.slice(0, intensity).forEach(priority => {
      switch (priority.toLowerCase()) {
        case 'chest':
          pumpExercises.push({
            name: 'Cable Flyes',
            sets: 3,
            reps: '12-15',
            restSeconds: 45,
            isPump: true,
            notes: 'Focus on the squeeze'
          });
          break;
        case 'shoulders':
          pumpExercises.push({
            name: 'Lateral Raises',
            sets: 3,
            reps: '15-20',
            restSeconds: 45,
            isPump: true,
            notes: 'Light weight, feel the burn'
          });
          break;
        case 'arms':
          pumpExercises.push({
            name: 'Tricep Pushdowns',
            sets: 3,
            reps: '12-15',
            restSeconds: 45,
            isPump: true
          });
          break;
      }
    });
    
    return pumpExercises;
  }
  
  private static buildWeeklyStructure(split: any, exercises: any, intensity: any, pumpWork: Exercise[]): WorkoutDay[] {
    const structure: WorkoutDay[] = [];
    
    split.days.forEach((dayType: string, index: number) => {
      if (dayType === 'rest') {
        structure.push({
          name: `Day ${index + 1}: Rest`,
          type: 'rest',
          exercises: [],
          estimatedDuration: 0
        });
        return;
      }
      
      let dayExercises: Exercise[] = [];
      let dayName = '';
      
      switch (dayType) {
        case 'push':
          dayName = `Day ${index + 1}: Push (Chest, Shoulders, Triceps)`;
          dayExercises = [
            ...this.convertToExercises(exercises.chest, intensity, true),
            ...this.convertToExercises(exercises.shoulders, intensity),
            ...this.convertToExercises(exercises.triceps, intensity),
            ...pumpWork.filter(ex => ex.name.includes('Cable Flyes') || ex.name.includes('Lateral') || ex.name.includes('Tricep'))
          ];
          break;
          
        case 'pull':
          dayName = `Day ${index + 1}: Pull (Back, Biceps)`;
          dayExercises = [
            ...this.convertToExercises(exercises.back, intensity, true),
            ...this.convertToExercises(exercises.biceps, intensity),
            ...pumpWork.filter(ex => ex.name.includes('Curl'))
          ];
          break;
          
        case 'legs':
          dayName = `Day ${index + 1}: Legs (Quads, Hamstrings, Glutes)`;
          dayExercises = [
            ...this.convertToExercises(exercises.quads, intensity, true),
            ...this.convertToExercises(exercises.hamstrings, intensity, true),
            ...this.convertToExercises(exercises.legs_iso, intensity)
          ];
          break;
          
        case 'arms':
          dayName = `Day ${index + 1}: Arms Specialization`;
          dayExercises = [
            ...this.convertToExercises(exercises.triceps, intensity),
            ...this.convertToExercises(exercises.biceps, intensity),
            ...pumpWork
          ];
          break;
      }
      
      structure.push({
        name: dayName,
        type: dayType as 'push' | 'pull' | 'legs',
        exercises: dayExercises,
        estimatedDuration: this.calculateDuration(dayExercises)
      });
    });
    
    return structure;
  }
  
  private static convertToExercises(exerciseList: any[], intensity: any, isCompound = false): Exercise[] {
    return exerciseList.map(ex => ({
      name: ex.name,
      sets: isCompound ? intensity.sets : intensity.sets - 1,
      reps: intensity.reps,
      restSeconds: isCompound ? intensity.rest : intensity.rest - 30,
      isPriority: ex.isPriority || false
    }));
  }
  
  private static calculateDuration(exercises: Exercise[]): number {
    // Estimate: ~3-4 minutes per set (including rest)
    const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
    return Math.round(totalSets * 3.5);
  }
  
  private static createProgramDetails(responses: WizardResponses, split: any) {
    const focusAreas = responses.musclePriorities.join(', ');
    const experience = responses.trainingExperience.replace('_', ' ').replace('plus', '+');
    
    return {
      name: `DENSE Custom ${responses.trainingDaysPerWeek}-Day Program`,
      overview: `Your personalized ${responses.programDurationWeeks}-week Push/Pull/Legs program designed for ${experience} lifters. ` +
               `Focuses on ${focusAreas} with ${responses.trainingDaysPerWeek} training days per week. ` +
               `${responses.pumpWorkPreference === 'yes_love_burn' ? 'Includes extra pump work for maximum muscle growth.' : 
                 responses.pumpWorkPreference === 'maybe_sometimes' ? 'Moderate isolation work included.' : 
                 'Focuses on compound movements for strength and mass.'}`
    };
  }
  
  private static generateProgressionNotes(responses: WizardResponses): string[] {
    const notes = [
      `Week 1-${Math.floor(responses.programDurationWeeks / 3)}: Focus on form and establishing baseline weights`,
      `Week ${Math.floor(responses.programDurationWeeks / 3) + 1}-${Math.floor(responses.programDurationWeeks * 2 / 3)}: Increase weight by 2.5-5kg when you can complete all sets with good form`,
      `Week ${Math.floor(responses.programDurationWeeks * 2 / 3) + 1}-${responses.programDurationWeeks}: Push for new personal records and consider deload if needed`
    ];
    
    if (responses.recoveryProfile === 'need_more_rest') {
      notes.push('⚠️ Take extra rest days if feeling overly fatigued - recovery is key for your profile');
    }
    
    if (responses.trainingExperience === 'new') {
      notes.push('💡 Focus on learning proper form before adding weight - technique is everything');
    }
    
    return notes;
  }
  
  private static generateNutritionTips(bodyFat: string): string[] {
    const baseTips = [
      'Eat 1.6-2.2g protein per kg body weight daily',
      'Stay hydrated - aim for 35ml water per kg body weight',
      'Get 7-9 hours of quality sleep for optimal recovery'
    ];
    
    switch (bodyFat) {
      case 'lean_10_14':
        baseTips.push('Focus on lean bulking - slight calorie surplus for muscle growth');
        break;
      case 'athletic_15_18':
        baseTips.push('Maintain current physique or slight recomp - eat at maintenance calories');
        break;
      case 'average_18_22':
      case 'high_22_plus':
        baseTips.push('Consider moderate calorie deficit while maintaining high protein for body recomposition');
        break;
    }
    
    return baseTips;
  }
}