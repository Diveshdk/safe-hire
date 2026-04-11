"use client"

import type React from "react"
import { useEffect, useState, useMemo } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Award, Trophy, Users, Calendar, Building2, ExternalLink,
  Shield, Link2, Search, ChevronDown, ChevronUp, Filter,
  CheckCircle2, Clock, SlidersHorizontal, X,
} from "lucide-react"
import { cn } from "@/lib/utils"

/* ─── Types (match actual DB shape) ─────────────────────────────────────── */
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

/* ─── Section config ─────────────────────────────────────────────────────── */
const SECTION_CONFIG = {
  achievement: {
    label: "Achievements",
    icon: Award,
    accent: "blue",
    bg: "bg-blue-50",
    border: "border-blue-200/60",
    iconColor: "text-blue-600",
    iconBg: "bg-blue-100",
    badgeBg: "bg-blue-100 text-blue-700",
    cardBorder: "border-blue-200/50",
    cardBg: "from-blue-50/60 to-white",
    countBg: "bg-blue-600",
  },
  winner: {
    label: "Winner Certificates",
    icon: Trophy,
    accent: "amber",
    bg: "bg-amber-50",
    border: "border-amber-200/60",
    iconColor: "text-amber-600",
    iconBg: "bg-amber-100",
    badgeBg: "bg-amber-100 text-amber-700",
    cardBorder: "border-amber-200/50",
    cardBg: "from-amber-50/60 to-white",
    countBg: "bg-amber-500",
  },
  participant: {
    label: "Participation Certificates",
    icon: Users,
    accent: "purple",
    bg: "bg-purple-50",
    border: "border-purple-200/60",
    iconColor: "text-purple-600",
    iconBg: "bg-purple-100",
    badgeBg: "bg-purple-100 text-purple-700",
    cardBorder: "border-purple-200/50",
    cardBg: "from-purple-50/60 to-white",
    countBg: "bg-purple-600",
  },
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
export function AchievementsCertificates({ userId }: { userId?: string }) {
  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [uploadedAchievements, setUploadedAchievements] = useState<UserDocument[]>([])
  const [loading, setLoading] = useState(true)

  // Filter state
  const [search, setSearch] = useState("")
  const [filterType, setFilterType] = useState<"all" | "achievement" | "winner" | "participant">("all")
  const [filterStatus, setFilterStatus] = useState<"all" | "verified" | "pending">("all")
  const [filterDate, setFilterDate] = useState<"all" | "7d" | "30d">("all")
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest")
  const [showFilters, setShowFilters] = useState(false)

  // Section collapse state
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})

  useEffect(() => { fetchData() }, [userId])

  const fetchData = async () => {
    setLoading(true)
    try {
      const certUrl = userId ? `/api/certificates/list?user_id=${userId}` : "/api/certificates/list"
      const certRes = await fetch(certUrl)
      const certData = await certRes.json()
      if (certData.ok) setCertificates(certData.certificates || [])

      const docUrl = userId ? `/api/documents/list?user_id=${userId}` : "/api/documents/list"
      const docRes = await fetch(docUrl)
      const docData = await docRes.json()
      if (docData.ok) {
        // Only include self-uploaded 'certificate' types, exclude system-generated 'event_certificate'
        const achievementDocs = (docData.documents || []).filter(
          (d: any) => d.doc_type === "certificate" && d.verification_status === "verified"
        )
        setUploadedAchievements(achievementDocs)
      }
    } catch (err) {
      console.error("Failed to fetch achievements:", err)
    } finally {
      setLoading(false)
    }
  }

  const verifyCertificate = (hash: string) => window.open(`/verify/certificate/${hash}`, "_blank")

  /* ── Build unified item list ── */
  const allItems = useMemo(() => {
    const items: Array<{
      id: string; type: "achievement" | "winner" | "participant"
      title: string; issuer: string; date: string; status: string
      hash?: string; description?: string; event?: string; fileUrl?: string
    }> = [
      ...uploadedAchievements.map(d => ({
        id: d.id,
        type: "achievement" as const,
        title: d.title,
        issuer: "Self-uploaded",
        date: d.created_at,
        status: d.verification_status,
        description: d.ocr_data?.description,
        fileUrl: d.file_url ?? undefined,
      })),
      ...certificates.map(c => ({
        id: c.id,
        type: c.certificate_type === "winner" ? "winner" as const : "participant" as const,
        title: c.title,
        issuer: c.issued_by_org_name || c.issued_by_name,
        date: c.issued_at,
        status: c.verification_status || "verified",
        hash: c.verification_hash,
        description: c.description,
        event: c.events?.title,
      })),
    ]
    return items
  }, [certificates, uploadedAchievements])

  /* ── Filter + search ── */
  const filteredItems = useMemo(() => {
    const cutoff = filterDate === "7d"
      ? Date.now() - 7 * 86400000
      : filterDate === "30d"
      ? Date.now() - 30 * 86400000
      : 0

    return allItems
      .filter(item => filterType === "all" || item.type === filterType)
      .filter(item => {
        if (filterStatus === "verified") return item.status === "verified"
        if (filterStatus === "pending") return item.status !== "verified"
        return true
      })
      .filter(item => cutoff === 0 || new Date(item.date).getTime() >= cutoff)
      .filter(item => {
        if (!search) return true
        const q = search.toLowerCase()
        return item.title.toLowerCase().includes(q) || item.issuer.toLowerCase().includes(q) || (item.event ?? "").toLowerCase().includes(q)
      })
      .sort((a, b) => {
        const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
        return sortOrder === "newest" ? diff : -diff
      })
  }, [allItems, filterType, filterStatus, filterDate, sortOrder, search])

  /* ── Stats ── */
  const totalCount = allItems.length
  const verifiedCount = allItems.filter(i => i.status === "verified").length
  const achievementCount = allItems.filter(i => i.type === "achievement").length
  const winnerCount = allItems.filter(i => i.type === "winner").length

  /* ── Section grouping ── */
  const sections = useMemo(() => [
    { key: "achievement" as const, items: filteredItems.filter(i => i.type === "achievement") },
    { key: "winner" as const, items: filteredItems.filter(i => i.type === "winner") },
    { key: "participant" as const, items: filteredItems.filter(i => i.type === "participant") },
  ], [filteredItems])

  const hasActiveFilters = search || filterType !== "all" || filterStatus !== "all" || filterDate !== "all"

  const clearFilters = () => {
    setSearch(""); setFilterType("all"); setFilterStatus("all"); setFilterDate("all")
  }

  /* ── Loading skeleton ── */
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-14 rounded-2xl" />
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="rounded-2xl border bg-white p-5 space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1,2,3].map(j => <Skeleton key={j} className="h-40 rounded-xl" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">

      {/* ── Summary Stats ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Certificates" value={totalCount} icon={Award} color="blue" />
        <StatCard label="Verified" value={verifiedCount} icon={CheckCircle2} color="green" />
        <StatCard label="Achievements" value={achievementCount} icon={Award} color="indigo" />
        <StatCard label="Winner Certs" value={winnerCount} icon={Trophy} color="amber" />
      </div>

      {/* ── Filter Bar ── */}
      <div className="bg-white border border-[#E4E4E7] rounded-2xl overflow-hidden shadow-sm">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#A1A1AA]" />
            <input
              type="text"
              placeholder="Search certificates or events…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-[#E4E4E7] bg-[#F9F9FB] text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#18181B] transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={cn(
              "flex items-center gap-2 h-9 px-4 rounded-xl border text-sm font-medium transition-colors",
              showFilters || hasActiveFilters
                ? "bg-[#18181B] text-white border-[#18181B]"
                : "bg-white border-[#E4E4E7] text-[#52525B] hover:bg-[#F4F4F6]"
            )}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Filters
            {hasActiveFilters && (
              <span className="h-4 w-4 rounded-full bg-white/20 text-[10px] font-bold flex items-center justify-center">
                !
              </span>
            )}
          </button>
          <div className="flex items-center gap-2">
            <select
              value={sortOrder}
              onChange={e => setSortOrder(e.target.value as any)}
              className="h-9 text-sm border border-[#E4E4E7] bg-white rounded-xl px-3 text-[#52525B] focus:outline-none focus:border-[#18181B] cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="h-9 px-3 rounded-xl text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 border border-red-200/60 flex items-center gap-1.5 transition-colors"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
        </div>

        {/* Expanded Filter Row */}
        {showFilters && (
          <div className="border-t border-[#F4F4F6] px-4 py-3 flex flex-wrap gap-2 bg-[#F9F9FB]">
            <FilterGroup label="Type" value={filterType} onChange={v => setFilterType(v as any)} options={[
              { value: "all", label: "All Types" },
              { value: "achievement", label: "🏆 Achievements" },
              { value: "winner", label: "🥇 Winner" },
              { value: "participant", label: "🎓 Participation" },
            ]} />
            <FilterGroup label="Status" value={filterStatus} onChange={v => setFilterStatus(v as any)} options={[
              { value: "all", label: "All Status" },
              { value: "verified", label: "✅ Verified" },
              { value: "pending", label: "⏳ Pending" },
            ]} />
            <FilterGroup label="Date" value={filterDate} onChange={v => setFilterDate(v as any)} options={[
              { value: "all", label: "All Time" },
              { value: "7d", label: "Last 7 days" },
              { value: "30d", label: "Last 30 days" },
            ]} />
          </div>
        )}
      </div>

      {/* ── Empty State (total) ── */}
      {totalCount === 0 && (
        <div className="rounded-2xl border-2 border-dashed border-[#E4E4E7] bg-white flex flex-col items-center justify-center py-20 text-center">
          <div className="h-16 w-16 rounded-2xl bg-[#F4F4F6] flex items-center justify-center mb-4">
            <Award className="h-8 w-8 text-[#A1A1AA]" />
          </div>
          <p className="font-semibold text-[#18181B]">No certificates yet</p>
          <p className="text-sm text-[#71717A] mt-1 max-w-xs">
            Certificates from events, competitions, and uploads will appear here.
          </p>
        </div>
      )}

      {/* ── No filter results ── */}
      {totalCount > 0 && filteredItems.length === 0 && (
        <div className="rounded-2xl border border-[#E4E4E7] bg-white flex flex-col items-center justify-center py-16 text-center">
          <Filter className="h-8 w-8 text-[#A1A1AA] mb-3" />
          <p className="font-semibold text-[#18181B]">No certificates match your filters</p>
          <button onClick={clearFilters} className="mt-3 text-sm text-blue-600 hover:underline">
            Clear filters
          </button>
        </div>
      )}

      {/* ── Sections ── */}
      {sections.map(({ key, items }) => {
        if (items.length === 0) return null
        const cfg = SECTION_CONFIG[key]
        const Icon = cfg.icon
        const isCollapsed = collapsed[key]
        return (
          <div key={key} className={cn("rounded-2xl border overflow-hidden shadow-sm", cfg.border)}>
            {/* Section Header */}
            <button
              className={cn("w-full flex items-center justify-between px-5 py-4 hover:brightness-95 transition-all", cfg.bg)}
              onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
            >
              <div className="flex items-center gap-3">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", cfg.iconBg)}>
                  <Icon className={cn("h-4 w-4", cfg.iconColor)} />
                </div>
                <span className="font-bold text-[#18181B] text-base">{cfg.label}</span>
                <span className={cn("text-white text-xs font-bold px-2.5 py-0.5 rounded-full", cfg.countBg)}>
                  {items.length}
                </span>
              </div>
              {isCollapsed
                ? <ChevronDown className="h-4 w-4 text-[#71717A]" />
                : <ChevronUp className="h-4 w-4 text-[#71717A]" />
              }
            </button>

            {/* Section Content */}
            {!isCollapsed && (
              <div className="bg-white px-5 py-5">
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {items.map(item => (
                    <CertificateCard
                      key={item.id}
                      item={item}
                      cfg={cfg}
                      onVerify={item.hash ? () => verifyCertificate(item.hash!) : undefined}
                      onView={item.fileUrl ? () => window.open(item.fileUrl!, "_blank") : undefined}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ─── Stat Card ─────────────────────────────────────────────────────────── */
function StatCard({
  label, value, icon: Icon, color,
}: {
  label: string; value: number; icon: any; color: "blue" | "green" | "indigo" | "amber"
}) {
  const styles = {
    blue:   { bg: "bg-blue-50",   icon: "bg-blue-100 text-blue-600",   val: "text-blue-700" },
    green:  { bg: "bg-green-50",  icon: "bg-green-100 text-green-600",  val: "text-green-700" },
    indigo: { bg: "bg-indigo-50", icon: "bg-indigo-100 text-indigo-600", val: "text-indigo-700" },
    amber:  { bg: "bg-amber-50",  icon: "bg-amber-100 text-amber-600",  val: "text-amber-700" },
  }[color]

  return (
    <div className={cn("rounded-2xl border border-white/50 p-4 shadow-sm", styles.bg)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs font-medium text-[#71717A] leading-tight">{label}</p>
          <p className={cn("text-3xl font-bold mt-1", styles.val)}>{value}</p>
        </div>
        <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center shrink-0", styles.icon)}>
          <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
        </div>
      </div>
    </div>
  )
}

/* ─── Filter Group ───────────────────────────────────────────────────────── */
function FilterGroup({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-semibold text-[#A1A1AA] uppercase tracking-wider">{label}:</span>
      <div className="flex gap-1">
        {options.map(opt => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full border font-medium transition-colors",
              value === opt.value
                ? "bg-[#18181B] text-white border-[#18181B]"
                : "bg-white text-[#52525B] border-[#E4E4E7] hover:bg-[#F4F4F6]"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ─── Certificate Card ───────────────────────────────────────────────────── */
function CertificateCard({
  item, cfg, onVerify, onView,
}: {
  item: {
    id: string; type: string; title: string; issuer: string; date: string
    status: string; description?: string; event?: string; fileUrl?: string; hash?: string
  }
  cfg: typeof SECTION_CONFIG["achievement"]
  onVerify?: () => void
  onView?: () => void
}) {
  const isVerified = item.status === "verified"

  return (
    <div className={cn(
      "rounded-xl border bg-gradient-to-br p-4 flex flex-col gap-3 group hover:shadow-md transition-all duration-200 hover:-translate-y-0.5",
      cfg.cardBorder, cfg.cardBg
    )}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-[#18181B] leading-tight line-clamp-2">{item.title}</h4>
          {item.description && (
            <p className="text-xs text-[#71717A] mt-0.5 line-clamp-1">{item.description}</p>
          )}
        </div>
        {/* Status Badge */}
        <span className={cn(
          "shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full border",
          isVerified
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-amber-100 text-amber-700 border-amber-200"
        )}>
          {isVerified
            ? <><CheckCircle2 className="h-3 w-3" /> Verified</>
            : <><Clock className="h-3 w-3" /> Pending</>
          }
        </span>
      </div>

      {/* Type Badge */}
      <div>
        <span className={cn("text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide", cfg.badgeBg)}>
          {cfg.label.replace(" Certificates", "")}
        </span>
      </div>

      {/* Meta */}
      <div className="space-y-1.5 text-xs text-[#71717A]">
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 shrink-0" />
          <span className="truncate font-medium text-[#52525B]">{item.issuer}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5 shrink-0" />
          <span>{new Date(item.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
        </div>
        {item.event && (
          <div className="flex items-center gap-1.5 pt-1 border-t border-black/5">
            <Shield className="h-3.5 w-3.5 shrink-0 text-[#A1A1AA]" />
            <span className="truncate italic">{item.event}</span>
          </div>
        )}
      </div>

      {/* Action */}
      <div className="mt-auto pt-2 border-t border-black/5">
        {onVerify && (
          <button
            onClick={onVerify}
            className={cn(
              "w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg transition-colors",
              "bg-white/70 border border-black/10 text-[#18181B] hover:bg-white hover:shadow-sm"
            )}
          >
            <ExternalLink className="h-3 w-3" /> Verify Certificate
          </button>
        )}
        {onView && (
          <button
            onClick={onView}
            className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-lg bg-white/70 border border-black/10 text-[#18181B] hover:bg-white hover:shadow-sm transition-colors"
          >
            <Link2 className="h-3 w-3" /> View Document
          </button>
        )}
      </div>
    </div>
  )
}
