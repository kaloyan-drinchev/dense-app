/**
 * Database Adapter
 * 
 * Provides a unified interface for accessing either SQLite (local) or PostgreSQL (cloud)
 * Allows gradual migration from SQLite to PostgreSQL
 * 
 * NOTE: For React Native, PostgreSQL connections use Supabase REST API (not direct pg connections)
 * Direct PostgreSQL connections (pg package) only work in Node.js environments (scripts, migrations)
 */

import { Platform } from 'react-native';
import { db as sqliteDb } from './client';
import * as sqliteSchema from './schema';

// Conditionally import PostgreSQL client (only works in Node.js, not React Native)
let dbPostgres: any = null;
let postgresSchema: any = null;

// Only import PostgreSQL client in Node.js environments (not React Native)
if (Platform.OS === 'web' || typeof process !== 'undefined') {
  try {
    // Dynamic import to avoid errors in React Native
    const postgresModule = require('./client-postgres');
    dbPostgres = postgresModule.dbPostgres;
    postgresSchema = postgresModule.schema;
  } catch (error) {
    // PostgreSQL client not available (e.g., in React Native)
    console.warn('PostgreSQL client not available in this environment:', error);
  }
}

export type DatabaseType = 'sqlite' | 'postgres';

// Feature flag: determine which database to use
// Set USE_POSTGRES=true in environment to enable PostgreSQL
// NOTE: In React Native, this will use Supabase REST API, not direct PostgreSQL
const USE_POSTGRES = 
  process.env.USE_POSTGRES === 'true' ||
  process.env.EXPO_PUBLIC_USE_POSTGRES === 'true';

// Check if we're in a Node.js environment (where direct PostgreSQL works)
const isNodeEnvironment = Platform.OS === 'web' || typeof process !== 'undefined';

// Get the active database type
export function getDatabaseType(): DatabaseType {
  if (USE_POSTGRES && isNodeEnvironment && dbPostgres) {
    return 'postgres';
  }
  return 'sqlite';
}

// Get the active database instance
export function getDatabase() {
  if (USE_POSTGRES && isNodeEnvironment && dbPostgres) {
    return dbPostgres;
  }
  return sqliteDb;
}

// Get the active schema
export function getSchema() {
  if (USE_POSTGRES && isNodeEnvironment && postgresSchema) {
    return postgresSchema;
  }
  return sqliteSchema;
}

// Type-safe database access
// Defaults to SQLite for React Native compatibility
export const db = getDatabase();
export const schema = getSchema();

// Export both databases for advanced use cases
export { sqliteDb };
export { dbPostgres };

// Helper to check if PostgreSQL is available
export function isPostgresAvailable(): boolean {
  try {
    return isNodeEnvironment && !!process.env.DATABASE_URL && !!dbPostgres;
  } catch {
    return false;
  }
}

// Helper to check if we're using PostgreSQL
export function isUsingPostgres(): boolean {
  return USE_POSTGRES && isPostgresAvailable();
}

