import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { ShieldCheck, PlusCircle, Trophy, GraduationCap, ExternalLink, Building2, ArrowRight, Sparkles, MessageSquare } from "lucide-react"
import Link from "next/link"
import { PostFormDialog } from "@/components/dashboard/post-form-dialog"

const PASTEL_CYCLE = [
  { bg: "card-pastel-lavender", iconBg: "bg-purple-100", iconColor: "text-purple-600" },
  { bg: "card-pastel-peach", iconBg: "bg-orange-100", iconColor: "text-orange-600" },
  { bg: "card-pastel-sky", iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  { bg: "card-pastel-pink", iconBg: "bg-pink-100", iconColor: "text-pink-600" },
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

  // Fetch recent events
  const { data: events } = await supabase
    .from("events")
    .select("id, title, achievement, created_at")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  // Fetch recent social posts
  const { data: posts } = await supabase
    .from("posts")
    .select("id, content, created_at, image_url")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(3)

  const actions = [
    {
      icon: <PlusCircle className="h-5 w-5" />,
      title: "Create Event",
      desc: "Set up events for certificate generation & achievements.",
      href: "/dashboard/organisation/events",
    },
    {
      icon: <Trophy className="h-5 w-5" />,
      title: "Manage Achievements",
      desc: "View events and distribute verified certificates.",
      href: "/dashboard/organisation/events",
    },
    {
      icon: <GraduationCap className="h-5 w-5" />,
      title: "University Results",
      desc: "Link academic results to student profiles securely.",
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

      {/* ── Social post anchor (Pinterest/LinkedIn style quick block) ── */}
      <div className="bg-white rounded-2xl border border-[#E4E4E7] p-5 flex items-center gap-4 shadow-sm hover:border-[#18181B] transition-all group">
         <div className="h-10 w-10 shrink-0 rounded-full bg-[#F4F4F6] flex items-center justify-center font-bold text-[#18181B]">
            {displayName[0]?.toUpperCase()}
         </div>
         <PostFormDialog 
          trigger={
            <button className="flex-1 text-left bg-[#F4F4F6] hover:bg-[#E4E4E7] text-[#71717A] px-5 py-2.5 rounded-full text-sm font-medium transition-colors">
              What's happening, {displayName.split(' ')[0]}? Post a social update...
            </button>
          }
         />
         <div className="hidden sm:flex items-center gap-2">
            <PostFormDialog trigger={<button className="p-2 hover:bg-[#F4F4F6] rounded-full text-purple-600 transition-colors" title="Post Image"><PlusCircle className="h-5 w-5" /></button>} />
            <PostFormDialog trigger={<button className="p-2 hover:bg-[#F4F4F6] rounded-full text-[#71717A] transition-colors" title="Social Post"><Sparkles className="h-5 w-5" /></button>} />
         </div>
      </div>

      {/* ── Action Cards ── */}
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
                <p className="text-xs text-[#71717A] mt-1 line-clamp-2">{a.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* ── Recent Social Posts ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-purple-600" /> Recent Social Posts
            </h2>
          </div>
          {posts && posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <div key={post.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 group hover:border-[#18181B] transition-all">
                  <p className="text-sm text-[#18181B] line-clamp-2 leading-relaxed">{post.content}</p>
                  {post.image_url && (
                    <div className="mt-3 rounded-xl overflow-hidden aspect-[16/9] border border-[#F4F4F6]">
                      <img src={post.image_url} alt="Post content" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="mt-3 text-[10px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
                    Posted {new Date(post.created_at).toLocaleDateString("en-IN")}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-32 rounded-2xl border border-dashed border-[#E4E4E7] flex items-center justify-center text-[#A1A1AA] text-sm">
              No social posts yet.
            </div>
          )}
        </div>

        {/* ── Recent Events ── */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[#18181B] flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-600" /> Recent Achievement Events
            </h2>
          </div>
          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((ev: any) => (
                <div key={ev.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 flex items-center justify-between group hover:border-[#18181B] transition-all">
                  <div>
                    <p className="font-semibold text-sm text-[#18181B]">{ev.title}</p>
                    <p className="text-xs text-[#71717A] mt-1">{ev.achievement}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-[#A1A1AA] group-hover:text-[#18181B] transition-all" />
                </div>
              ))}
              <Link href="/dashboard/organisation/events" className="block text-center text-xs font-bold text-[#71717A] hover:text-[#18181B] transition-colors py-2">
                View All Events
              </Link>
            </div>
          ) : (
             <div className="h-32 rounded-2xl border border-dashed border-[#E4E4E7] flex items-center justify-center text-[#A1A1AA] text-sm">
              No events created yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
