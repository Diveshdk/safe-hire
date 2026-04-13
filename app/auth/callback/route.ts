import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { generateSafeHireId, buildAadhaarKey, extractLast4 } from "@/lib/utils/crypto"
import { cookies } from "next/headers"

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
      // ── Sync Profile from Metadata & Cookie ────────────────────────────────
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const supabaseAdmin = getSupabaseAdmin()
        
        // 1. Check if profile exists
        const { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, full_name, safe_hire_id, role")
          .eq("user_id", user.id)
          .maybeSingle()

        // 2. Read pending signup data from cookie
        const cookieStore = cookies()
        const pendingDataRaw = cookieStore.get("sb-pending-signup")?.value
        let pendingData: any = null
        if (pendingDataRaw) {
          try {
            pendingData = JSON.parse(decodeURIComponent(pendingDataRaw))
          } catch (e) {
            console.error("Failed to parse pending signup data:", e)
          }
        }

        const metadata = user.user_metadata || {}
        const fullName = metadata.full_name || metadata.name || "User"
        
        // 3. Reconstruct Aadhaar hash if provided in cookie
        let aadhaarHash = null
        if (pendingData?.aadhaar_verified && pendingData?.aadhaar_full_name && pendingData?.aadhaar_last4) {
          try {
            aadhaarHash = buildAadhaarKey(pendingData.aadhaar_last4, pendingData.aadhaar_full_name)
          } catch (err) {
            console.error("Error building Aadhaar key from cookie:", err)
          }
        }

        // 4. Upsert profile with combined data
        await supabaseAdmin.from("profiles").upsert({
          user_id: user.id,
          full_name: profile?.full_name || fullName,
          role: pendingData?.role || profile?.role || "job_seeker",
          certificate_name: pendingData?.certificate_name || null,
          aadhaar_full_name: pendingData?.aadhaar_full_name || null,
          aadhaar_number: aadhaarHash || null,
          aadhaar_verified: !!aadhaarHash,
          aadhaar_verified_at: aadhaarHash ? new Date().toISOString() : null,
          institute_id: pendingData?.institute_id || null,
          committee_id: pendingData?.committee_id || null,
          committee_name: pendingData?.committee_name || null,
          committee_position: pendingData?.committee_position || null,
          safe_hire_id: profile?.safe_hire_id || generateSafeHireId()
        }, { onConflict: "user_id" })

        // 5. Clear the cookie
        if (pendingDataRaw) {
          cookieStore.delete("sb-pending-signup")
        }
      }

      // If we are on a recovery flow, redirect to the "next" destination (reset-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error or no code, redirect either to the next page (which will handle session check)
  // or a fallback error page if necessary.
  return NextResponse.redirect(`${origin}${next}`)
}
