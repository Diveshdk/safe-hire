import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { apisetuInitiateOtp, apisetuConfirmOtp, demoVerify, verifyOfflineXml } from "@/lib/verification/aadhaar"

export async function POST(req: Request) {
  try {
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
            message: "Please upload a valid Aadhaar XML file (not the password-protected ZIP file).",
          },
          { status: 400 },
        )
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            success: false,
            message: "File size too large. Please upload a file smaller than 5MB.",
          },
          { status: 400 },
        )
      }

      const xml = await file.text()
      
      if (!xml || xml.trim().length === 0) {
        return NextResponse.json({ success: false, message: "Empty or invalid XML file" }, { status: 400 })
      }
      
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

  const body = await req.json().catch(() => ({}))
  const mode = body.mode || process.env.NEXT_PUBLIC_DEFAULT_AADHAAR_MODE || "apisetu"
  const step = body.step // "init" | "confirm" (for API Setu) or undefined for demo

  try {
    if (mode === "anon-aadhaar") {
      // Handle Anon Aadhaar verification
      const proof = body.proof
      
      if (!proof) {
        return NextResponse.json({ success: false, message: "Missing Anon Aadhaar proof" }, { status: 400 })
      }

      // Extract user name from proof (this would depend on the actual proof structure)
      let fullName = "Verified User"
      
      // If it's a test proof, use the userName from it
      if (proof.type === "test" && proof.userName) {
        fullName = proof.userName
      }
      
      // For real Anon Aadhaar proofs, you would verify the proof here
      // and extract the necessary information
      
      // Upsert profile with Aadhaar verification
      const { error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          { user_id: user.id, aadhaar_full_name: fullName, aadhaar_verified: true },
          { onConflict: "user_id" },
        )
      if (upsertError) return NextResponse.json({ success: false, message: upsertError.message }, { status: 500 })

      await supabase.from("verifications").insert({
        subject_user_id: user.id,
        type: "aadhaar",
        provider: "anon_aadhaar",
        status: "success",
        evidence_ref: JSON.stringify(proof),
      })

      return NextResponse.json({ success: true, fullName })
    }

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
  } catch (globalError: any) {
    console.error("Global API error:", globalError)
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 })
  }
}
