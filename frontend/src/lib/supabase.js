import { createClient } from '@supabase/supabase-js'

// vite exposes env vars prefixed with VITE_ at build time.
// grab these from supabase -> project settings -> api
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isAuthConfigured = Boolean(url && anonKey)

// null when not configured -- App falls back to demo mode with a console warning
export const supabase = isAuthConfigured ? createClient(url, anonKey) : null
