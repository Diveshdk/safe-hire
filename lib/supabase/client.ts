"use client"

import { createBrowserClient } from "@supabase/ssr"

let browserClient: ReturnType<typeof createBrowserClient> | null = null

export function getSupabaseBrowser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      `Missing Supabase env vars. NEXT_PUBLIC_SUPABASE_URL=${url ?? "MISSING"}, NEXT_PUBLIC_SUPABASE_ANON_KEY=${key ? "set" : "MISSING"}`
    )
  }

  // Only reuse cached client if it was created with the same credentials
  if (!browserClient) {
    browserClient = createBrowserClient(url, key)
  }

  return browserClient
}
