"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Award, Trophy, Users, Calendar, Building2, ExternalLink, Shield, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface Certificate {
  id: string
  title: string
  description: string
  certificate_type: "winner" | "participant"
  issued_by_name: string
  issued_by_org_name: string
  issued_at: string
  verification_hash: string
  verification_status: string
  events?: {
    id: string
    title: string
    event_date: string
    event_type: string
  }
}

interface UserDocument {
  id: string
  title: string
  doc_type: string
  file_url: string | null
  verification_status: string
  created_at: string
  ocr_data?: { description?: string }
}

export function AchievementsCertificates({ userId }: { userId?: string }) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [uploadedAchievements, setUploadedAchievements] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch org-issued certificates
      const certUrl = userId
        ? `/api/certificates/list?user_id=${userId}`
        : "/api/certificates/list"
      const certRes = await fetch(certUrl)
      const certData = await certRes.json()
      if (certData.ok) {
        setCertificates(certData.certificates || [])
      }

      // Fetch user-uploaded certificate/award documents
      const docUrl = userId
        ? `/api/documents/list?user_id=${userId}`
        : "/api/documents/list"
      const docRes = await fetch(docUrl)
      const docData = await docRes.json()
      if (docData.ok) {
        const achievementDocs = (docData.documents || []).filter(
          (d: any) => (d.doc_type === "certificate" || d.doc_type === "event_certificate") && d.verification_status === "verified"
        )
        setUploadedAchievements(achievementDocs)
      }
    } catch (error) {
      console.error("Failed to fetch achievements:", error)
    } finally {
      setLoading(false)
    }
  }

  const verifyCertificate = (hash: string) => {
    window.open(`/verify/certificate/${hash}`, "_blank")
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    )
  }

  const totalCount = certificates.length + uploadedAchievements.length
  const winnerCerts = certificates.filter((c) => c.certificate_type === "winner")
  const participantCerts = certificates.filter((c) => c.certificate_type === "participant")

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          Achievements & Certificates
        </CardTitle>
        <CardDescription>
          {totalCount > 0
            ? `${totalCount} achievement${totalCount !== 1 ? "s" : ""} earned`
            : "No certificates yet"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {totalCount === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Certificates from events, competitions, and uploads will appear here
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* User-Uploaded Achievements */}
            {uploadedAchievements.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-emerald-500" />
                  <h3 className="font-semibold text-sm">Achievements ({uploadedAchievements.length})</h3>
                </div>
                <div className="space-y-3">
                  {uploadedAchievements.map((doc) => (
                    <UploadedAchievementCard key={doc.id} doc={doc} />
                  ))}
                </div>
              </div>
            )}

            {/* Org-issued Winner Certificates */}
            {winnerCerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-sm">Winner Certificates ({winnerCerts.length})</h3>
                </div>
                <div className="space-y-3">
                  {winnerCerts.map((cert) => (
                    <CertificateCard key={cert.id} certificate={cert} onVerify={verifyCertificate} />
                  ))}
                </div>
              </div>
            )}

            {/* Participation Certificates */}
            {participantCerts.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-500" />
                  <h3 className="font-semibold text-sm">
                    Participation Certificates ({participantCerts.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {participantCerts.map((cert) => (
                    <CertificateCard key={cert.id} certificate={cert} onVerify={verifyCertificate} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function UploadedAchievementCard({ doc }: { doc: UserDocument }) {
  const desc = doc.ocr_data?.description
  return (
    <div className="border rounded-lg p-4 space-y-2 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-transparent hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Award className="h-4 w-4 text-emerald-500 shrink-0" />
            <h4 className="font-semibold text-sm truncate">{doc.title}</h4>
          </div>
          {desc && (
            <p className="text-xs text-muted-foreground line-clamp-2">{desc}</p>
          )}
        </div>
        <Badge variant="secondary" className="shrink-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
          <Shield className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
        </div>
        <span className="capitalize">{doc.doc_type.replace("_", " ")}</span>
      </div>

      {doc.file_url && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => window.open(doc.file_url!, "_blank")}
        >
          <Link2 className="h-3 w-3 mr-2" />
          View Document
        </Button>
      )}
    </div>
  )
}

function CertificateCard({
  certificate,
  onVerify,
}: {
  certificate: Certificate
  onVerify: (hash: string) => void
}) {
  const isWinner = certificate.certificate_type === "winner"

  return (
    <div
      className={cn(
        "border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow",
        isWinner
          ? "border-amber-500/20 bg-linear-to-br from-amber-500/5 to-transparent"
          : "border-border bg-card"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isWinner ? (
              <Trophy className="h-4 w-4 text-amber-500 shrink-0" />
            ) : (
              <Award className="h-4 w-4 text-blue-500 shrink-0" />
            )}
            <h4 className="font-semibold text-sm truncate">{certificate.title}</h4>
          </div>
          {certificate.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{certificate.description}</p>
          )}
        </div>
        <Badge
          variant={isWinner ? "default" : "secondary"}
          className={cn(
            "shrink-0",
            isWinner && "bg-amber-500/10 text-amber-600 border-amber-500/20"
          )}
        >
          <Shield className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate">{certificate.issued_by_org_name || certificate.issued_by_name}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{new Date(certificate.issued_at).toLocaleDateString()}</span>
        </div>
      </div>

      {certificate.events && (
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            <span className="font-medium">Event:</span> {certificate.events.title}
            {certificate.events.event_date && (
              <span> • {new Date(certificate.events.event_date).toLocaleDateString()}</span>
            )}
          </p>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="w-full text-xs"
        onClick={() => onVerify(certificate.verification_hash)}
      >
        <ExternalLink className="h-3 w-3 mr-2" />
        Verify Certificate
      </Button>
    </div>
  )
}
