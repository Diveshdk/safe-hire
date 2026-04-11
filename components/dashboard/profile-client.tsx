"use client"

import { useState } from "react"
import { ShieldCheck, User, Briefcase, Building2, FileText, Award, GraduationCap, Activity, CheckCircle2 } from "lucide-react"
import { AchievementsCertificates } from "@/components/dashboard/achievements-certificates"
import { UniversityResultsSection } from "@/components/dashboard/university-results-section"
import Link from "next/link"
import { cn } from "@/lib/utils"

/* ─── Types ─────────────────────────────────────────────────────────────── */
const ROLE_META: Record<string, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  employee:      { label: "Employer",      bg: "bg-amber-100",  text: "text-amber-700",  icon: <Briefcase className="h-3.5 w-3.5" /> },
  employer_admin:{ label: "Employer",      bg: "bg-amber-100",  text: "text-amber-700",  icon: <Briefcase className="h-3.5 w-3.5" /> },
  job_seeker:    { label: "Job Seeker",    bg: "bg-blue-100",   text: "text-blue-700",   icon: <User className="h-3.5 w-3.5" /> },
  organisation:  { label: "Organisation", bg: "bg-purple-100", text: "text-purple-700", icon: <Building2 className="h-3.5 w-3.5" /> },
}

interface ProfileClientProps {
  profile: {
    user_id: string
    full_name: string | null
    aadhaar_full_name: string | null
    aadhaar_verified: boolean
    safe_hire_id: string | null
    role: string
  }
  documents: Array<{
    id: string
    title: string
    doc_type: string
    verification_status: string
    created_at: string
  }>
}

const TABS = [
  { key: "documents",    label: "Documents",   icon: <FileText className="h-4 w-4" /> },
  { key: "certificates", label: "Certificates",icon: <Award className="h-4 w-4" /> },
  { key: "university",   label: "Education",   icon: <GraduationCap className="h-4 w-4" /> },
] as const

type TabKey = (typeof TABS)[number]["key"]

export function ProfileClient({ profile, documents }: ProfileClientProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("documents")

  const displayName = profile.aadhaar_full_name || profile.full_name || "User"
  const roleMeta = ROLE_META[profile.role] || ROLE_META.job_seeker

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const verifiedDocs = documents.filter(d => d.verification_status === "verified").length
  const totalDocs = documents.length

  return (
    <main className="min-h-dvh bg-[#F4F4F6]">
      {/* ── Top Nav ── */}
      <header className="bg-white border-b border-[#E4E4E7] px-6 h-14 flex items-center">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-[#18181B] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SH</span>
            </div>
            <span className="font-bold text-[#18181B]">Safe Hire</span>
          </Link>
          <span className="text-xs text-[#A1A1AA]">Public Profile</span>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#3F3F46] h-36" />

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-6 -mt-10 lg:-mt-16 items-start">

          {/* ─── Left Panel: Profile Card ─────────────────────────────── */}
          <div className="w-full lg:w-72 xl:w-80 shrink-0 lg:sticky lg:top-6">
            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-sm">
              {/* Avatar */}
              <div className="px-6 pb-6 pt-4">
                <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-blue-100 to-blue-200 border-4 border-white shadow-md flex items-center justify-center mb-4">
                  <span className="text-blue-700 text-2xl font-bold">{initials}</span>
                </div>

                <h1 className="text-xl font-bold text-[#18181B] leading-tight">{displayName}</h1>

                {/* Badges */}
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn("inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1", roleMeta.bg, roleMeta.text)}>
                    {roleMeta.icon} {roleMeta.label}
                  </span>
                  {profile.aadhaar_verified && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold rounded-full px-2.5 py-1 bg-emerald-100 text-emerald-700">
                      <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
                    </span>
                  )}
                </div>

                {/* SafeHire ID */}
                {profile.safe_hire_id && (
                  <div className="mt-4 bg-[#F4F4F6] rounded-xl px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-[#A1A1AA] mb-1">Safe Hire ID</p>
                    <p className="font-mono text-sm font-bold text-[#18181B]">{profile.safe_hire_id}</p>
                  </div>
                )}

                {/* Mini Stats */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-[#F9F9FB] border border-[#E4E4E7] px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-[#18181B]">{totalDocs}</p>
                    <p className="text-[10px] text-[#A1A1AA] font-medium mt-0.5">Documents</p>
                  </div>
                  <div className="rounded-xl bg-[#F9F9FB] border border-[#E4E4E7] px-3 py-2.5 text-center">
                    <p className="text-lg font-bold text-emerald-700">{verifiedDocs}</p>
                    <p className="text-[10px] text-[#A1A1AA] font-medium mt-0.5">Verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── Right Panel: Tabbed Content ─────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm mb-5 p-1.5 flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-xl transition-all",
                    activeTab === tab.key
                      ? "bg-[#18181B] text-white shadow-sm"
                      : "text-[#71717A] hover:bg-[#F4F4F6] hover:text-[#18181B]"
                  )}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === "documents" && (
              <DocumentsTab documents={documents} />
            )}
            {activeTab === "certificates" && (
              <AchievementsCertificates userId={profile.user_id} />
            )}
            {activeTab === "university" && (
              <UniversityResultsSection userId={profile.user_id} />
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─── Documents Tab ─────────────────────────────────────────────────────── */
function DocumentsTab({ documents }: { documents: ProfileClientProps["documents"] }) {
  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#E4E4E7] bg-white flex flex-col items-center justify-center py-20 text-center">
        <div className="h-14 w-14 rounded-2xl bg-[#F4F4F6] flex items-center justify-center mb-4">
          <FileText className="h-7 w-7 text-[#A1A1AA]" />
        </div>
        <p className="font-semibold text-[#18181B]">No documents yet</p>
        <p className="text-sm text-[#71717A] mt-1">Documents will appear here once uploaded.</p>
      </div>
    )
  }

  const verified = documents.filter(d => d.verification_status === "verified")
  const others   = documents.filter(d => d.verification_status !== "verified")

  return (
    <div className="space-y-5">
      {/* Summary bar */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm px-5 py-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-[#18181B]">{documents.length} Document{documents.length !== 1 ? "s" : ""}</p>
          <p className="text-sm text-[#71717A] mt-0.5">{verified.length} verified · {others.length} pending</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
        </div>
      </div>

      {/* Document Cards */}
      <div className="grid gap-3">
        {documents.map(doc => (
          <div
            key={doc.id}
            className="bg-white rounded-2xl border border-[#E4E4E7] px-5 py-4 flex items-center justify-between hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className={cn(
                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
                doc.verification_status === "verified" ? "bg-emerald-100" : "bg-amber-100"
              )}>
                <FileText className={cn(
                  "h-5 w-5",
                  doc.verification_status === "verified" ? "text-emerald-600" : "text-amber-600"
                )} />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-[#18181B] truncate">{doc.title || doc.doc_type}</p>
                <p className="text-xs text-[#A1A1AA] capitalize mt-0.5">
                  {doc.doc_type.replace(/_/g, " ")} ·{" "}
                  {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
            </div>
            <span className={cn(
              "shrink-0 text-xs font-semibold px-3 py-1 rounded-full",
              doc.verification_status === "verified"
                ? "bg-emerald-100 text-emerald-700"
                : doc.verification_status === "flagged"
                ? "bg-red-100 text-red-700"
                : "bg-amber-100 text-amber-700"
            )}>
              {doc.verification_status === "verified" ? "✓ Verified"
                : doc.verification_status === "flagged" ? "⚠ Flagged"
                : "⏳ Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
