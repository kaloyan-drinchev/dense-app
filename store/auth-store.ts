import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { userProfileService, wizardResultsService } from '@/db/services';
import { cloudSyncService, type CloudUser } from '@/services/cloud-sync-service';

// Helper to generate a proper UUID v4 (required for PostgreSQL)
function generateUUID(): string {
  // Use crypto.randomUUID() if available (modern browsers/Node.js/React Native)
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback: Generate UUID v4 manually
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

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
  isWizardGenerating?: boolean;

  // Actions
  setupNewUser: (name: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
  checkUserStatus: () => Promise<void>;
  checkWizardStatus: () => Promise<void>;
  setWizardGenerating: (isGenerating: boolean) => void;
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
      isWizardGenerating: false, // Ephemeral state to track wizard generation across remounts

      setWizardGenerating: (isGenerating: boolean) => set({ isWizardGenerating: isGenerating }),

      // Set up new user (first time - no authentication needed)
      setupNewUser: async (name: string) => {
        set({ isLoading: true, error: null });

        try {
          // Setup PIN and biometric preferences
          const userId = generateUUID(); // Generate proper UUID for PostgreSQL
          const userProfile = await userProfileService.create({
            name,
            id: userId, // Pass id explicitly for first-time setup
            profilePicture: null, // Ensure no profile picture by default
          } as any);

          const user: User = {
            id: userId,
            name: name,
            createdAt: userProfile.createdAt || new Date().toISOString(),
          };

          // Clear subscription state for new user (no subscription data should exist)
          const { useSubscriptionStore } = await import('@/store/subscription-store.js');
          useSubscriptionStore.setState({ 
            subscriptionStatus: null, 
            trialStatus: null, 
            hasCheckedStatus: false,
            isLoading: false,
            error: null
          });

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
        
        // Clear subscription state
        const { useSubscriptionStore } = await import('@/store/subscription-store.js');
        useSubscriptionStore.setState({ 
          subscriptionStatus: null, 
          trialStatus: null, 
          hasCheckedStatus: false,
          isLoading: false,
          error: null
        });
        
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
          // Check if wizard results exist
          const wizardResults = await wizardResultsService.getByUserId(state.user.id);
          const hasWizardResults = !!wizardResults;
          
          // IMPORTANT: Wizard completion logic:
          // 1. Wizard results exist = program generated (but wizard NOT completed yet)
          // 2. Wizard completed = subscription flow handled (either subscribed or skipped)
          // 3. If wizard results don't exist, wizard definitely not completed
          
          if (!hasWizardResults) {
            // No wizard results - wizard definitely not completed
            if (state.hasCompletedWizard) {
              set({ hasCompletedWizard: false });
              console.log('🧙 Wizard status: No results found, resetting completion flag');
            } else {
              console.log('🧙 Wizard status: No results, wizard not completed');
            }
          } else {
            // Wizard results exist - check if subscription was actually handled
            // If hasCompletedWizard is true but subscription wasn't handled, reset it
            const { useSubscriptionStore } = await import('@/store/subscription-store.js');
            const subscriptionState = useSubscriptionStore.getState();
            const hasActiveSubscription = subscriptionState.hasActiveSubscription();
            const hasCheckedStatus = subscriptionState.hasCheckedStatus;
            
            // If wizard results exist but subscription status hasn't been checked yet,
            // or if subscription status shows no active subscription/trial,
            // then wizard is NOT completed (we're in subscription phase)
            if (state.hasCompletedWizard && (!hasCheckedStatus || !hasActiveSubscription)) {
              // Flag says completed but subscription wasn't handled - reset it
              console.log('🧙 Wizard status: Results exist but subscription not handled - resetting completion flag');
              console.log('🧙   - hasCheckedStatus:', hasCheckedStatus, 'hasActiveSubscription:', hasActiveSubscription);
              set({ hasCompletedWizard: false });
            } else if (!state.hasCompletedWizard) {
              console.log('🧙 Wizard status: Results exist but wizard not completed (subscription phase)');
            } else {
              console.log('🧙 Wizard status: Results exist and wizard completed');
            }
          }
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