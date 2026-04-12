import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { buildAadhaarKey, maskAadhaar, extractLast4 } from "@/lib/utils/crypto"
import {
  apisetuInitiateOtp,
  apisetuConfirmOtp,
  demoVerify,
  verifyAadhaarOCR,
  verifyOfflineXml,
} from "@/lib/verification/aadhaar"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()
  const currentUserId = currentUser?.id

  const url = new URL(req.url)
  const modeQuery = url.searchParams.get("mode")
  const isSignup = url.searchParams.get("signup") === "true"
  const isMultipart = req.headers.get("content-type")?.includes("multipart/form-data")

  // ── OCR or Offline XML path (Multipart) ────────────────────────────────────
  if (isMultipart) {
    try {
      const form = await (req as any).formData()
      const file = form.get("file") as File | null
      if (!file) {
        return NextResponse.json({ success: false, message: "Missing file" }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      let res: any

      if (modeQuery === "offline-xml") {
        res = await verifyOfflineXml(buffer.toString())
        // XML might not have the cleartext number; use a placeholder so duplicate check can proceed
        if (res.success && !res.aadhaarNumber) res.aadhaarNumber = "0000"
      } else {
        res = await verifyAadhaarOCR(buffer, file.name)
      }

      if (!res.success || !res.fullName) {
        return NextResponse.json(
          { success: false, message: res.message || "Could not extract details from Aadhaar document." },
          { status: 400 }
        )
      }

      // ── PRIVACY: Extract ONLY the last 4 digits — never store the full number ─
      const last4 = extractLast4(res.aadhaarNumber || "")
      const fullName = res.fullName as string

      // We need at least 4 digits to do the duplicate check
      // (XML flow may not have them — skip check in that case)
      const hasEnoughForCheck = last4.length === 4

      const supabaseAdmin = getSupabaseAdmin()
      const role = url.searchParams.get("role")
      const committeeId = url.searchParams.get("committee_id")

      if (hasEnoughForCheck) {
        let aadhaarKey: string
        try {
          aadhaarKey = buildAadhaarKey(last4, fullName)
        } catch {
          return NextResponse.json({ success: false, message: "Could not process identity data." }, { status: 400 })
        }

        // ── DUPLICATE CHECK ──────────────────────────────────────────────────
        const { data: matches, error: checkError } = await supabaseAdmin
          .from("profiles")
          .select("user_id, role, committee_id")
          .eq("aadhaar_number", aadhaarKey)

        if (checkError) {
          return NextResponse.json({ success: false, message: checkError.message }, { status: 500 })
        }

        // Rules:
        // 1. Job Seeker → one account per identity globally
        // 2. Organisation → one account per committee per identity
        // 3. Blacklist → check if identity hash is erased/blacklisted
        const { data: blacklisted } = await supabaseAdmin
          .from("identity_blacklist")
          .select("id")
          .eq("identity_hash", aadhaarKey)
          .maybeSingle()

        if (blacklisted) {
          return NextResponse.json(
            { success: false, message: "This identity has been deactivated/erased and cannot be used for a new account." },
            { status: 403 }
          )
        }

        const hasJobSeeker = matches?.some((m: any) => m.role === "job_seeker" && m.user_id !== currentUserId)
        const inSameCommittee = committeeId && matches?.some(
          (m: any) => m.committee_id === committeeId && m.user_id !== currentUserId
        )

        if (role === "job_seeker" && hasJobSeeker) {
          return NextResponse.json(
            { success: false, message: "An account with this identity already exists as a Job Seeker." },
            { status: 409 }
          )
        }
        if (inSameCommittee) {
          return NextResponse.json(
            { success: false, message: "You have already registered for this committee with this identity." },
            { status: 409 }
          )
        }

        // ── SIGNUP MODE: Return to frontend; setup API will do the final save ─
        if (isSignup) {
          return NextResponse.json({
            success: true,
            fullName,
            // Return masked display value + last4 for the key — never full 12 digits
            aadhaarNumber: maskAadhaar(last4),
            aadhaarLast4: last4,
          })
        }

        // ── LOGGED-IN USER (post-login verification flow) ────────────────────
        if (!currentUserId) {
          return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })
        }

        const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
          {
            user_id: currentUserId,
            aadhaar_full_name: fullName,
            aadhaar_number: aadhaarKey,      // Store HASH only
            aadhaar_verified: true,
            aadhaar_verified_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        )
        if (upsertError) {
          return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })
        }

        await supabaseAdmin.from("verifications").insert({
          subject_user_id: currentUserId,
          type: "aadhaar",
          provider: modeQuery === "offline-xml" ? "xml" : "ocr",
          status: "success",
          evidence_ref: last4,              // Store only last 4 for audit trail
        }).throwOnError().then(() => {}).catch(() => {})

        return NextResponse.json({
          success: true,
          fullName,
          aadhaarNumber: maskAadhaar(last4),
        })
      }

      // XML path with no number — just return name success
      if (isSignup) {
        return NextResponse.json({ success: true, fullName, aadhaarNumber: null, aadhaarLast4: null })
      }
      if (!currentUserId) {
        return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })
      }
      await supabaseAdmin.from("profiles").upsert(
        { user_id: currentUserId, aadhaar_full_name: fullName, aadhaar_verified: true, aadhaar_verified_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      return NextResponse.json({ success: true, fullName, aadhaarNumber: null })

    } catch (e: any) {
      return NextResponse.json({ success: false, message: e?.message || "Verification error" }, { status: 500 })
    }
  }

  // ── JSON path (API Setu / Demo) ─────────────────────────────────────────────
  const body = await req.json().catch(() => ({}))
  const mode = body.mode || process.env.NEXT_PUBLIC_DEFAULT_AADHAAR_MODE || "apisetu"
  const step = body.step

  try {
    if (mode === "apisetu") {
      if (step === "init") {
        const res = await apisetuInitiateOtp({ uid: body.uid })
        return NextResponse.json(res, res.success ? { status: 200 } : { status: 400 })
      }
      if (step === "confirm") {
        const res = await apisetuConfirmOtp({ txnId: body.txnId, otp: body.otp })
        if (!res.success || !res.fullName) return NextResponse.json(res, { status: 400 })
        // APISetu does not return the UID in its confirmation — no duplicate check possible here
        if (isSignup) return NextResponse.json({ success: true, fullName: res.fullName })
        if (!currentUserId) return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })
        await getSupabaseAdmin().from("profiles").upsert(
          { user_id: currentUserId, aadhaar_full_name: res.fullName, aadhaar_verified: true, aadhaar_verified_at: new Date().toISOString() },
          { onConflict: "user_id" }
        )
        return NextResponse.json({ success: true, fullName: res.fullName })
      }
    }

    if (mode === "demo") {
      const res = await demoVerify({ fullName: body.fullName })
      if (!res.success || !res.fullName) return NextResponse.json(res, { status: 400 })
      if (isSignup) return NextResponse.json({ success: true, fullName: res.fullName })
      if (!currentUserId) return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })
      await getSupabaseAdmin().from("profiles").upsert(
        { user_id: currentUserId, aadhaar_full_name: res.fullName, aadhaar_verified: true, aadhaar_verified_at: new Date().toISOString() },
        { onConflict: "user_id" }
      )
      return NextResponse.json({ success: true, fullName: res.fullName })
    }

    return NextResponse.json({ success: false, message: "Invalid mode" }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "API error" }, { status: 500 })
  }
}
