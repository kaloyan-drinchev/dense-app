export const colors = {
  // Modern neon green system
  primary: '#00FF88',            // Vibrant neon green
  primaryDark: '#00CC6A',        // Darker green for pressed states
  primaryLight: '#33FFAA',       // Lighter green for highlights
  
  // Gradient colors for modern effects
  gradientStart: '#00FF88',      // Neon green start
  gradientMiddle: '#00DDFF',     // Cyan middle
  gradientEnd: '#7B68EE',       // Purple end
  
  // Dark background system - pure black based
  background: '#000000',         // Pure black main background
  dark: '#000000',              // Pure black for consistency
  darkGray: '#111111',          // Very dark gray for cards
  mediumGray: '#222222',        // Input backgrounds
  lightGray: '#666666',         // Secondary text
  lighterGray: '#999999',       // Tertiary text
  
  // Status colors
  success: '#00FF88',           // Success = primary green
  error: '#FF4444',             // Modern red
  warning: '#FFB347',           // Modern orange
  validationWarning: '#FF6F00', // Warm BMW-style orange for validation
  
  // Standard colors
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.8)',
  transparent: 'transparent',
  
  // Legacy (for compatibility during transition)
  secondary: '#00FF88',         // Map to new primary
  secondaryLight: '#33FFAA',    // Map to new primary light
};

export const programColors = {
  bulking: {
    primary: '#00FF88',
    secondary: '#33FFAA',
    accent: '#00DDFF',
  },
  cutting: {
    primary: '#00FF88',
    secondary: '#00CC6A',
    accent: '#7B68EE',
  }
};

// Gradient presets for modern effects
export const gradients = {
  primary: ['#00FF88', '#00DDFF'],              // Green to cyan
  primaryButton: ['#00FF88', '#00CC6A'],         // Green gradient
  success: ['#00FF88', '#33FFAA'],              // Success gradient
  card: ['#111111', '#1A1A1A'],                 // Subtle card gradient
  background: ['#000000', '#0A0A0A'],           // Background gradient
  neon: ['#00FF88', '#00DDFF', '#7B68EE'],      // Full neon spectrum
  glow: ['rgba(0, 255, 136, 0.3)', 'rgba(0, 255, 136, 0.1)'], // Glow effect
};

// Modern button styles
export const buttonStyles = {
  // Flat gradient button (main style)
  primaryFlat: {
    background: gradients.primaryButton,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    textColor: '#000000', // Black text for better contrast
  },
  
  // Glowing button (for comparison)
  primaryGlow: {
    background: gradients.primaryButton,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    shadowColor: '#00FF88',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    textColor: '#000000', // Black text for better contrast
  },
};