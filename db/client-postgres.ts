import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema-postgres';
import { supabaseConfig } from '@/config/supabase';

// Get database URL from environment
const getDatabaseUrl = (): string => {
  // Try multiple sources for DATABASE_URL
  const url = 
    process.env.DATABASE_URL ||
    (typeof window !== 'undefined' && (window as any).__DATABASE_URL__) ||
    supabaseConfig?.databaseUrl;
  
  if (!url) {
    throw new Error(
      'DATABASE_URL is required for PostgreSQL. ' +
      'Set it in .env file or environment variables.'
    );
  }
  
  return url;
};

// Create PostgreSQL connection pool
let postgresPool: Pool | null = null;
let postgresDb: ReturnType<typeof drizzle> | null = null;

export function getPostgresPool(): Pool {
  if (!postgresPool) {
    const databaseUrl = getDatabaseUrl();
    
    postgresPool = new Pool({
      connectionString: databaseUrl,
      max: 10, // Maximum number of connections
      idleTimeoutMillis: 20000, // Close idle connections after 20 seconds
      connectionTimeoutMillis: 10000, // Connection timeout in milliseconds
    });
  }
  
  return postgresPool;
}

export function getPostgresDb() {
  if (!postgresDb) {
    const pool = getPostgresPool();
    postgresDb = drizzle(pool, { schema });
  }
  
  return postgresDb;
}

// Export the database instance
export const dbPostgres = getPostgresDb();

// Export schema
export { schema };

// Cleanup function (useful for testing or graceful shutdown)
export async function closePostgresConnection() {
  if (postgresPool) {
    await postgresPool.end();
    postgresPool = null;
    postgresDb = null;
  }
}

