import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * GET /api/certificates/verify/:hash
 * Verify a certificate by its verification hash
 */
export async function GET(req: Request, { params }: { params: { hash: string } }) {
  const supabase = getSupabaseAdmin()

  try {
    const { hash } = params

    if (!hash) {
      return NextResponse.json({ ok: false, message: "Verification hash is required" }, { status: 400 })
    }

    const { data: certificate, error } = await supabase
      .from("certificates")
      .select(
        `
        *,
        events:event_id (
          id,
          title,
          achievement,
          event_date,
          event_type
        )
      `
      )
      .eq("verification_hash", hash)
      .eq("verification_status", "verified")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    if (!certificate) {
      return NextResponse.json({ ok: false, message: "Certificate not found or has been revoked", verified: false }, { status: 404 })
    }

    let recipientName = "Unknown"
    if (certificate.recipient_user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, aadhaar_full_name")
        .eq("user_id", certificate.recipient_user_id)
        .maybeSingle()
      
      if (profile) {
        recipientName = profile.full_name || profile.aadhaar_full_name || "Unknown"
      }
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      certificate: {
        id: certificate.id,
        title: certificate.title,
        description: certificate.description,
        certificate_type: certificate.certificate_type,
        recipient_name: recipientName,
        recipient_safe_hire_id: certificate.recipient_safe_hire_id,
        issued_by: certificate.issued_by_name,
        issued_by_org: certificate.issued_by_org_name,
        issued_at: certificate.issued_at,
        event: certificate.events,
        verification_hash: certificate.verification_hash,
        verification_status: certificate.verification_status,
        metadata: certificate.metadata,
      },
    })
  } catch (error: any) {
    console.error("[certificates/verify] Error:", error)
    return NextResponse.json({ ok: false, message: error.message || "Internal server error" }, { status: 500 })
  }
}
