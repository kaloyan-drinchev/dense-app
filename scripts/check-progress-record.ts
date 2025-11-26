import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProgressRecord() {
  console.log('🔍 Checking user_progress records...\n');

  const userId = '0fce1129-688d-4dc8-ac71-71b1a363791b';
  const recordId = 'bfe3d030-fde9-4dd7-aecc-61429e1f23dd';

  // Check by user_id
  const { data: byUser, error: userError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('user_id', userId);

  console.log(`📊 Records for user ${userId}:`);
  if (userError) {
    console.error('❌ Error:', userError);
  } else {
    console.log(`   Found ${byUser?.length || 0} records`);
    byUser?.forEach(record => {
      console.log(`   - ID: ${record.id}`);
      console.log(`     created_at: ${record.created_at}`);
      console.log(`     weekly_weights: ${JSON.stringify(record.weekly_weights).slice(0, 100)}...`);
    });
  }

  // Check by specific ID
  console.log(`\n🔍 Checking specific record ${recordId}:`);
  const { data: byId, error: idError } = await supabase
    .from('user_progress')
    .select('*')
    .eq('id', recordId)
    .single();

  if (idError) {
    console.error(`❌ Error: ${idError.message} (code: ${idError.code})`);
  } else {
    console.log(`✅ Found record:`, byId);
  }

  // Try to update it
  console.log(`\n🔄 Attempting to update record ${recordId}...`);
  const { data: updateData, error: updateError } = await supabase
    .from('user_progress')
    .update({ weekly_weights: { test: 'value' } })
    .eq('id', recordId)
    .select();

  if (updateError) {
    console.error(`❌ Update failed: ${updateError.message}`);
  } else if (!updateData || updateData.length === 0) {
    console.error(`❌ Update affected zero rows`);
  } else {
    console.log(`✅ Update successful:`, updateData);
  }
}

checkProgressRecord()
  .then(() => {
    console.log('\n🏁 Check finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Check failed:', error);
    process.exit(1);
  });

