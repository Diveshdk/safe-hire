import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, PlusCircle, Trophy, GraduationCap, ExternalLink, Building2, ArrowRight } from "lucide-react"
import Link from "next/link"

const PASTEL_CYCLE = [
  { bg: "card-pastel-lavender", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { bg: "card-pastel-peach", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { bg: "card-pastel-sky", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
]

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

  const { data: events } = await supabase
    .from("events")
    .select("id, title, achievement, created_at")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5)

  const actions = [
    {
      icon: <PlusCircle className="h-5 w-5" />,
      title: "Create Event",
      desc: "Set up an event with dynamic custom fields for certificate generation.",
      href: "/dashboard/organisation/events",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: "Manage Events & Certificates",
      desc: "View all events and distribute certificates to SafeHire IDs.",
      href: "/dashboard/organisation/events",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "Upload University Result",
      desc: "Submit academic results auto-linked to the student's profile.",
      href: "/dashboard/organisation/university-results",
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
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
          </div>
          <p className="text-white/50 mt-2 text-sm">
            Safe Hire ID:{" "}
            <span className="font-mono font-semibold text-white">{profile?.safe_hire_id || "Generating…"}</span>
          </p>
        </div>
        <div className="shrink-0 h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center">
          <Building2 className="h-7 w-7 text-white/70" />
        </div>
      </div>

      {/* ── Action Cards ── */}
      <div>
        <h2 className="text-base font-bold text-[#18181B] mb-4">Organisation Actions</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {actions.map((a, i) => {
            const pastel = PASTEL_CYCLE[i % PASTEL_CYCLE.length]
            return (
              <Link
                key={a.title}
                href={a.href}
                className={`group ${pastel.bg} rounded-2xl p-5 card-hover flex flex-col gap-4`}
              >
                <div className={`h-11 w-11 rounded-xl ${pastel.iconBg} ${pastel.iconColor} flex items-center justify-center`}>
                  {a.icon}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm text-[#18181B] flex items-center gap-2">
                    {a.title}
                    <ExternalLink className="h-3 w-3 text-[#A1A1AA]" />
                  </div>
                  <p className="text-xs text-[#71717A] mt-1">{a.desc}</p>
                </div>
                <div className="flex items-center text-[#18181B] text-xs font-semibold gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* ── Recent Events ── */}
      {events && events.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-[#18181B] mb-4">Recent Events</h2>
          <div className="bg-white rounded-2xl border border-[#E4E4E7] divide-y divide-[#F4F4F6] overflow-hidden">
            {events.map((ev: any) => (
              <div key={ev.id} className="flex items-center justify-between px-5 py-4 hover:bg-[#F9F9FB] transition-colors">
                <div>
                  <p className="font-semibold text-sm text-[#18181B]">{ev.title}</p>
                  <p className="text-xs text-[#71717A] mt-0.5">
                    {ev.achievement} · {new Date(ev.created_at).toLocaleDateString("en-IN")}
                  </p>
                </div>
                <span className="text-xs text-emerald-700 font-semibold bg-emerald-100 px-3 py-1 rounded-full">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
