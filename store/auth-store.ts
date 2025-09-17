import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userProfileService, wizardResultsService } from '@/db/services';
import { generateId } from '@/utils/helpers';
import { cloudSyncService, type CloudUser } from '@/services/cloud-sync-service';

export interface User {
  id: string;
  name: string;
  email?: string; // Optional - for cloud sync
  createdAt: string;
  hasCloudAccount?: boolean;
  lastSyncAt?: string;
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

  // Cloud Sync Actions
  createCloudAccount: (email: string) => Promise<{ success: boolean; error?: string }>;
  backupToCloud: () => Promise<{ success: boolean; error?: string }>;
  restoreFromCloud: (email: string) => Promise<{ success: boolean; error?: string; restoredUserId?: string }>;
  checkCloudStatus: () => Promise<void>;
  autoSync: (changedTables: string[]) => Promise<void>;
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
        
        // Clear cloud data
        await cloudSyncService.clearCloudData();
        
        set({ 
          user: null, 
          error: null,
          isLoading: false,
          hasCompletedWizard: false,
          isFirstTime: true
        });
        console.log('✅ User logged out and cloud data cleared');
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
              
              // Check cloud status
              await get().checkCloudStatus();
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

      // Cloud Sync Actions
      createCloudAccount: async (email: string) => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'No user found' };
        }

        set({ isLoading: true, error: null });

        try {
          await cloudSyncService.initialize();
          const result = await cloudSyncService.createCloudAccount(email, user.id);

          if (result.success) {
            // Update user with cloud account info
            const updatedUser = { 
              ...user, 
              email, 
              hasCloudAccount: true,
              lastSyncAt: new Date().toISOString()
            };
            set({ user: updatedUser, isLoading: false });

            // Automatically backup data after creating account
            await get().backupToCloud();

            console.log('✅ Cloud account created and data backed up');
            return { success: true };
          } else {
            set({ isLoading: false, error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Failed to create cloud account';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      backupToCloud: async () => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'No user found' };
        }

        try {
          console.log('☁️ Starting cloud backup...');
          const result = await cloudSyncService.backupUserData(user.id);

          if (result.success) {
            // Update last sync time
            const updatedUser = { ...user, lastSyncAt: new Date().toISOString() };
            set({ user: updatedUser });
            console.log('✅ Cloud backup completed');
            return { success: true };
          } else {
            console.error('❌ Cloud backup failed:', result.error);
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Backup failed';
          console.error('❌ Cloud backup error:', error);
          return { success: false, error: errorMessage };
        }
      },

      restoreFromCloud: async (email: string) => {
        set({ isLoading: true, error: null });

        try {
          console.log('☁️ Starting cloud restore for:', email);
          const result = await cloudSyncService.restoreUserData(email);

          if (result.success && result.restoredUserId) {
            // Update user with restored data
            const restoredUser: User = {
              id: result.restoredUserId,
              name: 'Restored User', // Will be updated when profile is loaded
              email,
              hasCloudAccount: true,
              lastSyncAt: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            };

            set({ 
              user: restoredUser, 
              isLoading: false,
              hasCompletedWizard: true, // Assume wizard was completed if data exists
              isFirstTime: false
            });

            // Reload wizard status to be sure
            await get().checkWizardStatus();

            console.log('✅ Cloud restore completed');
            return { success: true, restoredUserId: result.restoredUserId };
          } else {
            set({ isLoading: false, error: result.error });
            return { success: false, error: result.error };
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Restore failed';
          set({ isLoading: false, error: errorMessage });
          return { success: false, error: errorMessage };
        }
      },

      checkCloudStatus: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const hasCloud = await cloudSyncService.hasCloudAccount();
          const cloudUser = await cloudSyncService.getCloudUser();
          const lastSync = await cloudSyncService.getLastSyncTime();

          if (hasCloud && cloudUser) {
            const updatedUser = {
              ...user,
              email: cloudUser.email,
              hasCloudAccount: true,
              lastSyncAt: lastSync || undefined,
            };
            set({ user: updatedUser });
            console.log('☁️ Cloud status updated');
          }
        } catch (error) {
          console.error('❌ Error checking cloud status:', error);
        }
      },

      autoSync: async (changedTables: string[]) => {
        const { user } = get();
        if (!user || !user.hasCloudAccount) return;

        try {
          await cloudSyncService.autoSync(user.id, changedTables);
          // Update sync time
          const updatedUser = { ...user, lastSyncAt: new Date().toISOString() };
          set({ user: updatedUser });
        } catch (error) {
          console.error('❌ Auto-sync error:', error);
          // Don't show error to user for auto-sync failures
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