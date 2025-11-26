/**
 * SQLite Data Backup Script
 * 
 * This script exports all data from the local SQLite database to JSON files
 * for backup and migration purposes.
 * 
 * Usage:
 *   npx tsx scripts/backup-sqlite-data.ts
 */

import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import { db } from '../db/client';
import {
  userProfiles,
  programs,
  userProgress,
  dailyLogs,
  customMeals,
  userWizardResults,
  syncStatus,
} from '../db/schema';
import { eq } from 'drizzle-orm';

interface BackupData {
  timestamp: string;
  version: string;
  tables: {
    userProfiles: any[];
    programs: any[];
    userProgress: any[];
    dailyLogs: any[];
    customMeals: any[];
    userWizardResults: any[];
    syncStatus: any[];
  };
  stats: {
    totalUsers: number;
    totalPrograms: number;
    totalProgressRecords: number;
    totalDailyLogs: number;
    totalCustomMeals: number;
    totalWizardResults: number;
  };
}

async function backupSQLiteData() {
  console.log('🔄 Starting SQLite data backup...');
  console.log(`📱 Platform: ${Platform.OS}`);

  try {
    const timestamp = new Date().toISOString();
    const backupData: BackupData = {
      timestamp,
      version: '1.0.0',
      tables: {
        userProfiles: [],
        programs: [],
        userProgress: [],
        dailyLogs: [],
        customMeals: [],
        userWizardResults: [],
        syncStatus: [],
      },
      stats: {
        totalUsers: 0,
        totalPrograms: 0,
        totalProgressRecords: 0,
        totalDailyLogs: 0,
        totalCustomMeals: 0,
        totalWizardResults: 0,
      },
    };

    console.log('📊 Exporting user profiles...');
    const profiles = await db.select().from(userProfiles);
    backupData.tables.userProfiles = profiles;
    backupData.stats.totalUsers = profiles.length;
    console.log(`   ✅ Exported ${profiles.length} user profiles`);

    console.log('📊 Exporting programs...');
    const programsData = await db.select().from(programs);
    backupData.tables.programs = programsData;
    backupData.stats.totalPrograms = programsData.length;
    console.log(`   ✅ Exported ${programsData.length} programs`);

    console.log('📊 Exporting user progress...');
    const progressData = await db.select().from(userProgress);
    backupData.tables.userProgress = progressData;
    backupData.stats.totalProgressRecords = progressData.length;
    console.log(`   ✅ Exported ${progressData.length} progress records`);

    console.log('📊 Exporting daily logs...');
    const logsData = await db.select().from(dailyLogs);
    backupData.tables.dailyLogs = logsData;
    backupData.stats.totalDailyLogs = logsData.length;
    console.log(`   ✅ Exported ${logsData.length} daily logs`);

    console.log('📊 Exporting custom meals...');
    const mealsData = await db.select().from(customMeals);
    backupData.tables.customMeals = mealsData;
    backupData.stats.totalCustomMeals = mealsData.length;
    console.log(`   ✅ Exported ${mealsData.length} custom meals`);

    console.log('📊 Exporting wizard results...');
    const wizardData = await db.select().from(userWizardResults);
    backupData.tables.userWizardResults = wizardData;
    backupData.stats.totalWizardResults = wizardData.length;
    console.log(`   ✅ Exported ${wizardData.length} wizard results`);

    console.log('📊 Exporting sync status...');
    const syncData = await db.select().from(syncStatus);
    backupData.tables.syncStatus = syncData;
    console.log(`   ✅ Exported ${syncData.length} sync status records`);

    const jsonData = JSON.stringify(backupData, null, 2);
    const fileName = `sqlite-backup-${new Date().toISOString().split('T')[0]}.json`;
    
    if (Platform.OS === 'web') {
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      console.log(`✅ Backup downloaded: ${fileName}`);
    } else {
      const backupDir = `${FileSystem.documentDirectory}backups/`;
      await FileSystem.makeDirectoryAsync(backupDir, { intermediates: true });
      const filePath = `${backupDir}${fileName}`;
      await FileSystem.writeAsStringAsync(filePath, jsonData);
      console.log(`✅ Backup saved: ${filePath}`);
    }

    console.log('\n📈 Backup Statistics:');
    console.log(`   Users: ${backupData.stats.totalUsers}`);
    console.log(`   Programs: ${backupData.stats.totalPrograms}`);
    console.log(`   Progress Records: ${backupData.stats.totalProgressRecords}`);
    console.log(`   Daily Logs: ${backupData.stats.totalDailyLogs}`);
    console.log(`   Custom Meals: ${backupData.stats.totalCustomMeals}`);
    console.log(`   Wizard Results: ${backupData.stats.totalWizardResults}`);
    console.log(`\n✅ Backup completed successfully!`);

    return backupData;
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

if (require.main === module) {
  backupSQLiteData()
    .then(() => {
      console.log('✅ Backup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup script failed:', error);
      process.exit(1);
    });
}

export { backupSQLiteData };

