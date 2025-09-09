import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userProfileService, wizardResultsService } from '@/db/services';
import { generateId } from '@/utils/helpers';

export interface User {
  id: string;
  name: string;
  email?: string; // Optional - for future cloud sync
  createdAt: string;
}

interface AuthState {
  // State
  isLoading: boolean;
  user: User | null;
  error: string | null;
  hasCompletedWizard: boolean;
  isFirstTime: boolean;

  // Actions
  setupNewUser: (name: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  checkUserStatus: () => Promise<void>;
  checkWizardStatus: () => Promise<void>;
  setWizardCompleted: () => void;
  updateUser: (updates: Partial<User>) => void;
  checkIfFirstTime: () => Promise<boolean>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      isLoading: false,
      user: null,
      error: null,
      hasCompletedWizard: false,
      isFirstTime: true,

      // Set up new user (first time - no authentication needed)
      setupNewUser: async (name: string) => {
        set({ isLoading: true, error: null });

        try {
          // Setup PIN and biometric preferences
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

      // Logout function (simplified - just clears data)
      logout: async () => {
        // Clear workout store user profile
        const { useWorkoutStore } = await import('@/store/workout-store');
        useWorkoutStore.getState().clearUserProfile();
        
        set({ 
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

      // Check user status (simplified - just check if user exists)
      checkUserStatus: async () => {
        const state = get();
        if (state.user) {
          // Validate that the user actually exists in database
          try {
            const profiles = await userProfileService.getAll();
            const userExists = profiles.some(p => p.id === state.user?.id);
            
            if (userExists) {
              console.log('✅ User status verified:', state.user.name);
              
              // Also check wizard status
              await get().checkWizardStatus();
            } else {
              // User missing - reset to first time state
              console.log('⚠️ User missing - resetting to first time state');
              set({ 
                user: null, 
                hasCompletedWizard: false,
                isFirstTime: true 
              });
            }
          } catch (error) {
            console.error('❌ Error validating user status:', error);
            // Reset to safe state on error
            set({ 
              user: null, 
              hasCompletedWizard: false,
              isFirstTime: true 
            });
          }
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
          const isFirstTime = profiles.length === 0;
          
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
        user: state.user,
        hasCompletedWizard: state.hasCompletedWizard,
        isFirstTime: state.isFirstTime,
      }),
    }
  )
);