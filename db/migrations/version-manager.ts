import { expo_sqlite } from '../client';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CURRENT_DB_VERSION = 3;
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
      case 2:
        await this.migrationV2();
        break;
      case 3:
        await this.migrationV3();
        break;
      // Add more migrations as needed
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
   * Migration to version 2 - DENSE V1 9-Step Onboarding Schema
   */
  private static async migrationV2(): Promise<void> {
    console.log('📝 Running migration V2: DENSE V1 9-Step Onboarding Schema');
    
    try {
      // Add new columns for 9-step onboarding
      const newColumns = [
        'squat_kg REAL',
        'bench_kg REAL', 
        'deadlift_kg REAL',
        'training_experience TEXT',
        'body_fat_level TEXT',
        'training_days_per_week INTEGER',
        'preferred_training_days TEXT',
        'muscle_priorities TEXT',
        'pump_work_preference TEXT',
        'recovery_profile TEXT',
        'program_duration_weeks INTEGER',
        'generated_split TEXT'
      ];

      for (const column of newColumns) {
        try {
          await expo_sqlite.execAsync(`
            ALTER TABLE user_wizard_results ADD COLUMN ${column};
          `);
          console.log(`✅ Added column: ${column.split(' ')[0]}`);
        } catch (error) {
          // Column might already exist, that's okay
          console.log(`ℹ️ Column ${column.split(' ')[0]} already exists or error adding it`);
        }
      }
      
      console.log('✅ Migration V2 completed: DENSE V1 schema ready');
    } catch (error) {
      console.error('❌ Migration V2 failed:', error);
      throw error;
    }
  }

  /**
   * Migration to version 3 - L Twins Guessing Game Points System
   */
  private static async migrationV3(): Promise<void> {
    console.log('📝 Running migration V3: L Twins Guessing Game Points System');
    
    try {
      // Add L Twins game columns to user_profiles
      const newColumns = [
        'ltwins_points INTEGER DEFAULT 0',
        'ltwins_points_history TEXT',
        'ltwins_game_enabled INTEGER DEFAULT 1'
      ];

      for (const column of newColumns) {
        try {
          await expo_sqlite.execAsync(`
            ALTER TABLE user_profiles ADD COLUMN ${column};
          `);
          console.log(`✅ Added column: ${column.split(' ')[0]}`);
        } catch (error) {
          // Column might already exist, that's okay
          console.log(`ℹ️ Column ${column.split(' ')[0]} already exists or error adding it`);
        }
      }
      
      console.log('✅ Migration V3 completed: L Twins game ready');
    } catch (error) {
      console.error('❌ Migration V3 failed:', error);
      throw error;
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