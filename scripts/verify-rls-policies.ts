/**
 * Verify Row Level Security Policies Script
 * 
 * Checks if RLS policies are correctly applied
 */

import postgres from 'postgres';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load environment variables
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

async function verifyRLSPolicies() {
  const sql = postgres(DATABASE_URL);
  
  try {
    console.log('🔍 Verifying RLS policies for user_profiles...\n');
    
    // Check current policies
    const policies = await sql`
      SELECT 
        policyname,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      AND tablename = 'user_profiles'
      ORDER BY policyname;
    `;
    
    console.log('Current policies on user_profiles:');
    console.log('─'.repeat(80));
    
    if (policies.length === 0) {
      console.log('❌ No policies found!');
    } else {
      for (const policy of policies) {
        console.log(`\n📋 Policy: ${policy.policyname}`);
        console.log(`   Command: ${policy.cmd}`);
        console.log(`   USING: ${policy.qual || '(none)'}`);
        console.log(`   WITH CHECK: ${policy.with_check || '(none)'}`);
      }
    }
    
    // Check if the unauthenticated insert policy exists
    const insertPolicy = policies.find(p => 
      p.policyname === 'Allow unauthenticated user profile insert' ||
      p.policyname === 'allow_unauthenticated_user_profile_insert'
    );
    
    console.log('\n' + '─'.repeat(80));
    if (insertPolicy) {
      console.log('✅ Unauthenticated INSERT policy found!');
      if (insertPolicy.with_check === 'true' || insertPolicy.with_check === '(true)') {
        console.log('✅ Policy allows unauthenticated inserts (WITH CHECK = true)');
      } else {
        console.log('⚠️  Policy exists but WITH CHECK is not "true"');
        console.log(`   Current WITH CHECK: ${insertPolicy.with_check}`);
      }
    } else {
      console.log('❌ Unauthenticated INSERT policy NOT found!');
      console.log('\n📝 To fix, run this SQL in Supabase SQL Editor:');
      console.log('─'.repeat(80));
      const fixSQL = readFileSync(
        join(__dirname, '../db/migrations/postgres/0002_allow_unauthenticated_user_insert.sql'),
        'utf-8'
      );
      console.log(fixSQL);
      console.log('─'.repeat(80));
    }
    
    await sql.end();
  } catch (error) {
    console.error('❌ Error verifying RLS policies:', error);
    await sql.end();
    process.exit(1);
  }
}

verifyRLSPolicies();

