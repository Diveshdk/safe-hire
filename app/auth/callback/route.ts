import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { generateSafeHireId } from "@/lib/utils/crypto"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  
  // "next" is where we want to send the user after successful auth exchange.
  // Default to root if no "next" is provided.
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = getSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // ── Sync Profile from Metadata ──────────────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const supabaseAdmin = getSupabaseAdmin()
        
        // 1. Check if profile exists
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, safe_hire_id")
          .eq("user_id", user.id)
          .maybeSingle()

        const metadata = user.user_metadata || {}
        const fullName = metadata.full_name || metadata.name || "User"
        
        // 2. Upsert profile with metadata + SafeHire ID if missing
        await supabaseAdmin.from("profiles").upsert({
          user_id: user.id,
          full_name: profile?.full_name || fullName,
          role: "job_seeker", // Default role for social signup
          safe_hire_id: profile?.safe_hire_id || generateSafeHireId()
        }, { onConflict: "user_id" })
      }

      // If we are on a recovery flow, redirect to the "next" destination (reset-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error or no code, redirect either to the next page (which will handle session check)
  // or a fallback error page if necessary.
  return NextResponse.redirect(`${origin}${next}`)
}
