/**
 * Supabase Configuration
 * 
 * Loads Supabase credentials from environment variables
 * Falls back to hardcoded values for backward compatibility
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Get environment variables
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://eiihwogvlqiegnqjcidr.supabase.co';

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaWh3b2d2bHFpZWducWpjaWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDk0MDMsImV4cCI6MjA3NDE4NTQwM30.2a_JOBf6LMhAVle0Gzx0l9OuB235Kbx9w5qO1SjSPSs';

// SECURITY: Service role key should NEVER be accessed from client app
// Only available in Node.js scripts (process.env) for CLI/migration tools
const supabaseServiceRoleKey = 
  (typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
  null;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
}

// Create Supabase client for client-side use (with RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Create admin client for server-side operations (bypasses RLS)
// Only use this in migration scripts or server-side code
export const supabaseAdmin = supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;

// Get database URL from environment
const databaseUrl = 
  process.env.DATABASE_URL ||
  null;

// Export configuration
export const supabaseConfig = {
  url: supabaseUrl,
  anonKey: supabaseAnonKey,
  hasServiceRoleKey: !!supabaseServiceRoleKey,
  databaseUrl,
};

export default supabase;

