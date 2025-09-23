import { createClient } from '@supabase/supabase-js';

// Replace with your Supabase project details
const supabaseUrl = 'https://eiihwogvlqiegnqjcidr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVpaWh3b2d2bHFpZWducWpjaWRyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg2MDk0MDMsImV4cCI6MjA3NDE4NTQwM30.2a_JOBf6LMhAVle0Gzx0l9OuB235Kbx9w5qO1SjSPSs';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
