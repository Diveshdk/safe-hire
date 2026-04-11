"use client"

import { useState, useMemo } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  Briefcase, CheckCircle2, XCircle, Clock, ShieldCheck, FileText,
  ChevronDown, ChevronUp, ExternalLink, AlertTriangle, Search,
  Users, MapPin, Building2, Calendar, Filter, TrendingUp, X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import type React from "react"

const fetcher = (url: string) => fetch(url).then(r => r.json())

/* ─── Status config ─────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<string, {
  label: string; bg: string; text: string; border: string; icon: React.ReactNode
}> = {
  applied:      { label: "Applied",      bg: "bg-blue-50",   text: "text-blue-700",  border: "border-blue-200", icon: <Clock className="h-3 w-3" /> },
  verified:     { label: "Shortlisted",  bg: "bg-emerald-50",text: "text-emerald-700",border: "border-emerald-200", icon: <CheckCircle2 className="h-3 w-3" /> },
  hired:        { label: "Hired",        bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", icon: <ShieldCheck className="h-3 w-3" /> },
  not_authentic:{ label: "Not Authentic",bg: "bg-red-50",    text: "text-red-700",   border: "border-red-200",  icon: <XCircle className="h-3 w-3" /> },
  rejected:     { label: "Rejected",     bg: "bg-zinc-100",  text: "text-zinc-600",  border: "border-zinc-200", icon: <XCircle className="h-3 w-3" /> },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.applied
  return (
    <span className={cn(
      "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border",
      cfg.bg, cfg.text, cfg.border
    )}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

/* ─── Main Panel ─────────────────────────────────────────────────────────── */
export function ApplicantsPanel({ jobId }: { jobId?: string }) {
  const url = jobId ? `/api/jobs/applications?job_id=${jobId}` : "/api/jobs/applications"
  const { data, isLoading, mutate } = useSWR(url, fetcher)
  const applications: any[] = data?.applications || []

  const [search, setSearch] = useState("")
  const [filterJob, setFilterJob] = useState<string>("all")
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectingApp, setRejectingApp] = useState<any>(null)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [collapsedJobs, setCollapsedJobs] = useState<Record<string, boolean>>({})
  const { toast } = useToast()

  /* ── Filter applications ── */
  const filteredApps = useMemo(() => {
    return applications.filter(app => {
      const name = (app.applicant?.full_name || app.applicant?.aadhaar_full_name || "").toLowerCase()
      const safeId = (app.safe_hire_id || app.applicant?.safe_hire_id || "").toLowerCase()
      const jobTitle = (app.jobs?.title || "").toLowerCase()
      const q = search.toLowerCase()

      if (filterStatus !== "all" && app.status !== filterStatus) return false
      if (filterJob !== "all" && app.jobs?.id !== filterJob) return false
      if (search && !name.includes(q) && !safeId.includes(q) && !jobTitle.includes(q)) return false
      return true
    })
  }, [applications, search, filterStatus, filterJob])

  /* ── Group by job ── */
  const jobGroups = useMemo(() => {
    const map = new Map<string, { job: any; apps: any[] }>()
    filteredApps.forEach(app => {
      const jid = app.jobs?.id || "unknown"
      if (!map.has(jid)) map.set(jid, { job: app.jobs, apps: [] })
      map.get(jid)!.apps.push(app)
    })
    return Array.from(map.values())
  }, [filteredApps])

  /* ── Unique jobs for filter dropdown ── */
  const uniqueJobs = useMemo(() => {
    const seen = new Set<string>()
    return applications
      .filter(a => { if (seen.has(a.jobs?.id)) return false; seen.add(a.jobs?.id); return true })
      .map(a => ({ id: a.jobs?.id, title: a.jobs?.title }))
  }, [applications])

  /* ── Summary stats (across all, unfiltered) ── */
  const stats = useMemo(() => ({
    total:      applications.length,
    applied:    applications.filter(a => a.status === "applied").length,
    shortlisted:applications.filter(a => a.status === "verified").length,
    hired:      applications.filter(a => a.status === "hired").length,
    rejected:   applications.filter(a => a.status === "rejected").length,
  }), [applications])

  const hasActiveFilters = search || filterJob !== "all" || filterStatus !== "all"

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
      toast({ title: `Applicant marked as ${status}` })
      mutate()
    } else {
      toast({ title: "Update failed", description: json.message, variant: "destructive" })
    }
    return json.ok
  }

  /* ── Loading ── */
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="rounded-2xl bg-white border border-[#E4E4E7] h-20 animate-pulse" />
          ))}
        </div>
        <div className="rounded-2xl bg-white border border-[#E4E4E7] h-14 animate-pulse" />
        {[1,2].map(i => (
          <div key={i} className="rounded-2xl bg-white border border-[#E4E4E7] h-64 animate-pulse" />
        ))}
      </div>
    )
  }

  /* ── No applications at all ── */
  if (applications.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#E4E4E7] bg-white flex flex-col items-center justify-center py-20 text-center">
        <div className="h-16 w-16 rounded-2xl bg-[#F4F4F6] flex items-center justify-center mb-4">
          <Users className="h-8 w-8 text-[#A1A1AA]" />
        </div>
        <p className="font-semibold text-[#18181B]">No applications yet</p>
        <p className="text-sm text-[#71717A] mt-1 max-w-xs">
          Post a job and applications will appear here, grouped by job posting.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-5">

        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <PanelStat label="Total" value={stats.total} color="slate" />
          <PanelStat label="Applied" value={stats.applied} color="blue" />
          <PanelStat label="Shortlisted" value={stats.shortlisted} color="green" />
          <PanelStat label="Hired" value={stats.hired} color="purple" />
          <PanelStat label="Rejected" value={stats.rejected} color="red" />
        </div>

        {/* ── Filter Bar ── */}
        <div className="bg-white border border-[#E4E4E7] rounded-2xl px-4 py-3 flex flex-wrap items-center gap-3 shadow-sm">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search by name, SafeHire ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-[#E4E4E7] bg-[#F9F9FB] text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#18181B] transition-colors"
            />
          </div>

          {/* Job filter */}
          <select
            value={filterJob}
            onChange={e => setFilterJob(e.target.value)}
            className="h-9 text-sm border border-[#E4E4E7] bg-white rounded-xl px-3 text-[#52525B] focus:outline-none focus:border-[#18181B] cursor-pointer min-w-[140px]"
          >
            <option value="all">All Jobs</option>
            {uniqueJobs.map(j => (
              <option key={j.id} value={j.id}>{j.title}</option>
            ))}
          </select>

          {/* Status filter */}
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="h-9 text-sm border border-[#E4E4E7] bg-white rounded-xl px-3 text-[#52525B] focus:outline-none focus:border-[#18181B] cursor-pointer min-w-[130px]"
          >
            <option value="all">All Statuses</option>
            <option value="applied">Applied</option>
            <option value="verified">Shortlisted</option>
            <option value="hired">Hired</option>
            <option value="rejected">Rejected</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={() => { setSearch(""); setFilterJob("all"); setFilterStatus("all") }}
              className="h-9 px-3 rounded-xl text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 flex items-center gap-1.5 transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}

          <span className="ml-auto text-xs text-[#A1A1AA] font-medium">
            {filteredApps.length} applicant{filteredApps.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* ── No filter results ── */}
        {filteredApps.length === 0 && (
          <div className="rounded-2xl border border-[#E4E4E7] bg-white flex flex-col items-center justify-center py-16 text-center">
            <Filter className="h-8 w-8 text-[#A1A1AA] mb-3" />
            <p className="font-semibold text-[#18181B]">No applicants match your filters</p>
          </div>
        )}

        {/* ── Job Groups ── */}
        {jobGroups.map(({ job, apps }) => {
          const jid = job?.id || "unknown"
          const isCollapsed = collapsedJobs[jid]
          const jobStats = {
            applied:     apps.filter(a => a.status === "applied").length,
            shortlisted: apps.filter(a => a.status === "verified").length,
            hired:       apps.filter(a => a.status === "hired").length,
            rejected:    apps.filter(a => a.status === "rejected").length,
          }
          return (
            <div key={jid} className="rounded-2xl border border-[#E4E4E7] bg-white overflow-hidden shadow-sm">

              {/* Job Header */}
              <button
                className="w-full flex items-start justify-between p-5 hover:bg-[#F9F9FB] transition-colors text-left"
                onClick={() => setCollapsedJobs(prev => ({ ...prev, [jid]: !prev[jid] }))}
              >
                <div className="flex items-start gap-4 flex-1 min-w-0">
                  <div className="h-11 w-11 rounded-xl bg-[#18181B] flex items-center justify-center shrink-0">
                    <Briefcase className="h-5 w-5 text-white" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[#18181B] text-base">{job?.title || "Unknown Job"}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {job?.companies?.name && (
                        <span className="flex items-center gap-1 text-xs text-[#71717A]">
                          <Building2 className="h-3 w-3" /> {job.companies.name}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-[#71717A]">
                        <Users className="h-3 w-3" /> {apps.length} applicant{apps.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {/* Per-job mini stats */}
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {jobStats.applied > 0    && <JobStatPill label="Applied" count={jobStats.applied} color="blue" />}
                      {jobStats.shortlisted > 0 && <JobStatPill label="Shortlisted" count={jobStats.shortlisted} color="green" />}
                      {jobStats.hired > 0      && <JobStatPill label="Hired" count={jobStats.hired} color="purple" />}
                      {jobStats.rejected > 0   && <JobStatPill label="Rejected" count={jobStats.rejected} color="red" />}
                    </div>
                  </div>
                </div>
                <div className="ml-4 shrink-0 text-[#A1A1AA]">
                  {isCollapsed ? <ChevronDown className="h-5 w-5" /> : <ChevronUp className="h-5 w-5" />}
                </div>
              </button>

              {/* Applicants */}
              {!isCollapsed && (
                <div className="border-t border-[#F4F4F6] divide-y divide-[#F4F4F6]">
                  {apps.map(app => (
                    <ApplicantRow
                      key={app.id}
                      app={app}
                      isExpanded={!!expandedCards[app.id]}
                      onToggle={() => setExpandedCards(prev => ({ ...prev, [app.id]: !prev[app.id] }))}
                      onStatusChange={updateStatus}
                      onOpenReject={(a) => { setRejectingApp(a); setRejectDialogOpen(true) }}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Reject Dialog ── */}
      <RejectDialog
        open={rejectDialogOpen}
        onOpenChange={setRejectDialogOpen}
        app={rejectingApp}
        onReject={async (reasons) => {
          if (rejectingApp) {
            const ok = await updateStatus(rejectingApp.id, "rejected", reasons)
            if (ok) setRejectDialogOpen(false)
          }
        }}
      />
    </>
  )
}

/* ─── Panel Stat Card ────────────────────────────────────────────────────── */
function PanelStat({
  label, value, color,
}: { label: string; value: number; color: "slate" | "blue" | "green" | "purple" | "red" }) {
  const styles = {
    slate:  { bg: "bg-[#F4F4F6]",  val: "text-[#18181B]" },
    blue:   { bg: "bg-blue-50",    val: "text-blue-700" },
    green:  { bg: "bg-emerald-50", val: "text-emerald-700" },
    purple: { bg: "bg-purple-50",  val: "text-purple-700" },
    red:    { bg: "bg-red-50",     val: "text-red-700" },
  }[color]
  return (
    <div className={cn("rounded-2xl border border-white/60 px-4 py-3 shadow-sm", styles.bg)}>
      <p className="text-xs font-medium text-[#71717A]">{label}</p>
      <p className={cn("text-2xl font-bold mt-0.5", styles.val)}>{value}</p>
    </div>
  )
}

/* ─── Job Stat Pill ─────────────────────────────────────────────────────── */
function JobStatPill({ label, count, color }: { label: string; count: number; color: string }) {
  const styles: Record<string, string> = {
    blue:   "bg-blue-100 text-blue-700",
    green:  "bg-emerald-100 text-emerald-700",
    purple: "bg-purple-100 text-purple-700",
    red:    "bg-red-100 text-red-700",
  }
  return (
    <span className={cn("inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full", styles[color])}>
      {count} {label}
    </span>
  )
}

/* ─── Applicant Row ─────────────────────────────────────────────────────── */
function ApplicantRow({
  app, isExpanded, onToggle, onStatusChange, onOpenReject,
}: {
  app: any
  isExpanded: boolean
  onToggle: () => void
  onStatusChange: (id: string, status: string) => Promise<boolean>
  onOpenReject: (app: any) => void
}) {
  const name = app.applicant?.full_name || app.applicant?.aadhaar_full_name || "Unknown Applicant"
  const safeHireId = app.safe_hire_id || app.applicant?.safe_hire_id
  const appliedDate = app.created_at ? new Date(app.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"
  const verifiedDocs = (app.documents || []).filter((d: any) => d.verification_status === "verified")
  const totalDocs = app.documents?.length || 0
  const canAct = !["rejected", "hired"].includes(app.status)

  return (
    <div>
      {/* Row Summary */}
      <div
        className="flex items-center justify-between px-5 py-4 hover:bg-[#F9F9FB] transition-colors cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4 min-w-0 flex-1">
          {/* Avatar */}
          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shrink-0 text-sm font-bold text-[#52525B]">
            {name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-sm text-[#18181B]">{name}</p>
              {app.applicant?.aadhaar_verified && (
                <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded-full px-2 py-0.5">
                  <ShieldCheck className="h-2.5 w-2.5" /> Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              {safeHireId && (
                <span className="text-[11px] font-mono text-[#A1A1AA]">{safeHireId}</span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA]">
                <Calendar className="h-3 w-3" /> {appliedDate}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA]">
                <FileText className="h-3 w-3" /> {verifiedDocs.length}/{totalDocs} docs verified
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 ml-3 shrink-0">
          <StatusBadge status={app.status} />
          {isExpanded
            ? <ChevronUp className="h-4 w-4 text-[#A1A1AA]" />
            : <ChevronDown className="h-4 w-4 text-[#A1A1AA]" />
          }
        </div>
      </div>

      {/* Expanded Detail Panel */}
      {isExpanded && (
        <div className="bg-[#F9F9FB] border-t border-[#F4F4F6] px-5 py-5 grid gap-5">
          <div className="grid md:grid-cols-2 gap-5">

            {/* Documents Column */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-3">
                Documents ({totalDocs})
              </p>
              {totalDocs === 0 ? (
                <p className="text-sm text-[#A1A1AA] italic">No documents uploaded.</p>
              ) : (
                <div className="space-y-2">
                  {(app.documents || []).map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-white rounded-xl border border-[#E4E4E7] px-3 py-2.5"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="h-4 w-4 text-[#A1A1AA] shrink-0" />
                        <span className="text-sm text-[#52525B] truncate">
                          {doc.title || doc.doc_type.replace("_", " ")}
                        </span>
                      </div>
                      <span className={cn(
                        "text-[10px] font-semibold px-2 py-0.5 rounded-full ml-2 shrink-0",
                        doc.verification_status === "verified"
                          ? "bg-green-100 text-green-700"
                          : "bg-amber-100 text-amber-700"
                      )}>
                        {doc.verification_status === "verified" ? "✓ Verified" : "Pending"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Actions Column */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#A1A1AA] mb-3">
                Recruiter Actions
              </p>

              {/* Rejection reasons if rejected */}
              {app.status === "rejected" && app.rejection_reasons && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-3">
                  <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
                    <AlertTriangle className="h-3.5 w-3.5" /> Rejection Reasons
                  </p>
                  {(app.rejection_reasons as string[]).map((r, i) => (
                    <p key={i} className="text-xs text-red-700">
                      {i + 1}. {r}
                    </p>
                  ))}
                </div>
              )}

              <div className="flex flex-col gap-2">
                {safeHireId && (
                  <Link href={`/profile/${safeHireId}`} target="_blank">
                    <button className="w-full flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#E4E4E7] bg-white text-[#18181B] hover:bg-[#F4F4F6] transition-colors">
                      <ExternalLink className="h-4 w-4" /> View SafeHire Profile
                    </button>
                  </Link>
                )}

                {canAct && (
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    <button
                      onClick={() => onStatusChange(app.id, "verified")}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Shortlist
                    </button>
                    <button
                      onClick={() => onStatusChange(app.id, "hired")}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors"
                    >
                      <Briefcase className="h-3.5 w-3.5" /> Hire
                    </button>
                    <button
                      onClick={() => onOpenReject(app)}
                      className="flex items-center justify-center gap-1.5 text-xs font-semibold py-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                    >
                      <XCircle className="h-3.5 w-3.5" /> Reject
                    </button>
                  </div>
                )}

                {app.status === "hired" && (
                  <div className="rounded-xl bg-purple-50 border border-purple-200 px-3 py-2.5 text-xs font-semibold text-purple-700 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" /> This candidate has been hired.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Reject Dialog ─────────────────────────────────────────────────────── */
function RejectDialog({
  open, onOpenChange, app, onReject,
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
  const canSubmit = reason1.trim() && reason2.trim() && reason3.trim()

  async function handleSubmit() {
    if (!canSubmit) return
    setSubmitting(true)
    await onReject([reason1.trim(), reason2.trim(), reason3.trim()])
    setSubmitting(false)
    setReason1(""); setReason2(""); setReason3("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl border-[#E4E4E7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <XCircle className="h-5 w-5" /> Reject Applicant
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[#71717A]">
          Provide 3 specific reasons for rejecting{" "}
          <span className="font-semibold text-[#18181B]">{name}</span>. This feedback is shared with the applicant.
        </p>
        <div className="space-y-3 mt-2">
          {[
            { id: "reason1", label: "Reason 1", value: reason1, set: setReason1, placeholder: "e.g., Insufficient experience in the required skill" },
            { id: "reason2", label: "Reason 2", value: reason2, set: setReason2, placeholder: "e.g., Communication skills need improvement" },
            { id: "reason3", label: "Reason 3", value: reason3, set: setReason3, placeholder: "e.g., Missing relevant certifications" },
          ].map(field => (
            <div key={field.id} className="grid gap-1.5">
              <Label htmlFor={field.id} className="text-xs font-semibold text-[#71717A]">{field.label}</Label>
              <Input
                id={field.id}
                value={field.value}
                onChange={e => field.set(e.target.value)}
                placeholder={field.placeholder}
                maxLength={200}
                className="rounded-xl border-[#E4E4E7] focus:border-[#18181B]"
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-2">
          <Button variant="outline" className="rounded-full" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            className="rounded-full"
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
          >
            {submitting ? "Rejecting…" : "Confirm Rejection"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
