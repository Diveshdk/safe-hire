import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import crypto from "crypto"

/**
 * POST /api/certificates/issue
 * Issue certificates to SafeHire IDs from an event
 */
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Verify user is an organisation
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name, aadhaar_full_name")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "organisation") {
    return NextResponse.json({ ok: false, message: "Only organisations can issue certificates" }, { status: 403 })
  }

  try {
    const body = await req.json()
    const { event_id, recipients, org_name } = body

    if (!event_id || !Array.isArray(recipients) || recipients.length === 0) {
      return NextResponse.json(
        { ok: false, message: "Event ID and recipients array are required" },
        { status: 400 }
      )
    }

    // Verify event belongs to this organisation
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .eq("org_user_id", user.id)
      .maybeSingle()

    if (eventError || !event) {
      return NextResponse.json({ ok: false, message: "Event not found or access denied" }, { status: 404 })
    }

    const issuerName = profile.full_name || profile.aadhaar_full_name || "Organisation"
    const orgName = org_name || issuerName

    // Use admin client for inserts (bypasses RLS since we already verified auth)
    const adminDb = getSupabaseAdmin()

    const issuedCertificates = []
    const errors = []

    for (const recipient of recipients) {
      const { safe_hire_id, certificate_type, custom_title } = recipient

      if (!safe_hire_id || !certificate_type) {
        errors.push({ safe_hire_id, error: "Missing required fields" })
        continue
      }

      if (!["winner", "participant"].includes(certificate_type)) {
        errors.push({ safe_hire_id, error: "Invalid certificate type" })
        continue
      }

      // Find the user by SafeHire ID
      const { data: recipientProfile, error: recipientError } = await adminDb
        .from("profiles")
        .select("user_id, full_name, aadhaar_full_name")
        .eq("safe_hire_id", safe_hire_id)
        .maybeSingle()

      if (recipientError || !recipientProfile) {
        errors.push({ safe_hire_id, error: "SafeHire ID not found" })
        continue
      }

      // Generate verification hash
      const verificationData = `${event_id}|${recipientProfile.user_id}|${certificate_type}|${Date.now()}`
      const verificationHash = crypto.createHash("sha256").update(verificationData).digest("hex")

      // Prepare certificate title
      const certificateTitle =
        custom_title ||
        `${certificate_type === "winner" ? "Winner" : "Participation"} Certificate - ${event.title}`

      // Insert certificate using admin client
      const { data: certificate, error: certError } = await adminDb
        .from("certificates")
        .insert({
          event_id: event.id,
          recipient_user_id: recipientProfile.user_id,
          recipient_safe_hire_id: safe_hire_id,
          certificate_type,
          title: certificateTitle,
          description: event.achievement || event.title,
          issued_by_user_id: user.id,
          issued_by_name: issuerName,
          issued_by_org_name: orgName,
          verification_hash: verificationHash,
          verification_status: "verified",
          metadata: {
            event_title: event.title,
            event_date: event.event_date,
            custom_fields: event.custom_fields,
          },
        })
        .select()
        .single()

      if (certError) {
        console.error("[certificates/issue] Insert failed:", certError.message)
        errors.push({ safe_hire_id, error: certError.message })
        continue
      }

      // Also create a document record for the certificate
      await adminDb.from("documents").insert({
        user_id: recipientProfile.user_id,
        doc_type: "event_certificate",
        title: certificateTitle,
        verification_status: "verified",
        issued_by_user_id: user.id,
        issued_by_name: issuerName,
        ocr_data: {
          certificate_id: certificate.id,
          certificate_type,
          event_id: event.id,
          verification_hash: verificationHash,
        },
      })

      issuedCertificates.push({
        safe_hire_id,
        certificate_id: certificate.id,
        certificate_type,
        verification_hash: verificationHash,
      })
    }

    return NextResponse.json({
      ok: true,
      message: `Issued ${issuedCertificates.length} certificate(s)`,
      issued: issuedCertificates,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error: any) {
    console.error("[certificates/issue] Error:", error)
    return NextResponse.json({ ok: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
