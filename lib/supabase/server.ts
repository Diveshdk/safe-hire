import { cookies, headers } from "next/headers"
import { createServerClient } from "@supabase/ssr"

export function getSupabaseServer() {
  const cookieStore = cookies()
  
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch (error) {
          // Ignore cookie setting errors in server components
          // This happens when Supabase tries to refresh tokens
        }
      },
    },
  })
}
