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
    id: 'current-strength',
    title: 'What\'s Your Starting Point?',
    subtitle: 'Tell us your current strength levels (optional)'
  },
  {
    id: 'training-experience',
    title: 'Training Experience',
    subtitle: 'How long have you been lifting?'
  },
  {
    id: 'body-fat',
    title: 'Body Fat Estimate',
    subtitle: 'What best describes your current physique?'
  },
  {
    id: 'weekly-schedule',
    title: 'Weekly Schedule',
    subtitle: 'How many days can you train per week?'
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
    id: 'recovery-profile',
    title: 'Recovery Profile',
    subtitle: 'How do you typically recover from workouts?'
  },
  {
    id: 'program-duration',
    title: 'Program Duration',
    subtitle: 'How long do you want your program to run?'
  },
  {
    id: 'complete',
    title: 'You\'re Ready! 💪',
    subtitle: 'Time to generate the perfect program tailored just for you'
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
  { id: 3, label: '3 days' },
  { id: 4, label: '4 days' },
  { id: 5, label: '5 days' },
  { id: 6, label: '6 days' }
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

export const recoveryOptions = [
  { id: 'fast_ready_next_day', label: 'Fast - ready next day' },
  { id: 'need_more_rest', label: 'Need more rest between sessions' },
  { id: 'not_sure', label: 'Not sure yet' }
];

export const durationOptions = [
  { id: 4, label: '4 weeks' },
  { id: 8, label: '8 weeks' },
  { id: 12, label: '12 weeks' }
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