import { createClient } from '@supabase/supabase-js'

// Not using the generic Database type param here: we don't have real generated
// types yet (`supabase gen types` once the schema stabilizes), and a hand-rolled
// placeholder makes every query resolve to `never`. Row shapes in
// ../types/database.ts are used for manual annotation at call sites instead.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase env vars. Check .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
