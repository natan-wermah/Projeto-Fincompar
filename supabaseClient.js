// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js'

// Substitua pelos seus dados reais do Supabase
const supabaseUrl = 'https://npwasjczhjqcltdanegx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5wd2FzamN6aGpxY2x0ZGFuZWd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2NjMwMTUsImV4cCI6MjA4NjIzOTAxNX0.c4jUWKDUYlL12L9xeU_XFCquuN__bYN6eeJVHlqHO5o'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})