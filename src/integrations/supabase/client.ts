import { createClient } from '@supabase/supabase-js'

// Safely load and validate Supabase credentials; ignore invalid placeholders
const FALLBACK_URL = 'https://lzuzyjwhwliutqlvgymh.supabase.co'
const FALLBACK_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx6dXp5andod2xpdXRxbHZneW1oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMDY4NjEsImV4cCI6MjA2OTc4Mjg2MX0.mmN5TVtirSyTY5qirPBBoiqu3D0ZyLL6ugM7Xum7sUk'

const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined
const envAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined

const isValidHttpUrl = (url?: string) => {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

const isPlaceholder = (val?: string) => !!val && /(PASTE|YOUR|<|>)/i.test(val)

const supabaseUrl = isValidHttpUrl(envUrl) && !isPlaceholder(envUrl) ? envUrl! : FALLBACK_URL
const supabaseAnonKey = envAnonKey && !isPlaceholder(envAnonKey) ? envAnonKey! : FALLBACK_ANON_KEY

if (supabaseUrl === FALLBACK_URL) {
  console.warn('[Supabase] Using fallback credentials. Replace with your own project URL and anon key from Supabase → Settings → API.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
export const SUPABASE_URL = supabaseUrl
