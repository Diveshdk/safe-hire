import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const { 
    full_name, 
    role, 
    aadhaar_full_name, 
    aadhaar_number, 
    aadhaar_verified 
  } = body as { 
    full_name?: string; 
    role?: string;
    aadhaar_full_name?: string;
    aadhaar_number?: string;
    aadhaar_verified?: boolean;
  }

  if (!role || !["job_seeker", "employee", "employer_admin", "organisation"].includes(role)) {
    return NextResponse.json({ ok: false, message: "Invalid role" }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // ── FINAL FIREWALL: Duplicate Aadhaar check ──────────────────────────────
  // Even if the Aadhaar step somehow passed, block here using an admin client to bypass RLS.
  if (aadhaar_verified && aadhaar_number) {
    const normalizedAadhaar = aadhaar_number.replace(/\D/g, "")
    
    const { data: existing, error: dupErr } = await supabaseAdmin
      .from("profiles")
      .select("user_id, role")
      .eq("aadhaar_number", normalizedAadhaar)
      .neq("user_id", user.id) // exclude current user (re-setup case)
      .limit(1)
    
    if (dupErr) {
      console.error("[profile/setup] Duplicate check error:", dupErr)
      return NextResponse.json({ ok: false, message: `Database error: ${dupErr.message}` }, { status: 500 })
    }

    if (existing && existing.length > 0) {
      const existingRole = existing[0].role
      // For job_seekers: only one account per Aadhaar globally
      if (role === "job_seeker" && existingRole === "job_seeker") {
        return NextResponse.json({
          ok: false,
          duplicate: true,
          message: "This Aadhaar card is already registered with another Job Seeker account."
        }, { status: 409 })
      }
    }
  }

  const upsertData: any = { 
    user_id: user.id, 
    full_name: full_name ?? null, 
    role 
  }

  // If identity data is provided (from pre-signup verification), save it now
  if (aadhaar_verified) {
    upsertData.aadhaar_full_name = aadhaar_full_name
    upsertData.aadhaar_number = aadhaar_number ? aadhaar_number.replace(/\D/g, "") : null
    upsertData.aadhaar_verified = true
    upsertData.aadhaar_verified_at = new Date().toISOString()
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(upsertData, { onConflict: "user_id" })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  // Log verification if it happened
  if (aadhaar_verified) {
    await supabase.from("verifications").insert({
      subject_user_id: user.id,
      type: "aadhaar",
      provider: "signup_flow",
      status: "success",
      evidence_ref: aadhaar_number ? aadhaar_number.replace(/\D/g, "").substring(8) : null,
    })
  }

  return NextResponse.json({ ok: true })
}
