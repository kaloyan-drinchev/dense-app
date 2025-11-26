import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Cleanup script to remove duplicate user_progress records
 * Keeps only the latest record for each user
 */
async function cleanupDuplicateProgress() {
  console.log('🧹 Starting cleanup of duplicate user_progress records...');

  try {
    // Get all progress records
    const { data: allRecords, error: fetchError } = await supabase
      .from('user_progress')
      .select('*')
      .order('user_id', { ascending: true })
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ Error fetching records:', fetchError);
      return;
    }

    if (!allRecords || allRecords.length === 0) {
      console.log('✅ No records found');
      return;
    }

    console.log(`📊 Found ${allRecords.length} total records`);

    // Group by user_id
    const recordsByUser = new Map<string, any[]>();
    allRecords.forEach(record => {
      if (!recordsByUser.has(record.user_id)) {
        recordsByUser.set(record.user_id, []);
      }
      recordsByUser.get(record.user_id)!.push(record);
    });

    console.log(`👥 Found ${recordsByUser.size} unique users`);

    // Find users with duplicates
    const usersWithDuplicates = Array.from(recordsByUser.entries())
      .filter(([_, records]) => records.length > 1);

    if (usersWithDuplicates.length === 0) {
      console.log('✅ No duplicates found!');
      return;
    }

    console.log(`⚠️ Found ${usersWithDuplicates.length} users with duplicate records`);

    // For each user with duplicates, keep the latest and delete the rest
    let totalDeleted = 0;
    for (const [userId, records] of usersWithDuplicates) {
      console.log(`\n🔍 User ${userId}: ${records.length} records`);
      
      // Sort by created_at descending (latest first)
      records.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Keep the first (latest) record
      const keepRecord = records[0];
      const deleteRecords = records.slice(1);

      console.log(`  ✅ Keeping record ${keepRecord.id} (created: ${keepRecord.created_at})`);
      console.log(`  🗑️ Deleting ${deleteRecords.length} old record(s)`);

      // Delete old records
      for (const record of deleteRecords) {
        const { error: deleteError } = await supabase
          .from('user_progress')
          .delete()
          .eq('id', record.id);

        if (deleteError) {
          console.error(`  ❌ Error deleting record ${record.id}:`, deleteError);
        } else {
          console.log(`  ✅ Deleted record ${record.id} (created: ${record.created_at})`);
          totalDeleted++;
        }
      }
    }

    console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate records`);
    console.log('💡 Run this script again to verify no duplicates remain');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the cleanup
cleanupDuplicateProgress()
  .then(() => {
    console.log('\n🏁 Script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

