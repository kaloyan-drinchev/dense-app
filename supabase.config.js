/**
 * Supabase Configuration (Legacy)
 * 
 * This file is kept for backward compatibility.
 * New code should use: import { supabase } from '@/config/supabase'
 * 
 * @deprecated Use '@/config/supabase' instead
 */

// Re-export from new config location
export { supabase, supabaseAdmin, supabaseConfig } from './config/supabase';
export { default } from './config/supabase';
