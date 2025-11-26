import { defineConfig } from 'drizzle-kit';

// Load environment variables (if dotenv is available)
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  // dotenv not installed, assume env vars are set
}

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required for PostgreSQL migrations');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './db/schema-postgres.ts',
  out: './db/migrations/postgres',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
});

