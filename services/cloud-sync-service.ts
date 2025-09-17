import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { 
  userProfileService, 
  userProgressService, 
  dailyLogService, 
  customMealService, 
  wizardResultsService,
  syncStatusService
} from '@/db/services';

// Cloud sync configuration
const CLOUD_API_BASE = 'https://dense-api.vercel.app'; // Replace with your backend URL
const DEVICE_ID_KEY = 'device_id';
const LAST_SYNC_KEY = 'last_sync_timestamp';

export interface CloudUser {
  id: string;
  email: string;
  deviceId: string;
  createdAt: string;
  lastSyncAt?: string;
}

export interface CloudBackupData {
  userId: string;
  deviceId: string;
  timestamp: string;
  data: {
    userProfile?: any;
    userProgress?: any;
    dailyLogs?: any[];
    customMeals?: any[];
    wizardResults?: any;
  };
}

export interface SyncResult {
  success: boolean;
  message: string;
  syncedTables?: string[];
  error?: string;
}

class CloudSyncService {
  private deviceId: string | null = null;
  private isInitialized = false;

  /**
   * Initialize cloud sync service
   */
  async initialize(): Promise<void> {
    try {
      this.deviceId = await this.getOrCreateDeviceId();
      this.isInitialized = true;
      console.log('☁️ Cloud sync service initialized with device:', this.deviceId);
    } catch (error) {
      console.error('❌ Failed to initialize cloud sync:', error);
      throw error;
    }
  }

  /**
   * Get or create unique device ID
   */
  private async getOrCreateDeviceId(): Promise<string> {
    try {
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
      
      if (!deviceId) {
        // Create unique device ID
        deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        console.log('📱 Created new device ID:', deviceId);
      }
      
      return deviceId;
    } catch (error) {
      console.error('❌ Error managing device ID:', error);
      throw error;
    }
  }

  /**
   * Create cloud user account with email
   */
  async createCloudAccount(email: string, userId: string): Promise<{ success: boolean; cloudUser?: CloudUser; error?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('☁️ Creating cloud account for:', email);

      const cloudUser: CloudUser = {
        id: userId,
        email,
        deviceId: this.deviceId!,
        createdAt: new Date().toISOString(),
      };

      // Call your backend API to create account
      const response = await fetch(`${CLOUD_API_BASE}/api/users/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cloudUser),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create cloud account');
      }

      const result = await response.json();
      console.log('✅ Cloud account created successfully');
      
      // Store cloud user info locally
      await AsyncStorage.setItem('cloud_user', JSON.stringify(result.user));
      
      return { success: true, cloudUser: result.user };
    } catch (error) {
      console.error('❌ Error creating cloud account:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error creating account' 
      };
    }
  }

  /**
   * Backup all user data to cloud
   */
  async backupUserData(userId: string): Promise<SyncResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('☁️ Starting full backup for user:', userId);

      // Gather all user data
      const [userProfile, userProgress, dailyLogs, customMeals, wizardResults] = await Promise.all([
        userProfileService.getById(userId),
        userProgressService.getByUserId(userId),
        dailyLogService.getByUserId(userId),
        customMealService.getByUserId(userId),
        wizardResultsService.getByUserId(userId),
      ]);

      const backupData: CloudBackupData = {
        userId,
        deviceId: this.deviceId!,
        timestamp: new Date().toISOString(),
        data: {
          userProfile,
          userProgress,
          dailyLogs,
          customMeals,
          wizardResults,
        },
      };

      console.log('📦 Backup data prepared:', {
        userProfile: !!userProfile,
        userProgress: !!userProgress,
        dailyLogsCount: dailyLogs?.length || 0,
        customMealsCount: customMeals?.length || 0,
        wizardResults: !!wizardResults,
      });

      // Send to cloud
      const response = await fetch(`${CLOUD_API_BASE}/api/backup/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backupData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Backup failed');
      }

      // Update sync status
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      await this.updateTableSyncStatus(['userProfiles', 'userProgress', 'dailyLogs', 'customMeals', 'userWizardResults']);

      console.log('✅ Backup completed successfully');
      return {
        success: true,
        message: 'All data backed up successfully',
        syncedTables: ['userProfiles', 'userProgress', 'dailyLogs', 'customMeals', 'userWizardResults'],
      };
    } catch (error) {
      console.error('❌ Backup failed:', error);
      return {
        success: false,
        message: 'Backup failed',
        error: error instanceof Error ? error.message : 'Unknown backup error',
      };
    }
  }

  /**
   * Restore user data from cloud
   */
  async restoreUserData(email: string, userId?: string): Promise<SyncResult & { restoredUserId?: string }> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      console.log('☁️ Starting data restore for email:', email);

      // Get backup from cloud
      const response = await fetch(`${CLOUD_API_BASE}/api/backup/restore`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          deviceId: this.deviceId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Restore failed');
      }

      const { backup } = await response.json();
      
      if (!backup || !backup.data) {
        return {
          success: false,
          message: 'No backup data found for this account',
        };
      }

      console.log('📦 Backup data received from cloud:', {
        userProfile: !!backup.data.userProfile,
        userProgress: !!backup.data.userProgress,
        dailyLogsCount: backup.data.dailyLogs?.length || 0,
        customMealsCount: backup.data.customMeals?.length || 0,
        wizardResults: !!backup.data.wizardResults,
      });

      // Restore each data type
      const restoredTables: string[] = [];
      let restoredUserId = userId || backup.userId;

      // 1. Restore user profile
      if (backup.data.userProfile) {
        const existingProfile = await userProfileService.getById(restoredUserId);
        if (existingProfile) {
          await userProfileService.update(restoredUserId, backup.data.userProfile);
        } else {
          await userProfileService.create({ ...backup.data.userProfile, id: restoredUserId });
        }
        restoredTables.push('userProfiles');
        console.log('✅ User profile restored');
      }

      // 2. Restore user progress
      if (backup.data.userProgress) {
        const existingProgress = await userProgressService.getByUserId(restoredUserId);
        if (existingProgress) {
          await userProgressService.update(existingProgress.id, backup.data.userProgress);
        } else {
          await userProgressService.create({ ...backup.data.userProgress, userId: restoredUserId });
        }
        restoredTables.push('userProgress');
        console.log('✅ User progress restored');
      }

      // 3. Restore daily logs
      if (backup.data.dailyLogs && backup.data.dailyLogs.length > 0) {
        for (const log of backup.data.dailyLogs) {
          const existing = await dailyLogService.getByUserAndDate(restoredUserId, log.date);
          if (existing) {
            await dailyLogService.update(existing.id, { ...log, userId: restoredUserId });
          } else {
            await dailyLogService.create({ ...log, userId: restoredUserId });
          }
        }
        restoredTables.push('dailyLogs');
        console.log(`✅ ${backup.data.dailyLogs.length} daily logs restored`);
      }

      // 4. Restore custom meals
      if (backup.data.customMeals && backup.data.customMeals.length > 0) {
        for (const meal of backup.data.customMeals) {
          const existing = await customMealService.getById(meal.id);
          if (existing) {
            await customMealService.update(meal.id, { ...meal, userId: restoredUserId });
          } else {
            await customMealService.create({ ...meal, userId: restoredUserId });
          }
        }
        restoredTables.push('customMeals');
        console.log(`✅ ${backup.data.customMeals.length} custom meals restored`);
      }

      // 5. Restore wizard results
      if (backup.data.wizardResults) {
        const existing = await wizardResultsService.getByUserId(restoredUserId);
        if (existing) {
          await wizardResultsService.update(existing.id, { ...backup.data.wizardResults, userId: restoredUserId });
        } else {
          await wizardResultsService.create({ ...backup.data.wizardResults, userId: restoredUserId });
        }
        restoredTables.push('userWizardResults');
        console.log('✅ Wizard results restored');
      }

      // Update sync status
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
      await this.updateTableSyncStatus(restoredTables);

      console.log('🎉 Full data restore completed successfully');
      return {
        success: true,
        message: `Restored ${restoredTables.length} data tables successfully`,
        syncedTables: restoredTables,
        restoredUserId,
      };
    } catch (error) {
      console.error('❌ Restore failed:', error);
      return {
        success: false,
        message: 'Data restore failed',
        error: error instanceof Error ? error.message : 'Unknown restore error',
      };
    }
  }

  /**
   * Auto-sync specific data changes
   */
  async autoSync(userId: string, changedTables: string[]): Promise<void> {
    if (!this.isInitialized) {
      return; // Skip auto-sync if not initialized
    }

    try {
      console.log('🔄 Auto-syncing changes for tables:', changedTables);
      
      // For now, just do a full backup
      // In a production app, you'd sync only changed data
      await this.backupUserData(userId);
      
      console.log('✅ Auto-sync completed');
    } catch (error) {
      console.error('❌ Auto-sync failed:', error);
      // Don't throw - auto-sync failures shouldn't break the app
    }
  }

  /**
   * Check if user has cloud account
   */
  async hasCloudAccount(): Promise<boolean> {
    try {
      const cloudUser = await AsyncStorage.getItem('cloud_user');
      return !!cloudUser;
    } catch {
      return false;
    }
  }

  /**
   * Get cloud user info
   */
  async getCloudUser(): Promise<CloudUser | null> {
    try {
      const cloudUserStr = await AsyncStorage.getItem('cloud_user');
      return cloudUserStr ? JSON.parse(cloudUserStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Get last sync timestamp
   */
  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_SYNC_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Update sync status for tables
   */
  private async updateTableSyncStatus(tables: string[]): Promise<void> {
    const timestamp = new Date().toISOString();
    
    for (const table of tables) {
      try {
        await syncStatusService.updateSyncStatus(table, {
          lastSyncAt: timestamp,
          syncedAt: timestamp,
        });
      } catch (error) {
        console.warn(`⚠️ Failed to update sync status for ${table}:`, error);
      }
    }
  }

  /**
   * Clear all cloud data (for reset/logout)
   */
  async clearCloudData(): Promise<void> {
    try {
      await AsyncStorage.removeItem('cloud_user');
      await AsyncStorage.removeItem(LAST_SYNC_KEY);
      console.log('🧹 Cloud data cleared');
    } catch (error) {
      console.error('❌ Error clearing cloud data:', error);
    }
  }
}

export const cloudSyncService = new CloudSyncService();
