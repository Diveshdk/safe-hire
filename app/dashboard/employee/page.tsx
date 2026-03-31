import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Briefcase, Users, Building2 } from "lucide-react"
import Link from "next/link"

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

  // Fetch quick stats
  const { count: jobCount } = await supabase.from("jobs").select("id", { count: "exact", head: true })
  const { count: appCount } = await supabase.from("applications").select("id", { count: "exact", head: true })

  const quickActions = [
    {
      icon: <ShieldCheck className="h-6 w-6 text-emerald-500" />,
      title: "Verify Company",
      desc: "Verify your company using CIN or PAN via Gridlines.",
      href: "/dashboard/employee/verify-company",
    },
    {
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      title: "Post & Manage Jobs",
      desc: `${jobCount || 0} jobs posted. Create new jobs or manage existing ones.`,
      href: "/dashboard/employee/jobs",
    },
    {
      icon: <Users className="h-6 w-6 text-amber-500" />,
      title: "View Applicants",
      desc: `${appCount || 0} applications received. Review and manage candidates.`,
      href: "/dashboard/employee/applicants",
    },
  ]

  return (
    <div className="grid gap-8">
      {/* Welcome */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Welcome, {displayName}</h1>
          {profile?.aadhaar_verified && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Employee Dashboard · Safe Hire ID:{" "}
          <span className="font-mono font-semibold text-primary">{profile?.safe_hire_id || "Generating…"}</span>
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.href}
            className="group rounded-2xl border border-border bg-card p-6 hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-3"
          >
            <div className="h-12 w-12 rounded-xl bg-secondary/70 flex items-center justify-center group-hover:scale-105 transition-transform">
              {action.icon}
            </div>
            <div>
              <p className="font-semibold">{action.title}</p>
              <p className="text-sm text-muted-foreground mt-1">{action.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
