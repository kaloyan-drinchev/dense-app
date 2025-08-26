import { Platform } from 'react-native';
import * as schema from './schema';

// Only import database modules on native platforms
let drizzle: any = null;
let openDatabaseSync: any = null;

if (Platform.OS !== 'web') {
  try {
    drizzle = require('drizzle-orm/expo-sqlite').drizzle;
    openDatabaseSync = require('expo-sqlite').openDatabaseSync;
  } catch (error) {
    console.warn('Failed to load database modules:', error);
  }
}

export const DATABASE_NAME = 'rork_dense.db';

// Create database variables
let expo_sqlite: any = null;
let db: any = null;

// Only initialize database on native platforms
if (Platform.OS !== 'web') {
  try {
    // Open the SQLite database using legacy API
    expo_sqlite = openDatabaseSync(DATABASE_NAME);
    
    // Create the Drizzle database instance
    db = drizzle(expo_sqlite, { schema });
    
    console.log('✅ Database initialized for platform:', Platform.OS);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
  }
} else {
  console.log('⚠️ Database not available on web platform');
}

// Export database instances (will be null on web)
export { expo_sqlite, db };

// Export schema for external use
export { schema };