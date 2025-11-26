/**
 * Database Truncation Service
 * 
 * Provides functions to truncate (delete all data from) database tables.
 * Can be used from both Node.js scripts and React Native app.
 */

import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

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

/**
 * Get Supabase admin client with service role key (bypasses RLS)
 */
async function getSupabaseAdminClient() {
  // Try to use the existing supabaseAdmin from config first
  try {
    const { supabaseAdmin } = await import('@/config/supabase');
    if (supabaseAdmin) {
      return supabaseAdmin;
    }
  } catch (error) {
    // Config not available, create our own client
  }
  
  // Fallback: Create admin client directly
  // SECURITY: Only available in Node.js environment (scripts), never in client app
  const supabaseUrl = 
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL;
  
  const supabaseServiceKey = 
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase service role key. Cannot truncate tables.');
    console.error('   This operation requires SUPABASE_SERVICE_ROLE_KEY environment variable.');
    console.error('   SECURITY: Service role key should ONLY be used in Node.js scripts, never in client app.');
    console.error('   Available config:', {
      hasUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      isNodeEnv: typeof process !== 'undefined',
    });
    throw new Error('Missing Supabase service role key. This operation can only be run from Node.js scripts with SUPABASE_SERVICE_ROLE_KEY environment variable set.');
  }

  console.log('✅ Using service role key for admin operations (Node.js environment)');
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Truncate a single table
 */
async function truncateTable(tableName: string, supabase: Awaited<ReturnType<typeof getSupabaseAdminClient>>): Promise<boolean> {
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

/**
 * Truncate all tables in the database
 * Returns a summary of the operation
 */
export async function truncateAllTables(): Promise<{ success: boolean; successCount: number; errorCount: number }> {
  console.log('🗑️  Starting database truncation...\n');
  console.log('⚠️  WARNING: This will DELETE ALL DATA from all tables!');
  console.log('   Tables to truncate:', TABLES.join(', '));
  console.log('');
  
  try {
    console.log('🔑 Getting Supabase admin client...');
    const supabase = await getSupabaseAdminClient();
    console.log('✅ Admin client obtained');
    
    let successCount = 0;
    let errorCount = 0;
    
    // Truncate each table in order (respecting foreign key constraints)
    for (const tableName of TABLES) {
      const success = await truncateTable(tableName, supabase);
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

