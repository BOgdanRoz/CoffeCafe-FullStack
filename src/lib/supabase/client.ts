import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Only the publishable key is used in the browser. Never add a service_role or secret key here.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '';

export const isSupabaseConfigured = supabaseUrl.length > 0 && supabasePublishableKey.length > 0;

// Null when the environment is not configured. The UI shows a clear message instead of crashing.
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured
  ? createClient<Database>(supabaseUrl, supabasePublishableKey)
  : null;
