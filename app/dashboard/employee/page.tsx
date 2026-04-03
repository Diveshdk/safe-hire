import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Briefcase, Users, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

const PASTEL_CYCLE = [
  { bg: "card-pastel-mint", iconBg: "bg-emerald-100", iconColor: "text-emerald-600" },
  { bg: "card-pastel-sky", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { bg: "card-pastel-lavender", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
]

export default async function EmployeeDashboardPage() {
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

  if (profile?.role === "job_seeker") redirect("/dashboard/job-seeker")
  if (profile?.role === "organisation") redirect("/dashboard/organisation")

  const displayName = profile?.aadhaar_full_name || profile?.full_name || "Employee"

  const { count: jobCount } = await supabase.from("jobs").select("id", { count: "exact", head: true })
  const { count: appCount } = await supabase.from("applications").select("id", { count: "exact", head: true })

  const quickActions = [
    {
      icon: <ShieldCheck className="h-5 w-5" />,
      title: "Verify Company",
      desc: "Verify your company using CIN or PAN via Gridlines.",
      href: "/dashboard/employee/verify-company",
    },
    {
      icon: <Briefcase className="h-5 w-5" />,
      title: "Post & Manage Jobs",
      desc: `${jobCount || 0} jobs posted. Create or manage existing ones.`,
      href: "/dashboard/employee/jobs",
    },
    {
      icon: <Users className="h-5 w-5" />,
      title: "View Applicants",
      desc: `${appCount || 0} applications received. Review candidates.`,
      href: "/dashboard/employee/applicants",
    },
  ]

  return (
    <div className="grid gap-6">
      {/* ── Identity card ── */}
      <div className="bg-[#18181B] text-white rounded-2xl p-7 flex items-start justify-between gap-4">
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
            Employer Dashboard · Safe Hire ID:{" "}
            <span className="font-mono font-semibold text-white">{profile?.safe_hire_id || "Generating…"}</span>
          </p>
        </div>
        <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <Building2 className="h-7 w-7 text-white/70" />
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div>
        <h2 className="text-base font-bold text-[#18181B] mb-4">Quick Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {quickActions.map((action, i) => {
            const pastel = PASTEL_CYCLE[i % PASTEL_CYCLE.length]
            return (
              <Link
                key={action.title}
                href={action.href}
                className={`group ${pastel.bg} rounded-2xl p-6 card-hover flex flex-col gap-4`}
              >
                <div className={`h-11 w-11 rounded-xl ${pastel.iconBg} ${pastel.iconColor} flex items-center justify-center`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[#18181B]">{action.title}</p>
                  <p className="text-sm text-[#71717A] mt-1">{action.desc}</p>
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
