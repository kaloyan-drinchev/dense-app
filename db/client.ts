import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import { Platform } from 'react-native';
import * as schema from './schema';

export const DATABASE_NAME = 'rork_dense.db';

// Create a mock SQLite database that mimics expo-sqlite interface
function createMockSQLiteDatabase() {
  console.log('🔧 Creating mock SQLite database for web...');
  
  return {
    // Synchronous methods (openDatabaseSync interface)
    execSync: (sql: string) => {
      console.log('🔄 Mock execSync:', sql.substring(0, 50) + '...');
      return { lastInsertRowId: 1, changes: 1 };
    },
    runSync: (sql: string, params?: any[]) => {
      console.log('🔄 Mock runSync:', sql.substring(0, 50) + '...');
      return { lastInsertRowId: 1, changes: 1 };
    },
    getFirstSync: (sql: string, params?: any[]) => {
      console.log('🔄 Mock getFirstSync:', sql.substring(0, 50) + '...');
      return null;
    },
    getAllSync: (sql: string, params?: any[]) => {
      console.log('🔄 Mock getAllSync:', sql.substring(0, 50) + '...');
      return [];
    },
    prepareSync: (sql: string) => {
      return {
        executeSync: (params?: any[]) => ({ lastInsertRowId: 1, changes: 1 }),
        getSync: (params?: any[]) => null,
        allSync: (params?: any[]) => [],
      };
    },
    
    // Asynchronous methods (for migrations)
    execAsync: async (sql: string) => {
      console.log('🔄 Mock execAsync:', sql.substring(0, 50) + '...');
      return { lastInsertRowId: 1, changes: 1 };
    },
    runAsync: async (sql: string, params?: any[]) => {
      console.log('🔄 Mock runAsync:', sql.substring(0, 50) + '...');
      return { lastInsertRowId: 1, changes: 1 };
    },
    getFirstAsync: async (sql: string, params?: any[]) => {
      console.log('🔄 Mock getFirstAsync:', sql.substring(0, 50) + '...');
      return null;
    },
    getAllAsync: async (sql: string, params?: any[]) => {
      console.log('🔄 Mock getAllAsync:', sql.substring(0, 50) + '...');
      return [];
    },
    prepareAsync: async (sql: string) => {
      return {
        executeAsync: async (params?: any[]) => ({ lastInsertRowId: 1, changes: 1 }),
        getAsync: async (params?: any[]) => null,
        allAsync: async (params?: any[]) => [],
      };
    },
    
    // Transaction support
    transactionAsync: async (callback: any) => {
      console.log('🔄 Mock transaction executed');
      return callback();
    },
    
    // Database management
    closeAsync: async () => {
      console.log('🔄 Mock database closed');
    },
    closeSync: () => {
      console.log('🔄 Mock database closed (sync)');
    }
  };
}

// Web-compatible database initialization
function initializeDatabase() {
  if (Platform.OS === 'web') {
    // Check if SharedArrayBuffer is now available
    if (typeof SharedArrayBuffer !== 'undefined') {
      console.log('✅ SharedArrayBuffer is available! Trying real database...');
      try {
        return openDatabaseSync(DATABASE_NAME);
      } catch (error) {
        console.warn('⚠️ Real database failed, using mock SQLite database:', error);
        return createMockSQLiteDatabase();
      }
    } else {
      console.warn('❌ SharedArrayBuffer still not available. Using mock SQLite database.');
      return createMockSQLiteDatabase();
    }
  }
  
  try {
    // Try to open database synchronously (works on native)
    return openDatabaseSync(DATABASE_NAME);
  } catch (error) {
    throw error;
  }
}

// Open the SQLite database
export const expo_sqlite = initializeDatabase();

// Create a comprehensive mock database for web that mimics Drizzle's interface
function createMockDatabase() {
  console.log('🔧 Creating mock database for web...');
  
  // Mock result that behaves like a promise and has chainable methods
  const createMockResult = (data = []) => {
    const mockResult = {
      // Promise-like behavior
      then: (fn: any) => {
        if (fn) return Promise.resolve(fn(data));
        return Promise.resolve(data);
      },
      catch: (fn: any) => mockResult,
      finally: (fn: any) => {
        if (fn) fn();
        return mockResult;
      },
      
      // Query building methods
      from: () => mockResult,
      where: () => mockResult,
      limit: () => mockResult,
      offset: () => mockResult,
      orderBy: () => mockResult,
      groupBy: () => mockResult,
      having: () => mockResult,
      values: () => mockResult,
      set: () => mockResult,
      returning: () => mockResult,
      leftJoin: () => mockResult,
      rightJoin: () => mockResult,
      innerJoin: () => mockResult,
      fullJoin: () => mockResult,
      on: () => mockResult,
      onConflictDoNothing: () => mockResult,
      onConflictDoUpdate: () => mockResult,
      
      // Execution methods
      execute: async () => data,
      all: async () => data,
      get: async () => data[0] || null,
      run: async () => ({ lastInsertRowId: 1, changes: 1 }),
    };
    
    return mockResult;
  };
  
  // Main mock database object
  const mockDb = {
    // Query builders
    select: (fields?: any) => createMockResult([]),
    insert: (table: any) => createMockResult([]),
    update: (table: any) => createMockResult([]),
    delete: (table: any) => createMockResult([]),
    
    // Transaction support
    transaction: async (callback: any) => {
      console.log('🔄 Mock transaction executed');
      return callback(mockDb);
    },
    
    // Batch operations
    batch: async (queries: any[]) => {
      console.log('📦 Mock batch executed with', queries.length, 'queries');
      return queries.map(() => ({}));
    },
    
    // Direct execution
    execute: async () => [],
    run: async () => ({ lastInsertRowId: 1, changes: 1 }),
    all: async () => [],
    get: async () => null,
    
    // Schema access (for Drizzle)
    query: new Proxy({}, {
      get: () => createMockResult([])
    }),
    
    // Additional Drizzle properties
    _: {
      schema,
      fullSchema: schema,
      tableNamesMap: {},
    }
  };
  
  // Make the database object extensible for any missing properties
  return new Proxy(mockDb, {
    get: (target: any, prop: string) => {
      if (prop in target) {
        return target[prop];
      }
      
      // For any unknown property, return a mock result
      console.log('🤷‍♂️ Mock database accessed unknown property:', prop);
      return createMockResult([]);
    }
  });
}

// Create the Drizzle database instance or mock for web
export const db = Platform.OS === 'web' 
  ? (() => {
      if (typeof SharedArrayBuffer !== 'undefined' && expo_sqlite && typeof expo_sqlite.execSync === 'function') {
        console.log('🎯 Using real Drizzle database with SharedArrayBuffer support');
        try {
          return drizzle(expo_sqlite as any, { schema });
        } catch (error) {
          console.error('💥 Real Drizzle database creation failed:', error);
          return createMockDatabase();
        }
      } else {
        console.log('🔄 Using mock Drizzle database (using mock SQLite database)');
        return createMockDatabase();
      }
    })()
  : drizzle(expo_sqlite!, { schema });

// Export schema for external use
export { schema };