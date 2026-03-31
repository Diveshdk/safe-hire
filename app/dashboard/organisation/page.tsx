import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, PlusCircle, Trophy, GraduationCap, ExternalLink, Building2 } from "lucide-react"
import Link from "next/link"

export default async function OrganisationDashboardPage() {
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
  if (profile?.role === "employee" || profile?.role === "employer_admin") redirect("/dashboard/employee")

  const displayName = profile?.aadhaar_full_name || profile?.full_name || "Organisation"

  // Fetch recent events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, achievement, created_at")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const actions = [
    {
      icon: <PlusCircle className="h-6 w-6 text-primary" />,
      title: "Create Event",
      desc: "Set up an event with dynamic custom fields for certificate generation.",
      href: "/dashboard/organisation/events",
      active: true,
    },
    {
      icon: <Trophy className="h-6 w-6 text-amber-500" />,
      title: "Manage Events & Certificates",
      desc: "View all events and distribute certificates to SafeHire IDs.",
      href: "/dashboard/organisation/events",
      active: true,
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-blue-500" />,
      title: "Upload University Result",
      desc: "Submit academic results using SafeHire ID — auto-linked to the student's profile.",
      href: "/dashboard/organisation/university-results",
      active: true,
    },
  ]

  return (
    <div className="grid gap-8">
      {/* Welcome */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{displayName}</h1>
          {profile?.aadhaar_verified && (
            <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified
            </span>
          )}
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          Safe Hire ID: <span className="font-mono font-semibold text-primary">{profile?.safe_hire_id || "Generating…"}</span>
        </p>
      </div>

      {/* Action Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        {actions.map((a) => (
          <Link
            key={a.title}
            href={a.href}
            className={`group rounded-2xl border p-5 flex flex-col gap-3 transition-all ${
              a.active
                ? "border-border bg-card hover:border-primary/30 hover:shadow-md cursor-pointer"
                : "border-dashed border-border bg-card/50 cursor-not-allowed opacity-60"
            }`}
          >
            <div className="h-11 w-11 rounded-xl bg-secondary/70 flex items-center justify-center group-hover:scale-105 transition-transform">
              {a.icon}
            </div>
            <div>
              <div className="font-semibold flex items-center gap-2">
                {a.title}
                {a.active ? (
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                ) : (
                  <span className="text-[10px] rounded-full bg-muted px-2 py-0.5 text-muted-foreground">Coming Soon</span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Events */}
      {events && events.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Recent Events</h2>
          <div className="grid gap-3">
            {events.map((ev: any) => (
              <div key={ev.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-5 py-3.5">
                <div>
                  <p className="font-medium text-sm">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">{ev.achievement} · {new Date(ev.created_at).toLocaleDateString("en-IN")}</p>
                </div>
                <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
