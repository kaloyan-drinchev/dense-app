import { expo_sqlite } from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_DB_VERSION = 1;
const DB_VERSION_KEY = 'database_version';

export class DatabaseVersionManager {
  
  /**
   * Check if database needs migration and run migrations if needed
   */
  static async checkAndMigrate(): Promise<boolean> {
    try {
      console.log('🔄 Checking database version...');
      
      // Get current database version
      const storedVersion = await AsyncStorage.getItem(DB_VERSION_KEY);
      const currentVersion = storedVersion ? parseInt(storedVersion) : 0;
      
      console.log(`📊 Current DB version: ${currentVersion}, Target: ${CURRENT_DB_VERSION}`);
      
      if (currentVersion < CURRENT_DB_VERSION) {
        console.log('🔄 Database migration needed...');
        await this.runMigrations(currentVersion, CURRENT_DB_VERSION);
        await AsyncStorage.setItem(DB_VERSION_KEY, CURRENT_DB_VERSION.toString());
        console.log('✅ Database migration completed');
        return true;
      } else {
        console.log('✅ Database is up to date');
        return false;
      }
      
    } catch (error) {
      console.error('❌ Database migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Run migrations from current version to target version
   */
  private static async runMigrations(fromVersion: number, toVersion: number): Promise<void> {
    for (let version = fromVersion + 1; version <= toVersion; version++) {
      console.log(`🔄 Running migration to version ${version}...`);
      await this.runMigration(version);
    }
  }
  
  /**
   * Run specific migration for a version
   */
  private static async runMigration(version: number): Promise<void> {
    switch (version) {
      case 1:
        await this.migrationV1();
        break;
      // Add more migrations as needed
      // case 2:
      //   await this.migrationV2();
      //   break;
      default:
        console.warn(`⚠️ No migration defined for version ${version}`);
    }
  }
  
  /**
   * Migration to version 1 - Initial database setup
   */
  private static async migrationV1(): Promise<void> {
    console.log('📝 Running migration V1: Initial database setup');
    
    // Add any new columns, tables, or data transformations here
    // Example: Add a new column to existing table
    try {
      await expo_sqlite.execAsync(`
        ALTER TABLE user_profiles ADD COLUMN app_version TEXT DEFAULT '1.0.0';
      `);
      console.log('✅ Added app_version column to user_profiles');
    } catch (error) {
      // Column might already exist, that's okay
      console.log('ℹ️ app_version column already exists or not needed');
    }
    
    // Example: Create a new table for app updates
    try {
      await expo_sqlite.execAsync(`
        CREATE TABLE IF NOT EXISTS app_updates (
          id TEXT PRIMARY KEY,
          version TEXT NOT NULL,
          update_date TEXT DEFAULT (CURRENT_TIMESTAMP),
          features TEXT,
          seen BOOLEAN DEFAULT FALSE
        );
      `);
      console.log('✅ Created app_updates table');
    } catch (error) {
      console.log('ℹ️ app_updates table already exists');
    }
  }
  
  /**
   * Example future migration - Add when you need to change schema
   */
  // private static async migrationV2(): Promise<void> {
  //   console.log('📝 Running migration V2: Add new features');
  //   
  //   // Example: Add new table for social features
  //   await expo_sqlite.execAsync(`
  //     CREATE TABLE IF NOT EXISTS user_achievements (
  //       id TEXT PRIMARY KEY,
  //       user_id TEXT NOT NULL,
  //       achievement_type TEXT NOT NULL,
  //       unlocked_at TEXT DEFAULT (CURRENT_TIMESTAMP),
  //       FOREIGN KEY(user_id) REFERENCES user_profiles(id)
  //     );
  //   `);
  //   
  //   console.log('✅ Added achievements system');
  // }
  
  /**
   * Get current database version
   */
  static async getCurrentVersion(): Promise<number> {
    try {
      const version = await AsyncStorage.getItem(DB_VERSION_KEY);
      return version ? parseInt(version) : 0;
    } catch (error) {
      console.error('❌ Failed to get database version:', error);
      return 0;
    }
  }
  
  /**
   * Force set database version (for testing)
   */
  static async setVersion(version: number): Promise<void> {
    await AsyncStorage.setItem(DB_VERSION_KEY, version.toString());
    console.log(`📝 Database version set to ${version}`);
  }
}