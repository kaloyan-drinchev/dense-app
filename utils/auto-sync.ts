/**
 * Auto-sync utility for automatically backing up data changes to the cloud
 */

import { useAuthStore } from '@/store/auth-store';

// Debounce timer for batching sync operations
let syncTimeout: NodeJS.Timeout | null = null;
const SYNC_DEBOUNCE_MS = 5000; // Wait 5 seconds after last change before syncing

/**
 * Trigger auto-sync for changed data tables
 * This will debounce multiple calls to avoid excessive API requests
 */
export const triggerAutoSync = (changedTables: string | string[]) => {
  // Clear existing timeout
  if (syncTimeout) {
    clearTimeout(syncTimeout);
  }

  // Convert single table to array
  const tables = Array.isArray(changedTables) ? changedTables : [changedTables];
  
  console.log('🔄 Auto-sync triggered for tables:', tables);

  // Set new timeout to sync after debounce period
  syncTimeout = setTimeout(async () => {
    try {
      const { autoSync, user } = useAuthStore.getState();
      
      if (user?.hasCloudAccount) {
        console.log('☁️ Executing auto-sync for tables:', tables);
        await autoSync(tables);
        console.log('✅ Auto-sync completed');
      } else {
        console.log('⏭️ Skipping auto-sync: no cloud account');
      }
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
    }
  }, SYNC_DEBOUNCE_MS);
};

/**
 * Auto-sync helper hooks for common database operations
 */
export const autoSyncHelpers = {
  /**
   * Call this after creating/updating user profile
   */
  onUserProfileChange: () => triggerAutoSync('userProfiles'),

  /**
   * Call this after workout progress changes
   */
  onWorkoutProgressChange: () => triggerAutoSync('userProgress'),

  /**
   * Call this after nutrition log changes
   */
  onNutritionChange: () => triggerAutoSync('dailyLogs'),

  /**
   * Call this after custom meal changes
   */
  onCustomMealChange: () => triggerAutoSync('customMeals'),

  /**
   * Call this after wizard completion
   */
  onWizardComplete: () => triggerAutoSync('userWizardResults'),

  /**
   * Call this for multiple table changes
   */
  onMultipleChanges: (tables: string[]) => triggerAutoSync(tables),
};

/**
 * Cancel any pending auto-sync operations
 */
export const cancelAutoSync = () => {
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
    console.log('🚫 Auto-sync cancelled');
  }
};

/**
 * Force immediate sync (bypasses debouncing)
 */
export const forceSync = async (tables?: string[]) => {
  try {
    const { autoSync, user } = useAuthStore.getState();
    
    if (user?.hasCloudAccount) {
      console.log('⚡ Force sync for tables:', tables || ['all']);
      await autoSync(tables || ['userProfiles', 'userProgress', 'dailyLogs', 'customMeals', 'userWizardResults']);
      console.log('✅ Force sync completed');
    } else {
      console.log('⏭️ Skipping force sync: no cloud account');
    }
  } catch (error) {
    console.error('❌ Force sync failed:', error);
    throw error;
  }
};
