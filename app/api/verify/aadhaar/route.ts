import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
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

  // OCR or Offline XML path (Multipart)
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
        // XML might not have the cleartext number, but we need a placeholder or skip check
        if (res.success && !res.aadhaarNumber) res.aadhaarNumber = "XML_VERIFIED"
      } else {
        res = await verifyAadhaarOCR(buffer, file.name)
      }

      if (!res.success || !res.fullName || !res.aadhaarNumber) {
        return NextResponse.json(res, { status: 400 })
      }

      // ── DUPLICATE CHECK (ADMIN) ───────────────────────────────────────────
      // Normalize: remove spaces, dashes, etc.
      const normalizedAadhaar = res.aadhaarNumber.replace(/\D/g, "")
      
      const supabaseAdmin = getSupabaseAdmin()
      const role = url.searchParams.get("role")
      const committeeId = url.searchParams.get("committee_id")

      const { data: matches, error: checkError } = await supabaseAdmin
        .from("profiles")
        .select("user_id, role, committee_id")
        .eq("aadhaar_number", normalizedAadhaar)
      
      if (checkError) return NextResponse.json({ success: false, message: checkError.message }, { status: 500 })

      // Logic: 
      // 1. Job Seeker: One account per Aadhaar globally.
      // 2. Organisation: Allowed multiple roles, but only once per specific committee.
      const hasJobSeeker = matches?.some((m: any) => m.role === "job_seeker" && m.user_id !== currentUserId)
      const inSameCommittee = committeeId && matches?.some((m: any) => m.committee_id === committeeId && m.user_id !== currentUserId)

      if (role === "job_seeker" && hasJobSeeker) {
        return NextResponse.json({ success: false, message: "This Aadhaar is already registered with a Job Seeker account." }, { status: 409 })
      }
      if (inSameCommittee) {
        return NextResponse.json({ success: false, message: "You have already registered for this committee with this Aadhaar." }, { status: 409 })
      }

      // If signup mode, return extracted data immediately (frontend will pass to profile/setup)
      if (isSignup) {
        return NextResponse.json({
          success: true,
          fullName: res.fullName,
          aadhaarNumber: normalizedAadhaar,
        })
      }

      if (!currentUserId) return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })

      // Final save for logged-in users (verification page flow)
      const { error: upsertError } = await supabaseAdmin.from("profiles").upsert(
        {
          user_id: currentUserId,
          aadhaar_full_name: res.fullName,
          aadhaar_number: normalizedAadhaar,
          aadhaar_verified: true,
          aadhaar_verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

      if (upsertError) return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })

      await supabase.from("verifications").insert({
        subject_user_id: currentUserId,
        type: "aadhaar",
        provider: modeQuery === "offline-xml" ? "xml" : "ocr",
        status: "success",
        evidence_ref: normalizedAadhaar.substring(8),
      })

      return NextResponse.json({
        success: true,
        fullName: res.fullName,
        aadhaarNumber: `XXXX-XXXX-${normalizedAadhaar.substring(8)}`,
      })
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e?.message || "Verification error" }, { status: 500 })
    }
  }

  // JSON path (API Setu / Demo)
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
        
        // APISetu currently doesn't provide the UID in confirmation result. 
        // If it did, we would add the duplicate check here too.

        if (isSignup) return NextResponse.json({ success: true, fullName: res.fullName })
        if (!currentUserId) return NextResponse.json({ success: false, message: "Not logged in" }, { status: 401 })

        await supabase.from("profiles").upsert(
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

      await supabase.from("profiles").upsert(
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
