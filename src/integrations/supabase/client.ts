
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Use environment variables if available, fallback to default values for development
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://gvslnylvljmhvlkixmmu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2c2xueWx2bGptaHZsa2l4bW11Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwNjc4MjIsImV4cCI6MjA2MTY0MzgyMn0.eIVqL6Om8awuNtiNKBJKG5sEAjeHumsh2vmE_gtNE6U";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'Content-Type': 'application/json',
      'X-Client-Info': 'lovable-react-client'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  db: {
    schema: 'public'
  }
});
