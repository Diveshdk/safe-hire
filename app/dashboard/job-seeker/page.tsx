import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Briefcase, FileText, Award, GraduationCap, Bot, CreditCard, ArrowRight } from "lucide-react"
import Link from "next/link"

const PASTEL_CYCLE = [
  { bg: "card-pastel-peach", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { bg: "card-pastel-mint", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { bg: "card-pastel-lavender", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { bg: "card-pastel-sky", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { bg: "card-pastel-pink", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
]

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

  const { count: appCount } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("seeker_user_id", user.id)

  const { count: docCount } = await supabase
    .from("documents")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)

  const quickActions = [
    {
      icon: <Briefcase className="h-5 w-5" />,
      title: "Find Jobs",
      desc: `${appCount || 0} application(s) submitted`,
      href: "/dashboard/job-seeker/jobs",
    },
    {
      icon: <FileText className="h-5 w-5" />,
      title: "Documents",
      desc: `${docCount || 0} document(s) uploaded`,
      href: "/dashboard/job-seeker/documents",
    },
    {
      icon: <Award className="h-5 w-5" />,
      title: "Certificates",
      desc: "View your earned certificates",
      href: "/dashboard/job-seeker/certificates",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "University Results",
      desc: "Your verified academic records",
      href: "/dashboard/job-seeker/university",
    },
    {
      icon: <Bot className="h-5 w-5" />,
      title: "AI Resume Review",
      desc: "Get AI-powered resume feedback",
      href: "/dashboard/job-seeker/ai-resume",
    },
  ]

  return (
    <div className="grid gap-6">
      {/* ── Identity Card ── */}
      <div className="bg-[#18181B] text-white rounded-2xl p-7 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold">{displayName}</h1>
            {profile?.aadhaar_verified && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-400/15 border border-emerald-400/30 rounded-full px-3 py-1 font-semibold">
                <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
              </span>
            )}
          </div>
          <p className="text-white/50 mt-2 text-sm">
            Safe Hire ID:{" "}
            <span className="font-mono font-semibold text-white">{profile?.safe_hire_id || "Generating…"}</span>
          </p>
          <p className="text-white/40 text-xs mt-1.5 max-w-md">
            Share your Safe Hire ID with employers to prove you're a real, verified professional.
          </p>
        </div>
        <div className="shrink-0 h-16 w-16 rounded-2xl bg-white/10 flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-white/70" />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-base font-bold text-[#18181B] mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action, i) => {
            const pastel = PASTEL_CYCLE[i % PASTEL_CYCLE.length]
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`group ${pastel.bg} rounded-2xl p-5 card-hover flex flex-col gap-4`}
              >
                <div className={`h-11 w-11 rounded-xl ${pastel.iconBg} ${pastel.iconColor} flex items-center justify-center`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#18181B] text-sm">{action.title}</p>
                  <p className="text-xs text-[#71717A] mt-1">{action.desc}</p>
                </div>
                <div className="flex items-center text-[#18181B] text-xs font-semibold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
