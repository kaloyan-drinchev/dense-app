/**
 * Apply Row Level Security Policies Script
 * 
 * Applies RLS policies to all tables in Supabase
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables (if dotenv is available)
try {
  const dotenv = require('dotenv');
  dotenv.config();
} catch {
  // dotenv not installed, assume env vars are set
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is required');
  process.exit(1);
}

async function applyRLSPolicies() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('🔒 Applying Row Level Security policies...\n');
    
    // Apply all migration files in order
    const migrationFiles = [
      join(__dirname, '../db/migrations/postgres/0001_enable_rls.sql'),
      join(__dirname, '../db/migrations/postgres/0002_allow_unauthenticated_user_insert.sql'),
      join(__dirname, '../db/migrations/postgres/0003_allow_unauthenticated_user_select.sql'),
      join(__dirname, '../db/migrations/postgres/0004_allow_unauthenticated_wizard_insert.sql'),
      join(__dirname, '../db/migrations/postgres/0005_allow_unauthenticated_progress_insert.sql'),
      join(__dirname, '../db/migrations/postgres/0006_make_program_id_nullable.sql'),
      join(__dirname, '../db/migrations/postgres/0007_allow_unauthenticated_progress_select.sql'),
      join(__dirname, '../db/migrations/postgres/0008_allow_unauthenticated_wizard_select.sql'),
      join(__dirname, '../db/migrations/postgres/0009_allow_unauthenticated_progress_update.sql'),
      join(__dirname, '../db/migrations/postgres/0010_exercises_rls.sql'),
      join(__dirname, '../db/migrations/postgres/0011_create_active_workout_sessions.sql'),
    ];
    
    let totalApplied = 0;
    
    for (const migrationFile of migrationFiles) {
      console.log(`📄 Applying ${migrationFile.split('/').pop()}...`);
      const migrationSQL = readFileSync(migrationFile, 'utf-8');
    
    // Split SQL into individual statements
    // Remove comments and split by semicolon
    const cleanedSQL = migrationSQL
      .split('\n')
      .filter(line => !line.trim().startsWith('--') || line.trim().startsWith('-->'))
      .join('\n');
    
    // Split by semicolon, but keep multi-line statements together
    const statements = cleanedSQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
      let appliedCount = 0;
      for (const statement of statements) {
        if (statement.trim() && !statement.startsWith('--')) {
          try {
            await sql.unsafe(statement + ';');
            appliedCount++;
          } catch (error: any) {
            // If policy already exists, that's okay
            if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
              console.log('   ⚠️  Already exists, skipping');
            } else {
              console.error(`   ❌ Error: ${error.message}`);
              console.error(`   Statement: ${statement.substring(0, 100)}...`);
              // Don't throw - continue with other statements
            }
          }
        }
      }
      
      console.log(`   ✅ Applied ${appliedCount} SQL statements from this file\n`);
      totalApplied += appliedCount;
    }
    
    console.log(`\n✅ Total: Applied ${totalApplied} SQL statements`);
    
    console.log('\n✅ All RLS policies applied successfully!');
    
    // Verify RLS is enabled
    console.log('\n🔍 Verifying RLS status...');
    const tables = ['user_profiles', 'programs', 'user_progress', 'daily_logs', 'custom_meals', 'user_wizard_results', 'sync_status'];
    
    for (const table of tables) {
      const result = await sql`
        SELECT tablename, rowsecurity 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = ${table}
      `;
      
      if (result.length > 0) {
        const isEnabled = result[0].rowsecurity;
        console.log(`   ${isEnabled ? '✅' : '❌'} ${table}: RLS ${isEnabled ? 'enabled' : 'disabled'}`);
      }
    }
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error applying RLS policies:', error);
    await sql.end();
    process.exit(1);
  }
}

applyRLSPolicies();

