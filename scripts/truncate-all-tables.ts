/**
 * Truncate All Tables Script
 * 
 * This script truncates (deletes all data from) all tables in the Supabase database.
 * It uses the admin client with service role key to bypass RLS policies.
 * 
 * Usage: npm run db:truncate-all
 * 
 * NOTE: This is a standalone Node.js script and cannot import React Native dependencies.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create admin client with service role key (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TABLES = [
  // Tables with foreign key dependencies (must be deleted first)
  'user_progress',
  'daily_logs',
  'custom_meals',
  'user_wizard_results',
  
  // Tables without dependencies
  'user_profiles',
  'programs',
  'sync_status',
] as const;

async function truncateTable(tableName: string): Promise<boolean> {
  try {
    console.log(`🗑️  Truncating table: ${tableName}...`);
    
    // First, get all IDs to see how many rows we're deleting
    const { data: allRows, error: fetchError } = await supabase
      .from(tableName)
      .select('id')
      .limit(10000); // Limit to prevent memory issues
    
    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No rows found - table is empty
        console.log(`   ℹ️  Table ${tableName} is already empty`);
        return true;
      }
      console.warn(`⚠️  Could not fetch rows from ${tableName}:`, fetchError.message);
      console.warn(`   Error code: ${fetchError.code}, Details:`, fetchError);
    }
    
    const rowCount = allRows?.length || 0;
    
    if (rowCount === 0) {
      console.log(`   ℹ️  Table ${tableName} is already empty`);
      return true;
    }
    
    console.log(`   📊 Found ${rowCount} row(s) to delete`);
    
    // Delete all rows using a condition that matches all rows
    // We'll use a trick: select all IDs and delete them
    if (rowCount > 0 && allRows) {
      const ids = allRows.map(row => row.id);
      
      // Delete in batches to avoid URL length limits
      const batchSize = 100;
      let deletedInBatches = 0;
      for (let i = 0; i < ids.length; i += batchSize) {
        const batch = ids.slice(i, i + batchSize);
        const { error, count } = await supabase
          .from(tableName)
          .delete()
          .in('id', batch);
        
        if (error) {
          console.error(`   ❌ Error deleting batch ${Math.floor(i / batchSize) + 1}:`, error.message);
          console.error(`   Error code: ${error.code}, Details:`, error);
          throw error;
        }
        deletedInBatches += batch.length;
        console.log(`   ✅ Deleted batch ${Math.floor(i / batchSize) + 1} (${batch.length} row(s))`);
      }
      console.log(`✅ Successfully truncated: ${tableName} (${deletedInBatches} row(s) deleted)`);
    } else {
      // Fallback: Try to delete using a condition that matches all
      // This works if there are no rows or if we can't fetch them
      const { error, count } = await supabase
        .from(tableName)
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // This should match all rows
    
      if (error) {
        if (error.code === 'PGRST116') {
          // No rows to delete
          console.log(`   ℹ️  Table ${tableName} is already empty (fallback)`);
          return true;
        }
        throw error;
      }
      console.log(`✅ Successfully truncated: ${tableName} (fallback method, ${count || 'unknown'} row(s) deleted)`);
    }
    
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to truncate ${tableName}:`, error.message);
    console.error(`   Error code: ${error.code || 'N/A'}`);
    console.error(`   Error details:`, error);
    return false;
  }
}

async function truncateAllTables() {
  console.log('🗑️  Starting database truncation...\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA from all tables!');
  console.log('   Tables to truncate:', TABLES.join(', '));
  console.log('');
  
  try {
    let successCount = 0;
    let errorCount = 0;
    
    // Truncate each table in order (respecting foreign key constraints)
    for (const tableName of TABLES) {
      const success = await truncateTable(tableName);
      if (success) {
        successCount++;
      } else {
        errorCount++;
      }
      console.log(''); // Empty line for readability
    }
    
    console.log('📊 Truncation Summary:');
    console.log(`   ✅ Success: ${successCount} table(s)`);
    console.log(`   ❌ Failed: ${errorCount} table(s)`);
    console.log('');
    
    if (errorCount === 0) {
      console.log('✅ All tables truncated successfully!');
    } else {
      console.log('⚠️  Some tables failed to truncate. Check the errors above.');
    }
    
    return {
      success: errorCount === 0,
      successCount,
      errorCount
    };
  } catch (error: any) {
    console.error('❌ Fatal error during truncation:', error);
    throw error;
  }
}

// Run the truncation
truncateAllTables()
  .then((result) => {
    if (result.success) {
      console.log('\n✅ Script completed successfully.');
      console.log('🔄 You can now restart the app and start fresh.');
      process.exit(0);
    } else {
      console.log('\n⚠️  Script completed with errors.');
      console.log('💡 You may need to manually truncate failed tables in Supabase dashboard.');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

