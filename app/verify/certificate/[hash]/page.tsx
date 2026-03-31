import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Trophy, Users, Building2, Calendar, Shield, CheckCircle2, XCircle } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"

async function verifyCertificate(hash: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/certificates/verify/${hash}`, {
      cache: "no-store",
    })
    
    if (!res.ok) return null
    
    const data = await res.json()
    return data.ok ? data.certificate : null
  } catch (error) {
    console.error("Verification error:", error)
    return null
  }
}

export default async function VerifyCertificatePage({ params }: { params: { hash: string } }) {
  const certificate = await verifyCertificate(params.hash)

  if (!certificate) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-red-500/20">
          <CardContent className="pt-6 text-center space-y-4">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
            <h1 className="text-2xl font-bold">Certificate Not Found</h1>
            <p className="text-muted-foreground">
              This certificate could not be verified. It may have been revoked or the verification hash is invalid.
            </p>
            <Button asChild>
              <Link href="/">Go to Home</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  const isWinner = certificate.certificate_type === "winner"

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center p-6">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="h-20 w-20 rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-green-500" />
            </div>
          </div>
          <Badge variant="outline" className="w-fit mx-auto mb-4 border-green-500/50 text-green-600">
            <Shield className="h-3 w-3 mr-1" />
            Verified Certificate
          </Badge>
          <CardTitle className="text-2xl">Certificate of {isWinner ? "Achievement" : "Participation"}</CardTitle>
          <CardDescription>Issued through Safe Hire System</CardDescription>
        </CardHeader>

        <CardContent className="pt-6 space-y-6">
          {/* Certificate Details */}
          <div className="text-center space-y-3 p-6 rounded-lg border bg-card">
            {isWinner ? (
              <Trophy className="h-12 w-12 text-amber-500 mx-auto" />
            ) : (
              <Award className="h-12 w-12 text-blue-500 mx-auto" />
            )}
            <h2 className="text-xl font-bold">{certificate.title}</h2>
            {certificate.description && (
              <p className="text-muted-foreground">{certificate.description}</p>
            )}
            <Badge
              variant={isWinner ? "default" : "secondary"}
              className={isWinner ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : ""}
            >
              {isWinner ? "Winner Certificate" : "Participation Certificate"}
            </Badge>
          </div>

          {/* Recipient Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Awarded To</h3>
            <div className="p-4 rounded-lg border bg-muted/50">
              <p className="font-semibold text-lg">{certificate.recipient_name}</p>
              <p className="text-sm text-muted-foreground">
                SafeHire ID: <code className="font-mono">{certificate.recipient_safe_hire_id}</code>
              </p>
            </div>
          </div>

          {/* Event Information */}
          {certificate.event && (
            <div className="space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground">Event Details</h3>
              <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
                <p className="font-medium">{certificate.event.title}</p>
                {certificate.event.achievement && (
                  <p className="text-sm text-muted-foreground">{certificate.event.achievement}</p>
                )}
                {certificate.event.event_date && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>{new Date(certificate.event.event_date).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Issuer Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-sm text-muted-foreground">Issued By</h3>
            <div className="p-4 rounded-lg border bg-muted/50 space-y-2">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium">{certificate.issued_by_org || certificate.issued_by}</p>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3.5 w-3.5" />
                <span>Issued on {new Date(certificate.issued_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Verification Hash */}
          <div className="space-y-2 p-4 rounded-lg border bg-green-500/5 border-green-500/20">
            <div className="flex items-center gap-2 text-green-600">
              <Shield className="h-4 w-4" />
              <span className="font-semibold text-sm">Verification Hash</span>
            </div>
            <code className="block text-xs break-all font-mono text-muted-foreground">
              {certificate.verification_hash}
            </code>
          </div>

          {/* Footer */}
          <div className="text-center pt-4">
            <p className="text-xs text-muted-foreground">
              This certificate is digitally verified and permanently recorded in the Safe Hire System.
            </p>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
