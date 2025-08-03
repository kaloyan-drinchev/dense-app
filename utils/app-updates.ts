import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const APP_VERSION = '1.0.0'; // Update this when you release new versions
const LAST_VERSION_KEY = 'last_app_version';

export interface AppUpdate {
  version: string;
  title: string;
  features: string[];
  isImportant: boolean;
}

export class AppUpdateManager {
  
  /**
   * Check if this is the first run after an app update
   */
  static async checkForAppUpdate(): Promise<boolean> {
    try {
      const lastVersion = await AsyncStorage.getItem(LAST_VERSION_KEY);
      
      if (!lastVersion) {
        // First install
        await AsyncStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
        console.log('🎉 First app install detected');
        return false;
      }
      
      if (lastVersion !== APP_VERSION) {
        // App was updated
        console.log(`🔄 App updated from ${lastVersion} to ${APP_VERSION}`);
        await AsyncStorage.setItem(LAST_VERSION_KEY, APP_VERSION);
        return true;
      }
      
      // Same version
      return false;
      
    } catch (error) {
      console.error('❌ Failed to check app update:', error);
      return false;
    }
  }
  
  /**
   * Show update notification to user
   */
  static async showUpdateNotification(): Promise<void> {
    const updateInfo = this.getUpdateInfo(APP_VERSION);
    
    if (updateInfo) {
      const featuresText = updateInfo.features
        .map((feature, index) => `${index + 1}. ${feature}`)
        .join('\n');
      
      Alert.alert(
        `🎉 ${updateInfo.title}`,
        `What's new in version ${updateInfo.version}:\n\n${featuresText}`,
        [
          {
            text: 'Great!',
            style: 'default',
          }
        ]
      );
    }
  }
  
  /**
   * Get update information for a specific version
   */
  private static getUpdateInfo(version: string): AppUpdate | null {
    const updates: Record<string, AppUpdate> = {
      '1.0.0': {
        version: '1.0.0',
        title: 'Welcome to DENSE Fitness!',
        features: [
          'Complete workout tracking system',
          'Local database for offline use',
          'Beautiful dark theme interface',
          'Personalized workout programs'
        ],
        isImportant: false
      },
      '1.1.0': {
        version: '1.1.0',
        title: 'New Features Added!',
        features: [
          'Authentication system with secure login',
          'Content sync for new workout programs',
          'Improved database performance',
          'Enhanced user profile management'
        ],
        isImportant: true
      }
      // Add more versions as you release updates
    };
    
    return updates[version] || null;
  }
  
  /**
   * Get current app version
   */
  static getCurrentVersion(): string {
    return APP_VERSION;
  }
  
  /**
   * Get last known version
   */
  static async getLastVersion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(LAST_VERSION_KEY);
    } catch (error) {
      console.error('❌ Failed to get last version:', error);
      return null;
    }
  }
  
  /**
   * Force show update info for current version (for testing)
   */
  static async showCurrentVersionInfo(): Promise<void> {
    await this.showUpdateNotification();
  }
}