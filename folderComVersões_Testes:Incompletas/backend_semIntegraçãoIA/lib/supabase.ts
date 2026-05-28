import { createClient } from '@supabase/supabase-js'

const url  = process.env.NEXT_PUBLIC_SUPABASE_URL!
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Cliente para uso nas páginas e componentes (respeita RLS)
export const supabase = createClient(url, anon)

// Cliente para operações admin (bypassa RLS — usar só em Server Actions / API Routes)
export const supabaseAdmin = createClient(url, serviceRole)
