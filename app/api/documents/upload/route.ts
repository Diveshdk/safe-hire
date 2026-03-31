import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { performOCR, extractCertificateDetails, extractAadhaarDetails } from "@/lib/ocr"

const DOC_TYPES = ["aadhaar", "certificate", "academic_result", "resume", "event_certificate", "other"] as const
type DocType = (typeof DOC_TYPES)[number]

export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const contentType = req.headers.get("content-type") || ""

  let docType: DocType = "other"
  let title = ""
  let description = ""
  let file: File | null = null
  let linkUrl: string | null = null

  if (contentType.startsWith("multipart/form-data")) {
    const form = await (req as any).formData()
    file = form.get("file") as File | null
    docType = (form.get("doc_type") as DocType) || "other"
    title = (form.get("title") as string) || ""
    description = (form.get("description") as string) || ""
    linkUrl = (form.get("link_url") as string) || null
  } else {
    const body = await req.json().catch(() => ({}))
    docType = body.doc_type || "other"
    title = body.title || ""
    description = body.description || ""
    linkUrl = body.link_url || null
  }

  if (!file && !linkUrl) {
    return NextResponse.json({ ok: false, message: "Please upload a file or provide a link" }, { status: 400 })
  }

  let fileUrl: string | null = linkUrl

  if (file) {
    const allowedExts = [".pdf", ".jpg", ".jpeg", ".png", ".xml"]
    const ext = "." + file.name.split(".").pop()?.toLowerCase()
    if (!allowedExts.includes(ext)) {
      return NextResponse.json({ ok: false, message: "Unsupported file type. Allowed: PDF, JPG, PNG, XML" }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ ok: false, message: "File too large (max 10 MB)" }, { status: 400 })
    }

    const fileName = `${user.id}/${docType}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    try {
      const { error: storageErr } = await supabase.storage
        .from("documents")
        .upload(fileName, fileBuffer, { contentType: file.type, upsert: false })
      if (storageErr) {
        console.warn("[upload] Storage error (non-fatal):", storageErr.message)
      } else {
        const { data: urlData } = supabase.storage.from("documents").getPublicUrl(fileName)
        fileUrl = urlData?.publicUrl || null
      }
    } catch (err) {
      console.warn("[upload] Storage exception (non-fatal):", err)
    }
  }

  // Auto-verify certificates, awards, resume, and general docs
  // Only aadhaar and academic_result stay pending (need official verification)
  const autoVerifyTypes: string[] = ["certificate", "event_certificate", "resume", "other"]
  let verificationStatus = autoVerifyTypes.includes(docType) ? "verified" : "pending"
  let ocrName = ""
  let ocrData: any = description ? { description } : {}

  // Enhanced OCR verification for certificates
  if (file && (docType === "certificate" || docType === "event_certificate")) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await performOCR(buffer, file.name)
      const { studentName, collegeName } = extractCertificateDetails(text)

      if (studentName) {
        ocrName = studentName
        ocrData.extracted_student_name = studentName
        ocrData.extracted_college_name = collegeName

        // Fetch user's profile to match name
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .single()

        if (profile?.full_name) {
          const userFullName = profile.full_name.toLowerCase().trim()
          const extractedName = studentName.toLowerCase().trim()

          // Simple fuzzy match (check if user name is in extracted name or vice versa)
          if (extractedName.includes(userFullName) || userFullName.includes(extractedName)) {
            verificationStatus = "verified"
          } else {
            verificationStatus = "flagged" // Name mismatch
            ocrData.match_error = `Name mismatch: Extracted "${studentName}" but account name is "${profile.full_name}"`
          }
        }
      }
    } catch (err) {
      console.warn("[upload] OCR processing failed (non-fatal):", err)
    }
  }

  // Enhanced OCR verification for Aadhaar (if not XML)
  if (file && docType === "aadhaar" && !file.name.toLowerCase().endsWith(".xml")) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer())
      const text = await performOCR(buffer, file.name)
      const { fullName: extractedName, aadhaarNumber } = extractAadhaarDetails(text)

      if (aadhaarNumber) {
        // Check for duplicate Aadhaar
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("user_id")
          .eq("aadhaar_number", aadhaarNumber)
          .single()

        if (existingProfile && existingProfile.user_id !== user.id) {
          return NextResponse.json({ ok: false, message: "This Aadhaar number is already linked to another account." }, { status: 400 })
        }

        ocrName = extractedName || ""
        ocrData.extracted_aadhaar_number = aadhaarNumber
        ocrData.extracted_name = extractedName

        // Update profile
        await supabase
          .from("profiles")
          .update({
            aadhaar_verified: true,
            aadhaar_number: aadhaarNumber,
            full_name: extractedName || undefined, // Update name if extracted
          })
          .eq("user_id", user.id)

        verificationStatus = "verified"
      } else {
        verificationStatus = "pending"
        ocrData.ocr_error = "Could not extract Aadhaar number from image."
      }
    } catch (err) {
      console.warn("[upload] Aadhaar OCR failed:", err)
    }
  }

  const { data: doc, error: dbErr } = await supabase
    .from("documents")
    .insert({
      user_id: user.id,
      doc_type: docType,
      title: title || (file ? file.name : "Linked Document"),
      file_url: fileUrl,
      file_size: file ? file.size : null,
      mime_type: file ? file.type : null,
      verification_status: verificationStatus,
      ocr_name: ocrName || null,
      ocr_data: ocrData,
    })
    .select()
    .single()

  if (dbErr) return NextResponse.json({ ok: false, message: dbErr.message }, { status: 500 })

  return NextResponse.json({
    ok: true,
    document: doc,
    verificationStatus,
  })
}
