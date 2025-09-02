export interface WizardStep {
  id: string;
  title: string;
  subtitle: string;
}

export const steps: WizardStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to DENSE! 💪',
    subtitle: 'Let\'s create the perfect workout program for you'
  },
  {
    id: 'motivation',
    title: 'What brings you to DENSE?',
    subtitle: 'Tell us your main fitness motivation'
  },
  {
    id: 'name',
    title: 'What\'s Your Name?',
    subtitle: 'Let\'s personalize your fitness journey'
  },
  // {
  //   id: 'current-strength',
  //   title: 'What\'s Your Starting Point?',
  //   subtitle: 'Tell us your current strength levels (optional)'
  // },
  {
    id: 'training-experience',
    title: 'Training Experience',
    subtitle: 'How long have you been lifting?'
  },
  {
    id: 'tdee-calculation',
    title: 'Body Metrics & Training',
    subtitle: 'Tell us about yourself to calculate your nutrition needs'
  },
  {
    id: 'muscle-priorities',
    title: 'Muscle Group Focus',
    subtitle: 'Which muscle groups do you want to prioritize? (Max 3)'
  },
  {
    id: 'pump-work',
    title: 'Pump Work Preference',
    subtitle: 'Do you enjoy high-rep "pump" exercises?'
  },
  {
    id: 'program-duration',
    title: 'Program Duration',
    subtitle: 'How long do you want your program to run?'
  },
  {
    id: 'review-preferences',
    title: 'Review Your Setup',
    subtitle: ''
  },
  {
    id: 'complete',
    title: 'Generate My Program! 💪',
    subtitle: 'Ready to create your perfect training plan?'
  }
];

export const trainingExperienceOptions = [
  { id: 'new_beginner', label: 'New to lifting' },
  { id: '6_18_months', label: '6-18 months experience' },
  { id: '2_plus_years', label: '2+ years experience' }
];

export const bodyFatOptions = [
  { id: 'lean_under_12', label: 'Lean (under 12%)' },
  { id: 'athletic_12_18', label: 'Athletic (12-18%)' },
  { id: 'average_18_22', label: 'Average (18-22%)' },
  { id: 'high_22_plus', label: 'Higher (22%+)' }
];

export const trainingDaysOptions = [
  { id: 3, label: '3 days', nickname: 'Triple Threat' },
  { id: 4, label: '4 days', nickname: 'Lean Machine' },
  { id: 5, label: '5 days', nickname: 'Iron Addict' },
  { id: 6, label: '6 days', nickname: 'Gym Rat' },
  { id: 7, label: '7 days', nickname: 'Legend' }
];

export const weekDays = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' }
];

export const musclePriorityOptions = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'arms', label: 'Arms' },
  { id: 'legs', label: 'Legs' },
  { id: 'abs', label: 'Abs' }
];

export const pumpWorkOptions = [
  { id: 'yes_love_it', label: 'Yes, love the pump!' },
  { id: 'maybe_sometimes', label: 'Maybe, sometimes' },
  { id: 'no_minimal', label: 'No, keep it minimal' }
];



export const durationOptions = [
  { id: 4, label: '4 weeks' },
  { id: 8, label: '8 weeks' },
  { id: 12, label: '12 weeks' }
];

export const activityLevelOptions = [
  { id: 'sedentary', label: 'Sedentary', description: 'Little to no exercise', multiplier: 1.2 },
  { id: 'lightly_active', label: 'Lightly Active', description: 'Light exercise 1-3 days/week', multiplier: 1.375 },
  { id: 'moderately_active', label: 'Moderately Active', description: 'Moderate exercise 3-5 days/week', multiplier: 1.55 },
  { id: 'very_active', label: 'Very Active', description: 'Hard exercise 6-7 days/week', multiplier: 1.725 },
  { id: 'extremely_active', label: 'Extremely Active', description: 'Very intense exercise or physical job', multiplier: 1.9 }
];

export const genderOptions = [
  { id: 'male', label: 'Male' },
  { id: 'female', label: 'Female' }
];

export const goalOptions = [
  { id: 'lose_weight', label: 'Lose Weight', calorieAdjustment: -0.2, proteinMultiplier: 2.0 },
  { id: 'maintain_weight', label: 'Maintain Weight', calorieAdjustment: 0, proteinMultiplier: 1.6 },
  { id: 'gain_weight', label: 'Gain Weight', calorieAdjustment: 0.15, proteinMultiplier: 1.8 }
];

export const motivationOptions = [
  { id: 'build_muscle', label: 'Build Muscle & Size', emoji: '💪' },
  { id: 'get_stronger', label: 'Get Stronger', emoji: '🏋️' },
  { id: 'lose_weight', label: 'Lose Weight', emoji: '🔥' },
  { id: 'tone_up', label: 'Tone Up & Define', emoji: '✨' },
  { id: 'improve_health', label: 'Improve Overall Health', emoji: '❤️' },
  { id: 'boost_confidence', label: 'Boost Confidence', emoji: '🚀' },
  { id: 'stress_relief', label: 'Stress Relief', emoji: '🧘' },
  { id: 'challenge_myself', label: 'Challenge Myself', emoji: '🎯' }
];

export const aiGenerationSteps = [
  { text: "🧠 Analyzing your preferences...", duration: 1500 },
  { text: "💪 Matching training experience...", duration: 1500 },
  { text: "🎯 Selecting optimal exercises...", duration: 1500 },
  { text: "📊 Calculating rep ranges...", duration: 1500 },
  { text: "⚖️ Balancing muscle groups...", duration: 1500 },
  { text: "🔄 Optimizing recovery...", duration: 1500 },
  { text: "📈 Creating progression plan...", duration: 1500 },
  { text: "🎉 Finalizing your program...", duration: 1500 },
  { text: "✅ Complete!", duration: 1000 }
];