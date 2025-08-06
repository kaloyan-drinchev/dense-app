import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userProfileService, wizardResultsService } from '@/db/services';

export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  error: string | null;
  hasCompletedWizard: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (email: string, password: string, name: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  clearError: () => void;
  checkAuthStatus: () => Promise<void>;
  checkWizardStatus: () => Promise<void>;
  setWizardCompleted: () => void;
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

      // Login function
      login: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          if (!email || !password) {
            set({ isLoading: false, error: 'Please enter both email and password' });
            return { success: false, error: 'Please enter both email and password' };
          }

          // Simulate login delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Check if user exists in local database
          const userProfile = await userProfileService.getById(email);
          
          if (!userProfile) {
            // User doesn't exist - show proper error
            const errorMessage = 'No account found with this email. Please register first.';
            set({ isLoading: false, error: errorMessage });
            console.log('❌ Login failed: User not found for email:', email);
            return { success: false, error: errorMessage };
          }

          // TODO: In a real app, you would validate the password here
          // For now, we're just checking if the user exists in the database

          const user: User = {
            id: userProfile.id,
            email: userProfile.email || '',
            name: userProfile.name || '',
            createdAt: userProfile.createdAt || '',
          };

          // Check if user has completed wizard
          const hasWizard = await wizardResultsService.hasCompletedWizard(user.email);

          set({ 
            isAuthenticated: true, 
            isLoading: false, 
            user,
            error: null,
            hasCompletedWizard: hasWizard
          });

          console.log('✅ User logged in successfully:', user.email);
          console.log('🧙 Wizard completed:', hasWizard);
          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Login failed';
          set({ isLoading: false, error: errorMessage });
          console.error('❌ Login error:', error);
          return { success: false, error: errorMessage };
        }
      },

      // Register function
      register: async (email: string, password: string, name: string) => {
        set({ isLoading: true, error: null });

        try {
          if (!email || !password || !name) {
            set({ isLoading: false, error: 'Please fill in all fields' });
            return { success: false, error: 'Please fill in all fields' };
          }

          // Check if user already exists
          const existingUser = await userProfileService.getById(email);
          if (existingUser) {
            set({ isLoading: false, error: 'User already exists with this email' });
            return { success: false, error: 'User already exists with this email' };
          }

          // Simulate registration delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Create new user profile in local database
          const userProfile = await userProfileService.create({
            name,
            email,
          });

          // Update the ID to be the email for easy lookup
          const updatedProfile = await userProfileService.update(userProfile.id, {
            id: email,
          });

          const user: User = {
            id: email,
            email: email,
            name: name,
            createdAt: updatedProfile?.createdAt || new Date().toISOString(),
          };

          set({ 
            isAuthenticated: true, 
            isLoading: false, 
            user,
            error: null,
            hasCompletedWizard: false // New users haven't completed wizard yet
          });

          console.log('✅ User registered successfully:', user.email);
          console.log('🧙 Wizard status: Not completed (new user)');
          return { success: true };

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Registration failed';
          set({ isLoading: false, error: errorMessage });
          console.error('❌ Registration error:', error);
          return { success: false, error: errorMessage };
        }
      },

      // Logout function
      logout: () => {
        set({ 
          isAuthenticated: false, 
          user: null, 
          error: null,
          isLoading: false,
          hasCompletedWizard: false
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
          console.log('✅ Auth state restored for user:', state.user.email);
          
          // Also check wizard status
          await get().checkWizardStatus();
        }
      },

      // Check wizard completion status
      checkWizardStatus: async () => {
        const state = get();
        if (state.user) {
          const hasWizard = await wizardResultsService.hasCompletedWizard(state.user.email);
          set({ hasCompletedWizard: hasWizard });
          console.log('🧙 Wizard status checked:', hasWizard);
        }
      },

      // Mark wizard as completed
      setWizardCompleted: () => {
        set({ hasCompletedWizard: true });
        console.log('🧙 Wizard marked as completed');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        hasCompletedWizard: state.hasCompletedWizard,
      }),
    }
  )
);