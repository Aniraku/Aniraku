import { createClient } from '@supabase/supabase-js'

// ---------------------------------------------------------------------------
// Supabase client — TS port of Aniraku's src/lib/supabase.js (byte-equivalent
// semantics). Same production project as Aniraku (VITE_SUPABASE_URL /
// VITE_SUPABASE_ANON_KEY in .env.local). When either var is missing the app
// runs on a placeholder client with persistence disabled, so every consumer
// can call `supabase.*` unconditionally and gate on `isSupabaseConfigured`
// only where the UI must reflect auth availability.
// ---------------------------------------------------------------------------

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey)

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : createClient('https://placeholder.supabase.co', 'placeholder', {
      auth: { persistSession: false, autoRefreshToken: false },
    })
