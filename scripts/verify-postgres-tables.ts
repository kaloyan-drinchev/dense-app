/**
 * Verify PostgreSQL Tables Script
 * 
 * Checks if all tables were created successfully in Supabase
 */

import postgres from 'postgres';

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

async function verifyTables() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('🔍 Checking tables in Supabase...\n');
    
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const expectedTables = [
      'custom_meals',
      'daily_logs',
      'programs',
      'sync_status',
      'user_profiles',
      'user_progress',
      'user_wizard_results'
    ];
    
    const foundTables = tables.map((t: any) => t.table_name);
    
    console.log('📊 Found tables:');
    foundTables.forEach((table: string) => {
      const isExpected = expectedTables.includes(table);
      console.log(`   ${isExpected ? '✅' : '⚠️'} ${table}`);
    });
    
    console.log('\n📋 Expected tables:');
    expectedTables.forEach((table: string) => {
      const exists = foundTables.includes(table);
      console.log(`   ${exists ? '✅' : '❌'} ${table}`);
    });
    
    const missingTables = expectedTables.filter(t => !foundTables.includes(t));
    
    if (missingTables.length === 0) {
      console.log('\n✅ All tables created successfully!');
    } else {
      console.log(`\n❌ Missing tables: ${missingTables.join(', ')}`);
      console.log('\n💡 Run the migration SQL manually in Supabase SQL Editor');
    }
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    await sql.end();
    process.exit(1);
  }
}

verifyTables();

