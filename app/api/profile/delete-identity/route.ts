import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

/**
 * RIGHT TO ERASURE (DPDPA 2023 Compliance)
 * 
 * Allows users to delete their verified identity data.
 * Per user preference, the identity hash is moved to a blacklist 
 * to prevent duplicates, while all PII (Name) is removed.
 */
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  }

  const adminSupabase = getSupabaseAdmin()

  // 1. Fetch current profile identity data
  const { data: profile, error: fetchError } = await adminSupabase
    .from("profiles")
    .select("aadhaar_number, aadhaar_verified")
    .eq("user_id", user.id)
    .single()

  if (fetchError || !profile) {
    return NextResponse.json({ success: false, message: "Profile not found" }, { status: 404 })
  }

  if (!profile.aadhaar_verified || !profile.aadhaar_number) {
    return NextResponse.json({ success: false, message: "No verified identity found to erase" }, { status: 400 })
  }

  try {
    // 2. Insert into identity_blacklist (Audit trail of erasure while preventing duplicates)
    const { error: blacklistError } = await adminSupabase
      .from("identity_blacklist")
      .insert({
        identity_hash: profile.aadhaar_number,
        reason: "User-requested erasure (DPDPA Section 12)"
      })

    if (blacklistError && blacklistError.code !== "23505") { // Ignore if already blacklisted (unique constraint)
      return NextResponse.json({ success: false, message: blacklistError.message }, { status: 500 })
    }

    // 3. Clear PII from profiles table
    const { error: updateError } = await adminSupabase
      .from("profiles")
      .update({
        aadhaar_full_name: null,
        aadhaar_number: null, // Critical: Remove the link from the user profile
        aadhaar_verified: false,
        aadhaar_verified_at: null,
      })
      .eq("user_id", user.id)

    if (updateError) {
      return NextResponse.json({ success: false, message: updateError.message }, { status: 500 })
    }

    // 4. Log the erasure in verifications table
    await adminSupabase.from("verifications").insert({
      subject_user_id: user.id,
      type: "aadhaar_erasure",
      provider: "user_request",
      status: "success",
      evidence_ref: "DPDPA_ERASURE_COMPLETE"
    }).throwOnError().catch(() => {})

    return NextResponse.json({ 
      success: true, 
      message: "Identity data erased successfully. You are no longer verified on SafeHire." 
    })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e.message }, { status: 500 })
  }
}
