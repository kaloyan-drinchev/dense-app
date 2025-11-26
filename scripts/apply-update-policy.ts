import postgres from 'postgres';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('Missing DATABASE_URL in .env file');
}

const sql = postgres(databaseUrl);

async function applyUpdatePolicy() {
  console.log('🔒 Applying UPDATE RLS policy for user_progress...\n');

  try {
    // Drop existing UPDATE policy if it exists
    console.log('🗑️ Dropping existing UPDATE policy...');
    try {
      await sql`DROP POLICY IF EXISTS "user_progress_update_policy" ON user_progress`;
      console.log('✅ Dropped existing policy (or it didn\'t exist)');
    } catch (dropError) {
      console.log('⚠️ Drop failed:', dropError);
    }

    // Create new UPDATE policy
    console.log('\n✨ Creating new UPDATE policy...');
    await sql`
      CREATE POLICY "user_progress_update_policy" ON user_progress
        FOR UPDATE
        USING (auth.uid() IS NULL OR auth.uid()::text = user_id::text)
        WITH CHECK (auth.uid() IS NULL OR auth.uid()::text = user_id::text)
    `;
    console.log('✅ UPDATE policy created successfully!');

    // List all policies
    console.log('\n📋 Listing all policies for user_progress:');
    const policies = await sql`
      SELECT policyname, cmd, qual, with_check
      FROM pg_policies
      WHERE tablename = 'user_progress'
    `;
    policies.forEach(p => {
      console.log(`  - ${p.policyname} (${p.cmd})`);
    });

    console.log('\n✅ All done! The app should now be able to update exercise data.');

  } catch (error) {
    console.error('\n❌ Failed to apply policy:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

applyUpdatePolicy()
  .then(() => {
    console.log('\n🏁 Policy application finished');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });

