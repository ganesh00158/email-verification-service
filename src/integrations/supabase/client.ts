import { createClient } from '@supabase/supabase-js'

// TODO: Replace these with your actual Supabase credentials
// Get these from: Supabase Dashboard → Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'PASTE_YOUR_SUPABASE_URL_HERE'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'PASTE_YOUR_ANON_KEY_HERE'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)