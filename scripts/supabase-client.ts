/**
 * Supabase Client for Node.js Scripts
 * 
 * This is a simplified version without React Native dependencies
 * for use in seed scripts and migrations.
 * 
 * IMPORTANT: Uses SERVICE ROLE KEY to bypass RLS for system operations.
 * Never expose this key in client-side code!
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eiihwogvlqiegnqjcidr.supabase.co';

// Service role key - bypasses RLS (only for server-side scripts)
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaWh3b2d2bHFpZWducWpjaWRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODYwOTQwMywiZXhwIjoyMDc0MTg1NDAzfQ.IuPqjB46JbSdyX8oPmEbnmKXr0q23ufFFWAoQC21EFo';

// Create Supabase admin client (bypasses RLS)
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

export default supabase;
