import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { performOCR, extractBusinessDetails } from "@/lib/ocr"
import { isNameMatch } from "@/lib/verification/cin"

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  try {
    const formData = await (req as any).formData()
    const file = formData.get("file") as File | null
    const companyId = formData.get("companyId") as string | null

    if (!file || !companyId) {
      return NextResponse.json({ ok: false, message: "Missing file or company context." }, { status: 400 })
    }

    // Security: enforce file size ≤ 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: "File too large. Max allowed size is 5MB." }, { status: 400 })
    }

    // Security: enforce allowed MIME types
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ ok: false, message: "Invalid file type. Only JPG, PNG, WEBP, and PDF are allowed." }, { status: 400 })
    }

    // 1. Fetch the pending company record
    const { data: company, error: fetchError } = await supabase
      .from("companies")
      .select("*")
      .eq("id", companyId)
      .eq("owner_user_id", user.id)
      .single()

    if (fetchError || !company) {
      return NextResponse.json({ ok: false, message: "Company record not found or not owned by you." }, { status: 404 })
    }

    // 2. Perform OCR
    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await performOCR(buffer, file.name)
    const { companyName: extractedName, gstNumber } = extractBusinessDetails(text)

    if (!extractedName && !gstNumber) {
      return NextResponse.json({ 
        ok: false, 
        message: "OCR failed to extract any business details. Please ensure the document is clear." 
      }, { status: 400 })
    }

    // 3. Validation Logic
    // We match extractedName with company.name
    const nameMatch = extractedName ? isNameMatch(extractedName, company.name) : false
    
    // If we have a GST, check if it contains the PIN/PAN (advanced) or just if it's there
    // For now, if Name Matches, we consider it a success.
    if (nameMatch) {
      const { data: updated, error: updateError } = await supabase
        .from("companies")
        .update({
          verification_status: "verified",
          verification_method: "document_ocr",
          verified_at: new Date().toISOString()
        })
        .eq("id", companyId)
        .select()
        .single()

      if (updateError) throw updateError

      return NextResponse.json({ 
        ok: true, 
        message: "Document analyzed. Identity link established.", 
        extracted: { name: extractedName, gst: gstNumber },
        company: updated 
      })
    }

    return NextResponse.json({ 
      ok: false, 
      message: `Verification mismatch. Document shows "${extractedName || 'Unknown'}", but you are registering "${company.name}".`,
      extracted: { name: extractedName, gst: gstNumber }
    }, { status: 400 })

  } catch (e: any) {
    console.error("[Verify Document] error:", e)
    return NextResponse.json({ ok: false, message: e.message || "File processing error." }, { status: 500 })
  }
}
