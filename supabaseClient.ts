import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// Debug: Log environment variables (REMOVE IN PRODUCTION)
console.log('🔍 Supabase Config Debug:')
console.log('  URL:', supabaseUrl || '❌ NOT SET')
console.log('  Key:', supabaseAnonKey ? '✅ SET (' + supabaseAnonKey.substring(0, 20) + '...)' : '❌ NOT SET')
console.log('  All env vars:', Object.keys(import.meta.env).filter(k => k.startsWith('VITE_')))

// Warn if variables are missing but don't crash the app
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️ Supabase environment variables are not configured. Some features may not work.')
  console.error('Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Environment Variables')
}

// Create client with defaults if variables are missing (for development)
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
)
