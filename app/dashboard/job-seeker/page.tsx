import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, Briefcase, FileText, Award, GraduationCap, Bot, CreditCard } from "lucide-react"
import Link from "next/link"

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

  // Fetch quick stats
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
      icon: <Briefcase className="h-6 w-6 text-primary" />,
      title: "Find Jobs",
      desc: `Browse open positions. ${appCount || 0} application(s) submitted.`,
      href: "/dashboard/job-seeker/jobs",
    },
    {
      icon: <FileText className="h-6 w-6 text-emerald-500" />,
      title: "Documents",
      desc: `${docCount || 0} document(s) uploaded. Upload and verify your documents.`,
      href: "/dashboard/job-seeker/documents",
    },
    {
      icon: <Award className="h-6 w-6 text-amber-500" />,
      title: "Certificates",
      desc: "View certificates earned from events and competitions.",
      href: "/dashboard/job-seeker/certificates",
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-blue-500" />,
      title: "University Results",
      desc: "View your verified academic records.",
      href: "/dashboard/job-seeker/university",
    },
    {
      icon: <Bot className="h-6 w-6 text-purple-500" />,
      title: "AI Resume Review",
      desc: "Get AI-powered feedback on your resume.",
      href: "/dashboard/job-seeker/ai-resume",
    },
  ]

  return (
    <div className="grid gap-8">
      {/* Identity Card */}
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold">{displayName}</h1>
              {profile?.aadhaar_verified && (
                <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                  <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
                </span>
              )}
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Safe Hire ID:{" "}
              <span className="font-mono font-semibold text-primary">{profile?.safe_hire_id || "Generating…"}</span>
            </p>
            <p className="text-xs text-muted-foreground mt-2 max-w-md">
              Your verified digital identity. Share your Safe Hire ID with employers to prove you&apos;re a real, verified professional.
            </p>
          </div>
          <div className="shrink-0 h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CreditCard className="h-7 w-7 text-primary" />
          </div>
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all flex flex-col gap-3"
            >
              <div className="h-11 w-11 rounded-xl bg-secondary/70 flex items-center justify-center group-hover:scale-105 transition-transform">
                {action.icon}
              </div>
              <div>
                <p className="font-semibold text-sm">{action.title}</p>
                <p className="text-xs text-muted-foreground mt-1">{action.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
