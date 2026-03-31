import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import {
  apisetuInitiateOtp,
  apisetuConfirmOtp,
  demoVerify,
  verifyOfflineXml,
  verifyAadhaarOCR,
} from "@/lib/verification/aadhaar"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""
  const isMultipart = contentType.startsWith("multipart/form-data")
  const url = new URL(req.url)
  const modeQuery = url.searchParams.get("mode")

  // Offline XML path uses multipart/form-data with ?mode=offline-xml
  if (modeQuery === "offline-xml" && isMultipart) {
    try {
      const form = await (req as any).formData()
      const file = form.get("file") as File | null
      // shareCode can be supplied for future zip decryption, but for now we require extracted XML upload
      // const shareCode = form.get("shareCode") as string | null

      if (!file) {
        return NextResponse.json({ success: false, message: "Missing file" }, { status: 400 })
      }

      if (!file.name.toLowerCase().endsWith(".xml")) {
        return NextResponse.json(
          {
            success: false,
            message: "Please upload the extracted Aadhaar XML file (not the password-protected ZIP).",
          },
          { status: 400 },
        )
      }

      const xml = await file.text()
      const res = await verifyOfflineXml(xml)
      if (!res.success || !res.fullName) return NextResponse.json(res, { status: 400 })

      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, aadhaar_full_name: res.fullName, aadhaar_verified: true },
          { onConflict: "user_id" },
        )
      if (upsertError) return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })

      await supabase.from("verifications").insert({
        subject_user_id: user.id,
        type: "aadhaar",
        provider: "uidai_offline",
        status: "success",
        evidence_ref: null,
      })

      return NextResponse.json({ success: true, fullName: res.fullName })
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e?.message || "Upload/verification error" }, { status: 500 })
    }
  }

  // OCR path uses multipart/form-data with ?mode=ocr
  if (modeQuery === "ocr" && isMultipart) {
    try {
      const form = await (req as any).formData()
      const file = form.get("file") as File | null

      if (!file) {
        return NextResponse.json({ success: false, message: "Missing image file" }, { status: 400 })
      }

      const buffer = Buffer.from(await file.arrayBuffer())
      const res = await verifyAadhaarOCR(buffer, file.name)
      if (!res.success || !res.fullName || !res.aadhaarNumber) {
        return NextResponse.json(res, { status: 400 })
      }

      // Check if this Aadhaar number is already used by another user
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("aadhaar_number", res.aadhaarNumber)
        .maybeSingle()

      if (checkError) {
        return NextResponse.json({ success: false, message: checkError.message }, { status: 500 })
      }

      if (existingProfile && existingProfile.user_id !== user.id) {
        return NextResponse.json(
          {
            success: false,
            message: "This Aadhaar card is already registered with another account.",
          },
          { status: 400 },
        )
      }

      // Upsert profile with Aadhaar data
      const { error: upsertError } = await supabase.from("profiles").upsert(
        {
          user_id: user.id,
          aadhaar_full_name: res.fullName,
          aadhaar_number: res.aadhaarNumber,
          aadhaar_verified: true,
          aadhaar_verified_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      )

      if (upsertError) return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })

      // Log verification
      await supabase.from("verifications").insert({
        subject_user_id: user.id,
        type: "aadhaar",
        provider: "ocr",
        status: "success",
        evidence_ref: res.aadhaarNumber.substring(8), // Store last 4 digits as reference
      })

      return NextResponse.json({
        success: true,
        fullName: res.fullName,
        aadhaarNumber: `XXXX-XXXX-${res.aadhaarNumber.substring(8)}`,
      })
    } catch (e: any) {
      return NextResponse.json({ success: false, message: e?.message || "OCR verification error" }, { status: 500 })
    }
  }

  const body = await req.json().catch(() => ({}))
  const mode = body.mode || process.env.NEXT_PUBLIC_DEFAULT_AADHAAR_MODE || "apisetu"
  const step = body.step // "init" | "confirm" (for API Setu) or undefined for demo

  try {
    if (mode === "apisetu") {
      if (step === "init") {
        // DO NOT store UID. Just forward to provider.
        const res = await apisetuInitiateOtp({ uid: body.uid })
        if (!res.success) return NextResponse.json(res, { status: 400 })
        return NextResponse.json({ success: true, txnId: res.txnId })
      }
      if (step === "confirm") {
        const res = await apisetuConfirmOtp({ txnId: body.txnId, otp: body.otp })
        if (!res.success || !res.fullName) return NextResponse.json(res, { status: 400 })

        // Upsert profile with Aadhaar full name and verified flag
        const { error: upsertError } = await supabase
          .from("profiles")
          .upsert(
            { user_id: user.id, aadhaar_full_name: res.fullName, aadhaar_verified: true },
            { onConflict: "user_id" },
          )
        if (upsertError) return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })

        await supabase.from("verifications").insert({
          subject_user_id: user.id,
          type: "aadhaar",
          provider: "apisetu",
          status: "success",
          evidence_ref: null,
        })

        return NextResponse.json({ success: true, fullName: res.fullName })
      }
      return NextResponse.json({ success: false, message: "Missing or invalid step" }, { status: 400 })
    }

    // Demo mode (single step)
    const res = await demoVerify({ fullName: body.fullName })
    if (!res.success || !res.fullName) return NextResponse.json(res, { status: 400 })

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert({ user_id: user.id, aadhaar_full_name: res.fullName, aadhaar_verified: true }, { onConflict: "user_id" })
    if (upsertError) return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })

    await supabase.from("verifications").insert({
      subject_user_id: user.id,
      type: "aadhaar",
      provider: "demo",
      status: "success",
      evidence_ref: null,
    })

    return NextResponse.json({ success: true, fullName: res.fullName })
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Unexpected error" }, { status: 500 })
  }
}
