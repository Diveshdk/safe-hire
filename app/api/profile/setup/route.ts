import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils/slugify"
import { buildAadhaarKey, extractLast4 } from "@/lib/utils/crypto"

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
    aadhaar_last4,
    aadhaar_verified,
    committee_name 
  } = body as { 
    full_name?: string; 
    role?: string;
    aadhaar_full_name?: string;
    aadhaar_number?: string;   // may be masked display string or raw digits (unused for storage)
    aadhaar_last4?: string;    // preferred: explicit last-4 passed from frontend
    aadhaar_verified?: boolean;
    committee_name?: string;
  }

  if (!role || !["job_seeker", "employee", "employer_admin", "organisation"].includes(role)) {
    return NextResponse.json({ ok: false, message: "Invalid role" }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()

  // ── FINAL FIREWALL: Duplicate check using last-4 + name hash ─────────────
  // This runs even if the Aadhaar step somehow bypassed the earlier check.
  if (aadhaar_verified && aadhaar_full_name) {
    // Resolve last 4 digits: prefer explicit aadhaar_last4, fall back to extracting from aadhaar_number
    const last4 = aadhaar_last4?.replace(/\D/g, "").slice(-4) 
      || extractLast4(aadhaar_number || "")

    if (last4.length === 4) {
      let aadhaarKey: string
      try {
        aadhaarKey = buildAadhaarKey(last4, aadhaar_full_name)
      } catch {
        return NextResponse.json({ ok: false, message: "Invalid identity data." }, { status: 400 })
      }

      // Blacklist check
      const { data: blacklisted } = await supabaseAdmin
        .from("identity_blacklist")
        .select("id")
        .eq("identity_hash", aadhaarKey)
        .maybeSingle()

      if (blacklisted) {
        return NextResponse.json({ 
          ok: false, 
          message: "This identity has been deactivated/erased and cannot be used for a new account." 
        }, { status: 403 })
      }

      const { data: existing, error: dupErr } = await supabaseAdmin
        .from("profiles")
        .select("user_id, role")
        .eq("aadhaar_number", aadhaarKey)
        .neq("user_id", user.id)
        .limit(1)

      if (dupErr) {
        console.error("[profile/setup] Duplicate check error:", dupErr)
        return NextResponse.json({ ok: false, message: `Database error: ${dupErr.message}` }, { status: 500 })
      }

      if (existing && existing.length > 0) {
        const existingRole = existing[0].role
        if (role === "job_seeker" && existingRole === "job_seeker") {
          return NextResponse.json({
            ok: false,
            duplicate: true,
            message: "An account with this identity is already registered as a Job Seeker."
          }, { status: 409 })
        }
      }
    }
  }

  // ── Build the upsert payload ──────────────────────────────────────────────
  const upsertData: any = { 
    user_id: user.id, 
    full_name: full_name ?? null, 
    role 
  }

  if (aadhaar_verified && aadhaar_full_name) {
    const last4 = aadhaar_last4?.replace(/\D/g, "").slice(-4) 
      || extractLast4(aadhaar_number || "")

    upsertData.aadhaar_full_name = aadhaar_full_name
    upsertData.aadhaar_verified = true
    upsertData.aadhaar_verified_at = new Date().toISOString()

    // Only store the hash if we have enough data to build the key
    if (last4.length === 4) {
      try {
        upsertData.aadhaar_number = buildAadhaarKey(last4, aadhaar_full_name)
      } catch {
        // key build failed — store null rather than crashing the registration
        upsertData.aadhaar_number = null
      }
    }
  }

  if (committee_name) {
    upsertData.committee_name = committee_name
    try {
      upsertData.committee_id = slugify(committee_name)
    } catch {/* non-fatal */}
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .upsert(upsertData, { onConflict: "user_id" })

  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })

  // ── Audit log ─────────────────────────────────────────────────────────────
  if (aadhaar_verified) {
    const last4 = aadhaar_last4?.replace(/\D/g, "").slice(-4) 
      || extractLast4(aadhaar_number || "")
    await supabaseAdmin.from("verifications").insert({
      subject_user_id: user.id,
      type: "aadhaar",
      provider: "signup_flow",
      status: "success",
      evidence_ref: last4 || null,   // Only last 4, never full number
    }).throwOnError().then(() => {}).catch(() => {})
  }

  return NextResponse.json({ ok: true })
}
