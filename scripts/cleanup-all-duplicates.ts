import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for deletion

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env file');
}

const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Aggressive cleanup using SQL to delete all duplicates at once
 * Keeps only the latest record for each user
 */
async function cleanupAllDuplicates() {
  console.log('🧹 Starting aggressive cleanup of ALL duplicate user_progress records...');

  try {
    // Use SQL to delete all duplicates except the latest for each user
    // This CTE (Common Table Expression) keeps only the row with the max created_at for each user_id
    const { data, error } = await supabase.rpc('cleanup_duplicate_progress');

    if (error) {
      console.error('❌ RPC function not found, using direct SQL...');
      
      // Fallback: Use raw SQL query
      const deleteQuery = `
        DELETE FROM user_progress
        WHERE id NOT IN (
          SELECT DISTINCT ON (user_id) id
          FROM user_progress
          ORDER BY user_id, created_at DESC
        );
      `;

      const { data: sqlData, error: sqlError, count } = await supabase
        .from('user_progress')
        .delete()
        .not('id', 'in', `(
          SELECT DISTINCT ON (user_id) id
          FROM user_progress
          ORDER BY user_id, created_at DESC
        )`);

      if (sqlError) {
        console.error('❌ SQL query failed, using batch deletion...');
        
        // Final fallback: Get all records and delete in batches
        const { data: allRecords, error: fetchError } = await supabase
          .from('user_progress')
          .select('*')
          .order('user_id', { ascending: true })
          .order('created_at', { ascending: false });

        if (fetchError || !allRecords) {
          throw new Error('Failed to fetch records: ' + fetchError?.message);
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

        // For each user, keep only the latest record
        let totalDeleted = 0;
        for (const [userId, records] of recordsByUser.entries()) {
          if (records.length <= 1) continue;

          console.log(`\n🔍 User ${userId}: ${records.length} records`);
          
          // Sort by created_at descending (latest first)
          records.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );

          // Keep the first (latest) record
          const keepRecord = records[0];
          const deleteIds = records.slice(1).map(r => r.id);

          console.log(`  ✅ Keeping record ${keepRecord.id}`);
          console.log(`  🗑️ Deleting ${deleteIds.length} old records...`);

          // Delete in smaller batches of 100 to avoid Supabase limits
          const BATCH_SIZE = 100;
          for (let i = 0; i < deleteIds.length; i += BATCH_SIZE) {
            const batch = deleteIds.slice(i, i + BATCH_SIZE);
            const { error: batchError } = await supabase
              .from('user_progress')
              .delete()
              .in('id', batch);

            if (batchError) {
              console.error(`  ❌ Batch ${Math.floor(i / BATCH_SIZE) + 1} delete failed:`, batchError);
            } else {
              totalDeleted += batch.length;
              console.log(`  ✅ Deleted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} records (total: ${totalDeleted})`);
            }
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }

        console.log(`\n✅ Cleanup complete! Deleted ${totalDeleted} duplicate records`);
      } else {
        console.log(`✅ SQL cleanup successful!`);
      }
    } else {
      console.log(`✅ RPC cleanup successful!`, data);
    }

    // Verify cleanup
    console.log('\n🔍 Verifying cleanup...');
    const { data: remaining, error: verifyError } = await supabase
      .from('user_progress')
      .select('user_id');

    if (!verifyError && remaining) {
      const userCounts = new Map<string, number>();
      remaining.forEach(r => {
        userCounts.set(r.user_id, (userCounts.get(r.user_id) || 0) + 1);
      });

      console.log(`\n📊 Final state:`);
      console.log(`   Total records: ${remaining.length}`);
      console.log(`   Unique users: ${userCounts.size}`);
      
      const usersWithDuplicates = Array.from(userCounts.entries())
        .filter(([_, count]) => count > 1);

      if (usersWithDuplicates.length > 0) {
        console.log(`\n⚠️ Still have duplicates for ${usersWithDuplicates.length} users:`);
        usersWithDuplicates.forEach(([userId, count]) => {
          console.log(`   User ${userId}: ${count} records`);
        });
        console.log('\n💡 Run this script again to continue cleanup');
      } else {
        console.log(`\n✅ No duplicates remaining!`);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
    throw error;
  }
}

// Run the cleanup
cleanupAllDuplicates()
  .then(() => {
    console.log('\n🏁 Script finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

