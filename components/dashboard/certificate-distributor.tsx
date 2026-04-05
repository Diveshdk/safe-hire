"use client"

import { useState, useRef } from "react"
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
import { 
  Award, 
  Trophy, 
  Users, 
  X, 
  Plus, 
  CheckCircle2, 
  FileSpreadsheet, 
  ShieldCheck, 
  Settings2,
  Sparkles,
  Eye,
  Palette
} from "lucide-react"
import { cn } from "@/lib/utils"
import { CertificateEditor } from "./certificate-editor"
import { CertificateDesignConfig } from "./certificate-viewer"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import * as XLSX from "xlsx"

interface Recipient {
  safe_hire_id: string
  certificate_type: "winner" | "participant"
  custom_title?: string
  recipient_name?: string
  recipient_rank?: string
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
  const [designConfig, setDesignConfig] = useState<CertificateDesignConfig | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: "binary" })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = XLSX.utils.sheet_to_json(ws) as any[]
        
        const newRecipients: Recipient[] = data.map(row => ({
          safe_hire_id: (row.safe_hire_id || row["SafeHire ID"] || "").toString().trim(),
          certificate_type: ((row.type || row.certificate_type || "participant").toLowerCase() === "winner" ? "winner" : "participant") as "winner" | "participant",
          recipient_name: row.name || row.recipient_name,
          recipient_rank: row.rank || row.recipient_rank,
          custom_title: row.title || row.custom_title,
        })).filter(r => r.safe_hire_id)

        if (newRecipients.length === 0) {
          toast({
            title: "No Data Found",
            description: "Could not find any SafeHire IDs in the uploaded file.",
            variant: "destructive",
          })
          return
        }

        setRecipients(prev => {
          const combined = [...prev]
          newRecipients.forEach(nr => {
            if (!combined.some(c => c.safe_hire_id === nr.safe_hire_id)) {
              combined.push(nr)
            }
          })
          return combined
        })

        toast({
          title: "Import Successful",
          description: `Added ${newRecipients.length} recipients from file.`,
        })
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Please ensure you're uploading a valid Excel or CSV file.",
          variant: "destructive",
        })
      }
    }
    reader.readAsBinaryString(file)
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
          design_config: designConfig
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
      <Card className="shadow-lg border-primary/5 overflow-hidden">
        <div className="h-2 bg-primary/20" />
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
                <Award className="h-6 w-6 text-primary" />
                Certificate Distribution Hub
              </CardTitle>
              <CardDescription>
                Issue high-end certificates for <strong>{eventTitle}</strong>
              </CardDescription>
            </div>
            
            <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className={cn("gap-2 shadow-sm", designConfig && "border-primary bg-primary/5")}>
                  {designConfig ? (
                    <>
                      <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                      Design Active
                    </>
                  ) : (
                    <>
                      <Palette className="h-4 w-4" />
                      Professional Designer
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-[95vw] h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Certificate Designer</DialogTitle>
                  <DialogDescription>
                    Create a professional layout for your event certificates.
                  </DialogDescription>
                </DialogHeader>
                <CertificateEditor 
                  onSave={(config) => {
                    setDesignConfig(config)
                    setIsEditorOpen(false)
                    toast({
                      title: "Design Saved",
                      description: "Your custom certificate design is ready to be issued."
                    })
                  }} 
                  initialConfig={designConfig || { organization_name: orgName }}
                />
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-muted/30 rounded-xl border">
             {/* Organisation Name */}
            <div className="space-y-2">
              <Label htmlFor="org_name" className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Organisation Name</Label>
              <Input
                id="org_name"
                placeholder="Display name on certificate"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="bg-background"
              />
            </div>

            {/* Bulk Upload Area */}
            <div className="space-y-2">
              <Label className="text-xs uppercase font-bold tracking-widest text-muted-foreground">Bulk Import</Label>
              <div 
                className="flex items-center gap-3 p-2 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="h-10 w-10 bg-white rounded flex items-center justify-center border shadow-sm">
                  <FileSpreadsheet className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold">Upload Excel / CSV</p>
                  <p className="text-[10px] text-muted-foreground italic">File must contain a 'safe_hire_id' column</p>
                </div>
                <Input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept=".xlsx, .xls, .csv" 
                  onChange={handleFileUpload} 
                />
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground font-bold tracking-tighter">Add Individual Recipients</span></div>
          </div>

          {/* Add Recipient Form */}
          <div className="grid gap-4 md:grid-cols-4 items-end bg-card p-4 border rounded-xl shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="safe_hire_id">SafeHire ID</Label>
              <Input
                id="safe_hire_id"
                placeholder="JS123456"
                value={currentSafeHireId}
                onChange={(e) => setCurrentSafeHireId(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addRecipient()}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cert_type">Type</Label>
              <Select value={currentCertType} onValueChange={(v: any) => setCurrentCertType(v)}>
                <SelectTrigger id="cert_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="winner">Winner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="custom_title">Title (Optional)</Label>
              <Input
                id="custom_title"
                placeholder="e.g. 1st Place"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
              />
            </div>
            <Button onClick={addRecipient} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>

          {/* Recipients List */}
          {recipients.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Recipient Queue ({recipients.length})
                </Label>
                <Button variant="ghost" size="sm" onClick={() => setRecipients([])} className="text-xs text-destructive">
                  Clear All
                </Button>
              </div>
              <div className="border rounded-xl divide-y overflow-hidden max-h-80 overflow-y-auto shadow-inner bg-muted/10">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.safe_hire_id}
                    className="flex items-center justify-between p-3 hover:bg-background/80 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col">
                        <code className="text-sm font-bold font-mono">
                          {recipient.safe_hire_id}
                        </code>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{recipient.recipient_name || "New Applicant"}</span>
                      </div>
                      <Badge
                        variant={recipient.certificate_type === "winner" ? "default" : "secondary"}
                        className={cn(
                          "flex items-center gap-1",
                          recipient.certificate_type === "winner" &&
                            "bg-amber-500/10 text-amber-600 border-amber-500/20 shadow-none"
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
                        <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded italic">"{recipient.custom_title}"</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeRecipient(recipient.safe_hire_id)}
                      className="opacity-0 group-hover:opacity-100 text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue Certificates Button */}
          <div className="pt-4 space-y-4">
            {designConfig && (
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg animate-in zoom-in-95 duration-300">
                <div className="h-10 w-10 bg-white rounded flex items-center justify-center border shadow-sm">
                   <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-primary">Advanced Design Enabled</p>
                  <p className="text-[10px] text-muted-foreground">Template: <span className="capitalize">{designConfig.template_id}</span> &bull; {designConfig.signatories.length} Signatories</p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(true)}>
                  <Settings2 className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            <Button
              onClick={handleIssueCertificates}
              disabled={isSubmitting || recipients.length === 0}
              className="w-full py-8 text-lg font-black uppercase tracking-tighter shadow-xl hover:shadow-2xl transition-all"
              size="lg"
            >
              {isSubmitting ? (
                "Processing Secure Issuance..."
              ) : (
                <>
                  <ShieldCheck className="h-6 w-6 mr-3" />
                  Issue {recipients.length} Verified Certificate{recipients.length !== 1 ? "s" : ""}
                </>
              )}
            </Button>
            <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest opacity-60 font-bold">
              Powered by SafeHire Cryptographic Verification Registry
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Issued Certificates Summary */}
      {issued.length > 0 && (
        <Card className="border-green-500/20 bg-green-500/5 shadow-lg animate-in slide-in-from-top-4 duration-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 font-black tracking-tight">
              <CheckCircle2 className="h-6 w-6" />
              SUCCESSFULLY ISSUED
            </CardTitle>
            <CardDescription>
              All {issued.length} certificates have been distributed and recorded.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {issued.map((cert) => (
                <div
                  key={cert.certificate_id}
                  className="flex items-center justify-between p-3 bg-background rounded-lg border shadow-sm group hover:border-primary/20 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-green-500/10 rounded-full flex items-center justify-center text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <code className="text-xs font-black font-mono">{cert.safe_hire_id}</code>
                      <code className="text-[8px] text-muted-foreground font-mono">{cert.verification_hash.slice(0, 12)}...</code>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <a href={`/verify/certificate/${cert.verification_hash}`} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
