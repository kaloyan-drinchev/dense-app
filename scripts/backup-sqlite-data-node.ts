/**
 * SQLite Data Backup Script (Node.js version)
 * 
 * This script can be run from command line using Node.js.
 * It reads the SQLite database file directly.
 * 
 * Usage:
 *   npx tsx scripts/backup-sqlite-data-node.ts
 * 
 * Requirements:
 *   - SQLite database file must exist
 *   - Database path: ./rork_dense.db (or specify via DATABASE_PATH env var)
 */

import * as fs from 'fs';
import * as path from 'path';
import Database from 'better-sqlite3';

const DATABASE_PATH = process.env.DATABASE_PATH || './rork_dense.db';

interface BackupData {
  timestamp: string;
  version: string;
  databasePath: string;
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

function parseJSONField(value: string | null): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function backupSQLiteDataNode() {
  console.log('🔄 Starting SQLite data backup (Node.js)...');
  console.log(`📁 Database path: ${DATABASE_PATH}`);

  if (!fs.existsSync(DATABASE_PATH)) {
    console.error(`❌ Database file not found: ${DATABASE_PATH}`);
    console.log('💡 Tip: Copy the database file from your device/simulator first');
    console.log('   iOS: ~/Library/Developer/CoreSimulator/Devices/[DEVICE]/data/Containers/Data/Application/[APP]/Documents/rork_dense.db');
    console.log('   Android: /data/data/app.dense/databases/rork_dense.db');
    process.exit(1);
  }

  try {
    const db = new Database(DATABASE_PATH, { readonly: true });
    const timestamp = new Date().toISOString();
    
    const backupData: BackupData = {
      timestamp,
      version: '1.0.0',
      databasePath: DATABASE_PATH,
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
    const profiles = db.prepare('SELECT * FROM user_profiles').all();
    backupData.tables.userProfiles = profiles.map((p: any) => ({
      ...p,
      ltwinsPointsHistory: parseJSONField(p.ltwins_points_history),
    }));
    backupData.stats.totalUsers = profiles.length;
    console.log(`   ✅ Exported ${profiles.length} user profiles`);

    console.log('📊 Exporting programs...');
    const programs = db.prepare('SELECT * FROM programs').all();
    backupData.tables.programs = programs.map((p: any) => ({
      ...p,
      data: parseJSONField(p.data),
    }));
    backupData.stats.totalPrograms = programs.length;
    console.log(`   ✅ Exported ${programs.length} programs`);

    console.log('📊 Exporting user progress...');
    const progress = db.prepare('SELECT * FROM user_progress').all();
    backupData.tables.userProgress = progress.map((p: any) => ({
      ...p,
      completedWorkouts: parseJSONField(p.completed_workouts),
      weeklyWeights: parseJSONField(p.weekly_weights),
    }));
    backupData.stats.totalProgressRecords = progress.length;
    console.log(`   ✅ Exported ${progress.length} progress records`);

    console.log('📊 Exporting daily logs...');
    const logs = db.prepare('SELECT * FROM daily_logs').all();
    backupData.tables.dailyLogs = logs.map((l: any) => ({
      ...l,
      foodEntries: parseJSONField(l.food_entries),
    }));
    backupData.stats.totalDailyLogs = logs.length;
    console.log(`   ✅ Exported ${logs.length} daily logs`);

    console.log('📊 Exporting custom meals...');
    const meals = db.prepare('SELECT * FROM custom_meals').all();
    backupData.tables.customMeals = meals.map((m: any) => ({
      ...m,
      ingredients: parseJSONField(m.ingredients),
      nutrition: parseJSONField(m.nutrition),
    }));
    backupData.stats.totalCustomMeals = meals.length;
    console.log(`   ✅ Exported ${meals.length} custom meals`);

    console.log('📊 Exporting wizard results...');
    const wizard = db.prepare('SELECT * FROM user_wizard_results').all();
    backupData.tables.userWizardResults = wizard.map((w: any) => ({
      ...w,
      motivation: parseJSONField(w.motivation),
      tdeeData: parseJSONField(w.tdee_data),
      preferredTrainingDays: parseJSONField(w.preferred_training_days),
      musclePriorities: parseJSONField(w.muscle_priorities),
      suggestedPrograms: parseJSONField(w.suggested_programs),
      generatedSplit: parseJSONField(w.generated_split),
      preferredWorkoutTypes: parseJSONField(w.preferred_workout_types),
      availableEquipment: parseJSONField(w.available_equipment),
      weaknesses: parseJSONField(w.weaknesses),
      injuries: parseJSONField(w.injuries),
    }));
    backupData.stats.totalWizardResults = wizard.length;
    console.log(`   ✅ Exported ${wizard.length} wizard results`);

    console.log('📊 Exporting sync status...');
    const sync = db.prepare('SELECT * FROM sync_status').all();
    backupData.tables.syncStatus = sync;
    console.log(`   ✅ Exported ${sync.length} sync status records`);

    db.close();

    const jsonData = JSON.stringify(backupData, null, 2);
    const fileName = `sqlite-backup-${new Date().toISOString().split('T')[0]}.json`;
    const outputPath = path.join(process.cwd(), fileName);
    
    fs.writeFileSync(outputPath, jsonData, 'utf8');
    console.log(`✅ Backup saved: ${outputPath}`);

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
  backupSQLiteDataNode()
    .then(() => {
      console.log('✅ Backup script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup script failed:', error);
      process.exit(1);
    });
}

export { backupSQLiteDataNode };

