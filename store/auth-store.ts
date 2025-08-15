import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userProfileService, wizardResultsService } from '@/db/services';
import { biometricAuthService } from '@/services/biometric-auth';
import { generateId } from '@/utils/helpers';

export interface User {
  id: string;
  name: string;
  email?: string; // Optional - for future cloud sync
  createdAt: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  hasCompletedWizard: boolean;
  isFirstTime: boolean;

  // Actions
  authenticateWithBiometric: () => Promise<{ success: boolean; error?: string; cancelled?: boolean }>;
  authenticateWithPIN: (pin: string) => Promise<{ success: boolean; error?: string }>;
  setupNewUser: (name: string, pin: string, enableBiometric: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  checkWizardStatus: () => Promise<void>;
  setWizardCompleted: () => void;
  updateUser: (updates: Partial<User>) => void;
  checkIfFirstTime: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null,
      hasCompletedWizard: false,
      isFirstTime: true,

      // Authenticate with biometric (Face ID/Touch ID)
      authenticateWithBiometric: async () => {
        set({ isLoading: true, error: null });

        try {
          const result = await biometricAuthService.authenticate();
          
          if (result.success) {
            // Get the existing user from local storage
            const profiles = await userProfileService.getAll();
            if (profiles.length === 0) {
              set({ isLoading: false, error: 'No user found. Please set up your account first.' });
              return { success: false, error: 'No user found' };
            }

            const userProfile = profiles[0]; // Since it's single-user app, get first profile
            const user: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email || undefined,
              createdAt: userProfile.createdAt || '',
            };

            // Check wizard status
            const hasWizard = await wizardResultsService.hasCompletedWizard(user.id);

            set({ 
              isAuthenticated: true, 
              isLoading: false, 
              user,
              error: null,
              hasCompletedWizard: hasWizard
            });

            console.log('✅ User authenticated with biometric:', user.name);
            return { success: true };
          } else {
            set({ isLoading: false });
            return { 
              success: false, 
              error: result.error, 
              cancelled: result.cancelled 
            };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          set({ isLoading: false, error: errorMessage });
          console.error('❌ Biometric auth error:', error);
          return { success: false, error: errorMessage };
        }
      },

      // Authenticate with PIN
      authenticateWithPIN: async (pin: string) => {
        set({ isLoading: true, error: null });

        try {
          const isValid = await biometricAuthService.verifyPIN(pin);
          
          if (isValid) {
            // Get the existing user from local storage
            const profiles = await userProfileService.getAll();
            if (profiles.length === 0) {
              set({ isLoading: false, error: 'No user found. Please set up your account first.' });
              return { success: false, error: 'No user found' };
            }

            const userProfile = profiles[0];
            const user: User = {
              id: userProfile.id,
              name: userProfile.name,
              email: userProfile.email || undefined,
              createdAt: userProfile.createdAt || '',
            };

            // Check wizard status
            const hasWizard = await wizardResultsService.hasCompletedWizard(user.id);

            set({ 
              isAuthenticated: true, 
              isLoading: false, 
              user,
              error: null,
              hasCompletedWizard: hasWizard
            });

            console.log('✅ User authenticated with PIN:', user.name);
            return { success: true };
          } else {
            set({ isLoading: false, error: 'Incorrect PIN' });
            return { success: false, error: 'Incorrect PIN' };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
          set({ isLoading: false, error: errorMessage });
          console.error('❌ PIN auth error:', error);
          return { success: false, error: errorMessage };
        }
      },

      // Setup new user (first time)
      setupNewUser: async (name: string, pin: string, enableBiometric: boolean) => {
        set({ isLoading: true, error: null });

        try {
          if (!name || !pin) {
            set({ isLoading: false, error: 'Please provide name and PIN' });
            return { success: false, error: 'Please provide name and PIN' };
          }

          if (pin.length !== 4) {
            set({ isLoading: false, error: 'PIN must be exactly 4 digits' });
            return { success: false, error: 'PIN must be exactly 4 digits' };
          }

          // Check if user already exists (for single-user app, clear existing if any)
          const existingProfiles = await userProfileService.getAll();
          if (existingProfiles.length > 0) {
            // Clear existing data for fresh setup (single-user app)
            await userProfileService.deleteAll();
            await wizardResultsService.deleteAll();
            
            // Also clear the workout store's user profile (which may contain old profile image)
            const { useWorkoutStore } = await import('@/store/workout-store');
            useWorkoutStore.getState().clearUserProfile();
            
            console.log('🔄 Cleared existing user data for fresh setup');
          }

          // Set up PIN
          const pinSet = await biometricAuthService.setupPIN(pin);
          if (!pinSet) {
            set({ isLoading: false, error: 'Failed to set up PIN' });
            return { success: false, error: 'Failed to set up PIN' };
          }

          // Enable biometric if requested and supported
          if (enableBiometric) {
            await biometricAuthService.setBiometricEnabled(true);
          }

          // Create user profile
          const userId = generateId();
          const userProfile = await userProfileService.create({
            name,
            id: userId,
            profilePicture: null, // Ensure no profile picture by default
          });

          const user: User = {
            id: userId,
            name: name,
            createdAt: userProfile.createdAt || new Date().toISOString(),
          };

          set({ 
            isAuthenticated: true, 
            isLoading: false, 
            user,
            error: null,
            hasCompletedWizard: false,
            isFirstTime: false
          });

          console.log('✅ New user set up successfully:', user.name);
          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Setup failed';
          set({ isLoading: false, error: errorMessage });
          console.error('❌ User setup error:', error);
          return { success: false, error: errorMessage };
        }
      },

      // Logout function
      logout: async () => {
        // Clear biometric/PIN data
        await biometricAuthService.clearAuthData();
        
        // Clear workout store user profile
        const { useWorkoutStore } = await import('@/store/workout-store');
        useWorkoutStore.getState().clearUserProfile();
        useWorkoutStore.getState().resetProgress();
        
        set({ 
          isAuthenticated: false, 
          user: null, 
          error: null,
          isLoading: false,
          hasCompletedWizard: false,
          isFirstTime: true
        });
        console.log('✅ User logged out');
      },

      // Clear error
      clearError: () => {
        set({ error: null });
      },

      // Check authentication status (for app startup)
      checkAuthStatus: async () => {
        const state = get();
        if (state.user && !state.isAuthenticated) {
          set({ isAuthenticated: true });
          console.log('✅ Auth state restored for user:', state.user.name);
          
          // Also check wizard status
          await get().checkWizardStatus();
        }
      },

      // Check wizard completion status
      checkWizardStatus: async () => {
        const state = get();
        if (state.user) {
          const hasWizard = await wizardResultsService.hasCompletedWizard(state.user.id);
          set({ hasCompletedWizard: hasWizard });
          console.log('🧙 Wizard status checked:', hasWizard);
        }
      },

      // Mark wizard as completed
      setWizardCompleted: () => {
        set({ hasCompletedWizard: true });
        console.log('🧙 Wizard marked as completed');
      },

      // Update user information
      updateUser: (updates: Partial<User>) => {
        const { user } = get();
        if (user) {
          const updatedUser = { ...user, ...updates };
          set({ user: updatedUser });
          console.log('👤 User updated:', updates);
        }
      },

      // Check if this is first time opening the app
      checkIfFirstTime: async () => {
        try {
          const profiles = await userProfileService.getAll();
          const hasPIN = await biometricAuthService.hasPIN();
          const isFirstTime = profiles.length === 0 || !hasPIN;
          
          set({ isFirstTime });
          console.log('🔍 First time check:', isFirstTime);
          return isFirstTime;
        } catch (error) {
          console.error('❌ Error checking first time status:', error);
          return true; // Assume first time if error
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasCompletedWizard: state.hasCompletedWizard,
        isFirstTime: state.isFirstTime,
      }),
    }
  )
);