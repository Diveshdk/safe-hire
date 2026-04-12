import { VerificationClient } from "./verification-client"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle } from "lucide-react"
import Link from "next/link"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

async function verifyCertificate(hash: string) {
  try {
    const supabase = getSupabaseAdmin()

    // Fetch the certificate directly from Supabase (no internal HTTP round-trip)
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

    if (error || !certificate) return null

    // Separately look up the recipient name (certificates → auth.users, profiles linked via user_id)
    let recipientName = "Unknown"
    if (certificate.recipient_user_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, aadhaar_full_name, certificate_name")
        .eq("user_id", certificate.recipient_user_id)
        .maybeSingle()

      if (profile) {
        recipientName = profile.certificate_name || profile.full_name || profile.aadhaar_full_name || "Unknown"
      }
    }

    return {
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
    }
  } catch (error) {
    console.error("Verification error:", error)
    return null
  }
}

export default async function VerifyCertificatePage({ params }: { params: { hash: string } }) {
  const certificate = await verifyCertificate(params.hash)

  if (!certificate) {
    return (
      <main className="min-h-dvh bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-500/20 shadow-xl">
          <CardContent className="pt-8 text-center space-y-4">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-12 w-12 text-red-500" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-slate-900">Verification Failed</h1>
            <p className="text-muted-foreground leading-relaxed">
              This certificate record could not be found or has been revoked. If you believe this is an error, please contact the issuing organization.
            </p>
            <div className="pt-4">
              <Button asChild className="w-full">
                <Link href="/">Back to SafeHire</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#fcfcfc] dark:bg-slate-950 py-12 px-6 overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-[50dvh] bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-0" />
      
      <div className="relative z-10 max-w-6xl mx-auto space-y-12">
        <div className="flex flex-col items-center text-center space-y-2 mb-8">
          <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center shadow-lg mb-4">
            <div className="w-6 h-6 border-4 border-white rounded-full opacity-80" />
          </div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white">
            Secure Verification Receipt
          </h1>
          <p className="text-muted-foreground max-w-sm">
            Official digital record of achievement issued through the SafeHire Trust Network.
          </p>
        </div>

        <VerificationClient certificate={certificate} />
      </div>
    </main>
  )
}
