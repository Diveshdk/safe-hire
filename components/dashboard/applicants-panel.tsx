"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Briefcase, CheckCircle2, XCircle, Clock, ShieldCheck, FileText, ChevronDown, ChevronUp, ExternalLink, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

import type React from "react"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const STATUS_LABELS: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  applied: { label: "Applied", color: "text-blue-500 bg-blue-500/10", icon: <Clock className="h-3.5 w-3.5" /> },
  verified: { label: "Verified", color: "text-green-500 bg-green-500/10", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  hired: { label: "Hired", color: "text-purple-500 bg-purple-500/10", icon: <ShieldCheck className="h-3.5 w-3.5" /> },
  not_authentic: { label: "Not Authentic", color: "text-red-600 bg-red-500/10", icon: <XCircle className="h-3.5 w-3.5" /> },
  rejected: { label: "Rejected", color: "text-muted-foreground bg-muted/50", icon: <XCircle className="h-3.5 w-3.5" /> },
}

export function ApplicantsPanel({ jobId }: { jobId?: string }) {
  const url = jobId ? `/api/jobs/applications?job_id=${jobId}` : "/api/jobs/applications"
  const { data, isLoading, mutate } = useSWR(url, fetcher)
  const applications = data?.applications || []
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingApp, setRejectingApp] = useState<any>(null)
  const { toast } = useToast()

  async function updateStatus(appId: string, status: string, rejectionReasons?: string[]) {
    const body: any = { application_id: appId, status }
    if (rejectionReasons) body.rejection_reasons = rejectionReasons

    const res = await fetch("/api/jobs/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    const json = await res.json()
    if (json.ok) {
      toast({ title: `Applicant ${status}` })
      mutate()
    } else {
      toast({ title: "Update failed", description: json.message, variant: "destructive" })
    }
    return json.ok
  }

  function openRejectDialog(app: any) {
    setRejectingApp(app)
    setRejectDialogOpen(true)
  }

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading applicants…</p>
  if (applications.length === 0) return (
    <div className="rounded-2xl border border-dashed border-border p-8 text-center text-muted-foreground text-sm">
      No applications yet. Post a job to start receiving applicants.
    </div>
  )

  return (
    <>
      <div className="grid gap-3">
        {applications.map((app: any) => {
          const st = STATUS_LABELS[app.status] || STATUS_LABELS.applied
          const isOpen = expandedId === app.id
          const name = app.applicant?.full_name || app.applicant?.aadhaar_full_name || "Unknown Applicant"
          const safeHireId = app.safe_hire_id || app.applicant?.safe_hire_id
          return (
            <div key={app.id} className="rounded-xl border border-border bg-card/40 overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer"
                onClick={() => setExpandedId(isOpen ? null : app.id)}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{name}</p>
                    {app.applicant?.aadhaar_verified && (
                      <span className="flex items-center gap-0.5 text-[10px] text-green-500 bg-green-500/10 rounded-full px-1.5 py-0.5">
                        <ShieldCheck className="h-3 w-3" /> Verified
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {app.jobs?.title} · {app.jobs?.companies?.name} · SafeHire: <span className="font-mono">{safeHireId || "—"}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={cn("flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full", st.color)}>
                    {st.icon} {st.label}
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                </div>
              </div>

              {isOpen && (
                <div className="border-t border-border px-4 pb-4 pt-3 grid gap-3">
                  {/* Documents */}
                  {app.documents?.length > 0 ? (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2">VERIFIED DOCUMENTS</p>
                      <div className="grid gap-1.5">
                        {app.documents.map((doc: any) => (
                          <div key={doc.id} className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <FileText className="h-3.5 w-3.5" />
                              {doc.title || doc.doc_type}
                            </span>
                            <span className={cn(
                              "text-xs px-1.5 py-0.5 rounded-full",
                              doc.verification_status === "verified" ? "text-green-500 bg-green-500/10" : "text-muted-foreground bg-muted/50"
                            )}>
                              {doc.verification_status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">No documents uploaded yet.</p>
                  )}

                  {/* Rejection reasons (if already rejected) */}
                  {app.status === "rejected" && app.rejection_reasons && (
                    <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-3">
                      <p className="text-xs font-medium text-red-600 mb-2 flex items-center gap-1">
                        <AlertTriangle className="h-3.5 w-3.5" /> REJECTION REASONS
                      </p>
                      <div className="grid gap-1">
                        {(app.rejection_reasons as string[]).map((reason: string, i: number) => (
                          <p key={i} className="text-xs text-muted-foreground">
                            {i + 1}. {reason}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 flex-wrap">
                    {/* View SafeHire Profile */}
                    {safeHireId && (
                      <Link href={`/profile/${safeHireId}`} target="_blank">
                        <Button size="sm" variant="outline" className="text-primary border-primary/30 hover:bg-primary/5">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" /> View SafeHire Profile
                        </Button>
                      </Link>
                    )}

                    {app.status !== "rejected" && app.status !== "hired" && (
                      <>
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(app.id, "verified")}>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Shortlist
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => updateStatus(app.id, "hired")}>
                          <Briefcase className="h-3.5 w-3.5 mr-1" /> Hire
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => openRejectDialog(app)}
                          className="text-destructive hover:text-destructive">
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Reject Dialog */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        app={rejectingApp}
        onReject={async (reasons: string[]) => {
          if (rejectingApp) {
            const ok = await updateStatus(rejectingApp.id, "rejected", reasons)
            if (ok) setRejectDialogOpen(false)
          }
        }}
      />
    </>
  )
}

function RejectDialog({
  open,
  onOpenChange,
  app,
  onReject,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  app: any
  onReject: (reasons: string[]) => Promise<void>
}) {
  const [reason1, setReason1] = useState("")
  const [reason2, setReason2] = useState("")
  const [reason3, setReason3] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const name = app?.applicant?.full_name || app?.applicant?.aadhaar_full_name || "this applicant"

  async function handleSubmit() {
    if (!reason1.trim() || !reason2.trim() || !reason3.trim()) return
    setSubmitting(true)
    await onReject([reason1.trim(), reason2.trim(), reason3.trim()])
    setSubmitting(false)
    setReason1("")
    setReason2("")
    setReason3("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-destructive" />
            Reject Applicant
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Please provide 3 reasons for rejecting <span className="font-medium text-foreground">{name}</span>.
          These will help the applicant improve for future opportunities.
        </p>
        <div className="grid gap-3 mt-2">
          <div className="grid gap-1.5">
            <Label htmlFor="reason1" className="text-xs text-muted-foreground">Reason 1</Label>
            <Input
              id="reason1"
              value={reason1}
              onChange={(e) => setReason1(e.target.value)}
              placeholder="e.g., Insufficient experience in React"
              maxLength={200}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="reason2" className="text-xs text-muted-foreground">Reason 2</Label>
            <Input
              id="reason2"
              value={reason2}
              onChange={(e) => setReason2(e.target.value)}
              placeholder="e.g., Communication skills need improvement"
              maxLength={200}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="reason3" className="text-xs text-muted-foreground">Reason 3</Label>
            <Input
              id="reason3"
              value={reason3}
              onChange={(e) => setReason3(e.target.value)}
              placeholder="e.g., Missing relevant certifications"
              maxLength={200}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={handleSubmit}
            disabled={submitting || !reason1.trim() || !reason2.trim() || !reason3.trim()}
          >
            {submitting ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
