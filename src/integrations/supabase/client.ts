import { createClient } from '@supabase/supabase-js'

// TODO: Replace these with your actual Supabase credentials
// Get these from: Supabase Dashboard → Settings → API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://lzuzyjwhwliutqlvgymh.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dXp5andod2xpdXRxbHZneW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY4NjEsImV4cCI6MjA2OTc4Mjg2MX0.mmN5TVtirSyTY5qirPBBoiqu3D0ZyLL6ugM7Xum7sUk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)