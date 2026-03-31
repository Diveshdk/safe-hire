"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle2, XCircle, ShieldCheck, Briefcase, AlertTriangle, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import type React from "react"

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  applied: { label: "Applied", color: "text-blue-600 bg-blue-500/10", icon: <Clock className="h-3 w-3" /> },
  under_review: { label: "Under Review", color: "text-amber-600 bg-amber-500/10", icon: <Clock className="h-3 w-3" /> },
  verified: { label: "Shortlisted", color: "text-green-600 bg-green-500/10", icon: <CheckCircle2 className="h-3 w-3" /> },
  hired: { label: "Hired", color: "text-purple-600 bg-purple-500/10", icon: <ShieldCheck className="h-3 w-3" /> },
  not_authentic: { label: "Not Authentic", color: "text-red-600 bg-red-500/10", icon: <XCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", color: "text-red-600 bg-red-500/10", icon: <XCircle className="h-3 w-3" /> },
}

interface Application {
  job_id: string
  status: string
  rejection_reasons?: string[]
  ai_rejection_report?: string
  id?: string
  jobs?: {
    title?: string
    companies?: { name?: string }
  }
}

export function MyApplications({ applications }: { applications: Application[] }) {
  const [selectedApp, setSelectedApp] = useState<Application | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [aiReport, setAiReport] = useState<string | null>(null)
  const [loadingReport, setLoadingReport] = useState(false)

  function openRejectionDialog(app: Application) {
    setSelectedApp(app)
    setAiReport(app.ai_rejection_report || null)
    setDialogOpen(true)
  }

  async function generateAnalysis() {
    if (!selectedApp?.id || loadingReport) return
    setLoadingReport(true)
    try {
      const res = await fetch("/api/ai/rejection-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ application_id: selectedApp.id }),
      })
      const json = await res.json()
      if (json.ok) {
        setAiReport(json.report)
      }
    } catch (err) {
      // silent fail
    }
    setLoadingReport(false)
  }

  if (applications.length === 0) return null

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Your Applications</h2>
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="grid gap-2">
          {applications.map((a: Application) => {
            const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.applied
            const isRejected = a.status === "rejected"
            return (
              <div key={a.job_id} className="flex items-center justify-between text-sm py-2 px-1 rounded-lg hover:bg-secondary/30 transition-colors">
                <div className="min-w-0 flex-1">
                  <span className="text-foreground font-medium">
                    {a.jobs?.title}
                  </span>
                  <span className="text-muted-foreground"> @ {a.jobs?.companies?.name}</span>
                </div>
                <div className="flex items-center gap-2 ml-3 shrink-0">
                  <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", st.color)}>
                    {st.icon} {st.label}
                  </span>
                  {isRejected && a.rejection_reasons && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-red-500/30 text-red-600 hover:bg-red-500/5"
                      onClick={() => openRejectionDialog(a)}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      Why Rejected?
                    </Button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Rejection Analysis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Rejection Feedback
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="grid gap-4">
              {/* Job Info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Briefcase className="h-4 w-4" />
                <span>{selectedApp.jobs?.title} @ {selectedApp.jobs?.companies?.name}</span>
              </div>

              {/* Rejection Reasons */}
              <div className="rounded-lg bg-red-500/5 border border-red-500/15 p-4">
                <p className="text-xs font-semibold text-red-600 mb-3 uppercase tracking-wide">
                  Employer Feedback
                </p>
                <div className="grid gap-2">
                  {(selectedApp.rejection_reasons || []).map((reason: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-red-500/10 text-red-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-foreground">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Analysis Section */}
              {!aiReport ? (
                <Button
                  onClick={generateAnalysis}
                  disabled={loadingReport}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                >
                  {loadingReport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating Analysis…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Analyse — Get AI Improvement Report
                    </>
                  )}
                </Button>
              ) : (
                <div className="rounded-lg bg-gradient-to-br from-purple-500/5 to-blue-500/5 border border-purple-500/15 p-4">
                  <p className="text-xs font-semibold text-purple-600 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" /> AI Analysis Report
                  </p>
                  <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
                    {aiReport}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
