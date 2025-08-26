import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

export const DATABASE_NAME = 'rork_dense.db';

// Open the SQLite database using legacy API
export const expo_sqlite = openDatabaseSync(DATABASE_NAME);

// Create the Drizzle database instance
export const db = drizzle(expo_sqlite, { schema });

// Export schema for external use
export { schema };