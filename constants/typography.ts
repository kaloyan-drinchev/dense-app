import { Platform } from 'react-native';

export const fonts = {
  primary: 'Exo2_400Regular', // Main text font - Exo 2
  primaryBold: 'Exo2_700Bold', // Bold text
  numbers: 'Saira_600SemiBold', // For numbers/timers - Saira
  workoutTimer: 'ArchivoBlack_400Regular', // Special timer for workout session
  system: Platform.OS === 'ios' ? 'System' : 'Roboto',
  mono: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
};

export const typography = {
  // Headers
  h1: {
    fontFamily: fonts.primary,
    fontSize: 32,
    fontWeight: 'normal' as const,
    letterSpacing: -1.5,
  },
  h2: {
    fontFamily: fonts.primary,
    fontSize: 28,
    fontWeight: 'normal' as const,
    letterSpacing: -1,
  },
  h3: {
    fontFamily: fonts.primary,
    fontSize: 24,
    fontWeight: 'normal' as const,
    letterSpacing: -0.5,
  },
  h4: {
    fontFamily: fonts.primary,
    fontSize: 20,
    fontWeight: 'normal' as const,
    letterSpacing: -0.3,
  },
  h5: {
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: 'normal' as const,
    letterSpacing: -0.2,
  },
  
  // Body text
  body: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: 'normal' as const,
    letterSpacing: -0.2,
  },
  bodyLarge: {
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: 'normal' as const,
    letterSpacing: -0.2,
  },
  bodySmall: {
    fontFamily: fonts.primary,
    fontSize: 14,
    fontWeight: 'normal' as const,
    letterSpacing: -0.1,
  },
  
  // Special elements
  button: {
    fontFamily: fonts.primary,
    fontSize: 16,
    fontWeight: 'normal' as const,
    letterSpacing: -0.2,
  },
  buttonLarge: {
    fontFamily: fonts.primary,
    fontSize: 18,
    fontWeight: 'normal' as const,
    letterSpacing: -0.2,
  },
  caption: {
    fontFamily: fonts.primary,
    fontSize: 12,
    fontWeight: 'normal' as const,
    letterSpacing: 0,
  },
  large: {
    fontFamily: fonts.primary,
    fontSize: 22,
    fontWeight: 'normal' as const,
    letterSpacing: -0.3,
  },
  
  // Timer and number specific (Saira)
  timer: {
    fontFamily: fonts.numbers,
    fontSize: 52,
    fontWeight: 'bold' as const,
    letterSpacing: -1,
  },
  timerLarge: {
    fontFamily: fonts.numbers,
    fontSize: 64,
    fontWeight: 'bold' as const,
    letterSpacing: -1.5,
  },
  timerMedium: {
    fontFamily: fonts.numbers,
    fontSize: 28,
    fontWeight: 'bold' as const,
    letterSpacing: -1,
  },
  timerSmall: {
    fontFamily: fonts.numbers,
    fontSize: 16,
    fontWeight: 'bold' as const,
    letterSpacing: -0.5,
  },
  timerTiny: {
    fontFamily: fonts.numbers,
    fontSize: 12,
    fontWeight: 'bold' as const,
    letterSpacing: -0.3,
  },
  
  // Special workout session timer (Archivo Black)
  workoutTimer: {
    fontFamily: fonts.workoutTimer,
    fontSize: 52,
    fontWeight: 'normal' as const,
    letterSpacing: -1,
  },
};
