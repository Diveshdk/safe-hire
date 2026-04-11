import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, TrendingUp, Briefcase, FileText, Award, GraduationCap, Bot, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"
import { FeedClient } from "@/components/dashboard/feed-client"

export default async function JobSeekerDashboardPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role === "employee" || profile?.role === "employer_admin") redirect("/dashboard/employee")
  if (profile?.role === "organisation") redirect("/dashboard/organisation")

  const displayName = profile?.aadhaar_full_name || profile?.full_name || "Job Seeker"

  // 1. Determine following entities
  const { data: followData } = await supabase
    .from("follows")
    .select("entity_id, entity_type")
    .eq("user_id", user.id)

  const orgIds = followData?.filter(f => f.entity_type === "organisation").map(f => f.entity_id) ?? []
  const companyIds = followData?.filter(f => f.entity_type === "company").map(f => f.entity_id) ?? []
  const isFallback = orgIds.length === 0 && companyIds.length === 0

  // 2. Fetch Events
  let eventsQ = supabase
    .from("events")
    .select("id, title, description, event_type, event_date, created_at, org_user_id")
    .order("created_at", { ascending: false })
    .limit(20)
  if (!isFallback && orgIds.length > 0) eventsQ = eventsQ.in("org_user_id", orgIds)
  const { data: eventsRaw } = await eventsQ

  // 3. Fetch Jobs
  let jobsQ = supabase
    .from("jobs")
    .select("id, title, description, job_type, location, salary_range, status, created_at, company_id, companies(name, id)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(20)
  if (!isFallback && companyIds.length > 0) jobsQ = jobsQ.in("company_id", companyIds)
  const { data: jobsRaw } = await jobsQ

  // 4. Fetch Social Posts
  let postsQ = supabase
    .from("posts")
    .select("id, content, image_url, created_at, org_user_id")
    .order("created_at", { ascending: false })
    .limit(20)
  if (!isFallback && orgIds.length > 0) postsQ = postsQ.in("org_user_id", orgIds)
  const { data: postsRaw } = await postsQ

  // 5. Aggregate Organisation/Profile names
  const allOrgUserIds = [
    ...new Set([
        ...(eventsRaw ?? []).map((e: any) => e.org_user_id),
        ...(postsRaw ?? []).map((p: any) => p.org_user_id)
    ])
  ].filter(Boolean)
  
  let orgNames: Record<string, string> = {}
  if (allOrgUserIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, aadhaar_full_name, full_name")
      .in("user_id", allOrgUserIds)
    orgNames = Object.fromEntries(
      (profilesData ?? []).map((p: any) => [p.user_id, p.aadhaar_full_name || p.full_name || "Organisation"])
    )
  }

  // 6. Merge initial items
  const events = (eventsRaw ?? []).map((e: any) => ({
    ...e,
    _type: "event" as const,
    org_name: orgNames[e.org_user_id] || "Organisation",
  }))

  const jobs = (jobsRaw ?? []).map((j: any) => ({
    ...j,
    _type: "job" as const,
    org_name: j.companies?.name || "Company",
  }))

  const posts = (postsRaw ?? []).map((p: any) => ({
    ...p,
    _type: "post" as const,
    org_name: orgNames[p.org_user_id] || "Organisation",
  }))

  const initialItems = [...events, ...jobs, ...posts]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 20) as any[]

  const initialCursor = initialItems.length >= 20 ? initialItems[initialItems.length - 1]?.created_at : null

  const quickLinks = [
    { icon: <Briefcase className="h-4 w-4" />, label: "Find Jobs", href: "/dashboard/job-seeker/jobs" },
    { icon: <FileText className="h-4 w-4" />, label: "Documents", href: "/dashboard/job-seeker/documents" },
    { icon: <Award className="h-4 w-4" />, label: "Certificates", href: "/dashboard/job-seeker/certificates" },
    { icon: <GraduationCap className="h-4 w-4" />, label: "Results", href: "/dashboard/job-seeker/university" },
    { icon: <Bot className="h-4 w-4" />, label: "AI Review", href: "/dashboard/job-seeker/ai-resume" },
  ]

  return (
    <div className="grid gap-6">
      {/* ── Identity Card ── */}
      <div className="bg-[#18181B] text-white rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold">{displayName}</h1>
            {profile?.aadhaar_verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/15 border border-emerald-400/30 rounded-full px-3 py-1 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
              </span>
            )}
          </div>
          <p className="text-white/50 mt-1 text-sm">
            Safe Hire ID: <span className="font-mono font-semibold text-white">{profile?.safe_hire_id || "Generating…"}</span>
          </p>
        </div>
        <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <CreditCard className="h-7 w-7 text-white/70" />
        </div>
      </div>

      {/* ── Quick links ── */}
      <div className="flex flex-wrap gap-2">
        {quickLinks.map(l => (
          <Link
            key={l.href}
            href={l.href}
            className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white border border-[#E4E4E7] text-[#18181B] px-3.5 py-2 rounded-full hover:border-[#18181B] hover:bg-[#F4F4F6] transition-all"
          >
            {l.icon}
            {l.label}
          </Link>
        ))}
      </div>

      {/* ── Feed ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="h-4 w-4 text-[#71717A]" />
          <h2 className="text-base font-bold text-[#18181B]">
            {isFallback ? "Trending" : "Your Feed"}
          </h2>
        </div>
        <FeedClient
          initialItems={initialItems}
          initialCursor={initialCursor}
          isFallback={isFallback}
        />
      </div>
    </div>
  )
}
