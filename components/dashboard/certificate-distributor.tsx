"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { Award, Trophy, Users, X, Plus, CheckCircle2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface Recipient {
  safe_hire_id: string
  certificate_type: "winner" | "participant"
  custom_title?: string
}

interface CertificateDistributorProps {
  eventId: string
  eventTitle: string
}

export function CertificateDistributor({ eventId, eventTitle }: CertificateDistributorProps) {
  const [recipients, setRecipients] = useState<Recipient[]>([])
  const [currentSafeHireId, setCurrentSafeHireId] = useState("")
  const [currentCertType, setCurrentCertType] = useState<"winner" | "participant">("participant")
  const [customTitle, setCustomTitle] = useState("")
  const [orgName, setOrgName] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [issued, setIssued] = useState<any[]>([])
  const { toast } = useToast()

  const addRecipient = () => {
    if (!currentSafeHireId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a SafeHire ID",
        variant: "destructive",
      })
      return
    }

    const exists = recipients.some((r) => r.safe_hire_id === currentSafeHireId.trim())
    if (exists) {
      toast({
        title: "Already Added",
        description: "This SafeHire ID is already in the list",
        variant: "destructive",
      })
      return
    }

    setRecipients([
      ...recipients,
      {
        safe_hire_id: currentSafeHireId.trim(),
        certificate_type: currentCertType,
        custom_title: customTitle.trim() || undefined,
      },
    ])
    setCurrentSafeHireId("")
    setCustomTitle("")
  }

  const removeRecipient = (safeHireId: string) => {
    setRecipients(recipients.filter((r) => r.safe_hire_id !== safeHireId))
  }

  const handleIssueCertificates = async () => {
    if (recipients.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one recipient",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch("/api/certificates/issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          recipients,
          org_name: orgName.trim() || undefined,
        }),
      })

      const data = await res.json()

      if (data.ok) {
        setIssued(data.issued || [])
        setRecipients([])
        toast({
          title: "Success",
          description: data.message,
        })
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to issue certificates",
          variant: "destructive",
        })
      }

      if (data.errors && data.errors.length > 0) {
        toast({
          title: "Some Errors Occurred",
          description: `${data.errors.length} recipient(s) failed`,
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Distribute Certificates
          </CardTitle>
          <CardDescription>
            Issue certificates to participants for: <strong>{eventTitle}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organisation Name */}
          <div>
            <Label htmlFor="org_name">Organisation Name (Optional)</Label>
            <Input
              id="org_name"
              placeholder="Your Organisation Name"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
            />
          </div>

          {/* Add Recipient Form */}
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="safe_hire_id">SafeHire ID</Label>
              <Input
                id="safe_hire_id"
                placeholder="JS123456 or EX123456"
                value={currentSafeHireId}
                onChange={(e) => setCurrentSafeHireId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
              />
            </div>
            <div>
              <Label htmlFor="cert_type">Certificate Type</Label>
              <Select value={currentCertType} onValueChange={(v: any) => setCurrentCertType(v)}>
                <SelectTrigger id="cert_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participation
                    </div>
                  </SelectItem>
                  <SelectItem value="winner">
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-500" />
                      Winner
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={addRecipient} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Recipient
              </Button>
            </div>
          </div>

          {/* Optional Custom Title */}
          <div>
            <Label htmlFor="custom_title">Custom Certificate Title (Optional)</Label>
            <Input
              id="custom_title"
              placeholder="e.g., First Prize - Coding Competition"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <div className="space-y-2">
              <Label>Recipients ({recipients.length})</Label>
              <div className="border rounded-lg divide-y max-h-64 overflow-y-auto">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.safe_hire_id}
                    className="flex items-center justify-between p-3 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {recipient.safe_hire_id}
                      </code>
                      <Badge
                        variant={recipient.certificate_type === "winner" ? "default" : "secondary"}
                        className={cn(
                          "flex items-center gap-1",
                          recipient.certificate_type === "winner" &&
                            "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        )}
                      >
                        {recipient.certificate_type === "winner" ? (
                          <Trophy className="h-3 w-3" />
                        ) : (
                          <Users className="h-3 w-3" />
                        )}
                        {recipient.certificate_type === "winner" ? "Winner" : "Participant"}
                      </Badge>
                      {recipient.custom_title && (
                        <span className="text-xs text-muted-foreground">{recipient.custom_title}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(recipient.safe_hire_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue Certificates Button */}
          <Button
            onClick={handleIssueCertificates}
            disabled={isSubmitting || recipients.length === 0}
            className="w-full"
            size="lg"
          >
            {isSubmitting ? (
              "Issuing Certificates..."
            ) : (
              <>
                <Award className="h-4 w-4 mr-2" />
                Issue {recipients.length} Certificate{recipients.length !== 1 ? "s" : ""}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Issued Certificates Summary */}
      {issued.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              Successfully Issued
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {issued.map((cert) => (
                <div
                  key={cert.certificate_id}
                  className="flex items-center justify-between p-2 bg-background rounded border"
                >
                  <div className="flex items-center gap-2">
                    <code className="text-xs font-mono">{cert.safe_hire_id}</code>
                    <Badge variant="outline" className="text-xs">
                      {cert.certificate_type}
                    </Badge>
                  </div>
                  <code className="text-xs text-muted-foreground">{cert.verification_hash.slice(0, 16)}...</code>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
