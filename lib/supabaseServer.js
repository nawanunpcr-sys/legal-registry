import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServerKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let serverClient

export function getSupabaseServerClient() {
  if (!supabaseUrl || !supabaseServerKey) {
    throw new Error('Missing Supabase environment variables')
  }

  if (!serverClient) {
    serverClient = createClient(supabaseUrl, supabaseServerKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return serverClient
}
