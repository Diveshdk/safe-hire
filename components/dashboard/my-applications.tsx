"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Clock, CheckCircle2, XCircle, ShieldCheck, Briefcase, AlertTriangle, Sparkles, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

import type React from "react"

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  applied: { label: "Applied", bg: "bg-blue-100", text: "text-blue-700", icon: <Clock className="h-3 w-3" /> },
  under_review: { label: "Under Review", bg: "bg-amber-100", text: "text-amber-700", icon: <Clock className="h-3 w-3" /> },
  verified: { label: "Shortlisted", bg: "bg-emerald-100", text: "text-emerald-700", icon: <CheckCircle2 className="h-3 w-3" /> },
  hired: { label: "Hired", bg: "bg-purple-100", text: "text-purple-700", icon: <ShieldCheck className="h-3 w-3" /> },
  not_authentic: { label: "Not Authentic", bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-3 w-3" /> },
  rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700", icon: <XCircle className="h-3 w-3" /> },
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
      if (json.ok) setAiReport(json.report)
    } catch (err) {
      // silent fail
    }
    setLoadingReport(false)
  }

  if (applications.length === 0) return null

  return (
    <div>
      <h2 className="text-base font-bold text-[#18181B] mb-3">Your Applications</h2>
      <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden">
        {applications.map((a: Application, i: number) => {
          const st = STATUS_CONFIG[a.status] || STATUS_CONFIG.applied
          const isRejected = a.status === "rejected"
          return (
            <div
              key={a.job_id}
              className={cn(
                "flex items-center justify-between px-5 py-4 hover:bg-[#F9F9FB] transition-colors",
                i > 0 && "border-t border-[#F4F4F6]"
              )}
            >
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-[#18181B]">{a.jobs?.title}</span>
                <span className="text-sm text-[#71717A]"> @ {a.jobs?.companies?.name}</span>
              </div>
              <div className="flex items-center gap-2 ml-3 shrink-0">
                <span className={cn("inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full", st.bg, st.text)}>
                  {st.icon} {st.label}
                </span>
                {isRejected && a.rejection_reasons && (
                  <button
                    className="text-xs border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-full font-medium flex items-center gap-1 transition-colors"
                    onClick={() => openRejectionDialog(a)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    Why Rejected?
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Rejection Analysis Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border-[#E4E4E7]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Rejection Feedback
            </DialogTitle>
          </DialogHeader>

          {selectedApp && (
            <div className="grid gap-4 mt-2">
              <div className="flex items-center gap-2 text-sm text-[#71717A]">
                <Briefcase className="h-4 w-4" />
                <span>{selectedApp.jobs?.title} @ {selectedApp.jobs?.companies?.name}</span>
              </div>

              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-xs font-bold text-red-600 mb-3 uppercase tracking-wider">Employer Feedback</p>
                <div className="grid gap-2">
                  {(selectedApp.rejection_reasons || []).map((reason: string, i: number) => (
                    <div key={i} className="flex gap-2 text-sm">
                      <span className="shrink-0 h-5 w-5 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">
                        {i + 1}
                      </span>
                      <span className="text-[#18181B]">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {!aiReport ? (
                <button
                  onClick={generateAnalysis}
                  disabled={loadingReport}
                  className="w-full bg-gradient-to-r from-violet-600 to-blue-600 text-white font-semibold py-3 rounded-full hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
                >
                  {loadingReport ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Generating Analysis…</>
                  ) : (
                    <><Sparkles className="h-4 w-4" />Analyse — Get AI Improvement Report</>
                  )}
                </button>
              ) : (
                <div className="rounded-xl bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 p-4">
                  <p className="text-xs font-bold text-purple-600 mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <Sparkles className="h-3.5 w-3.5" /> AI Analysis Report
                  </p>
                  <pre className="text-sm text-[#18181B] whitespace-pre-wrap font-sans leading-relaxed">{aiReport}</pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
