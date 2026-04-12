"use client"

import { useState } from "react"
import { ShieldCheck, User, Briefcase, Building2, FileText, Award, GraduationCap, Activity, CheckCircle2, Users, Calendar, MessageSquare, Trash2, Loader2, ArrowRight } from "lucide-react"
import { AchievementsCertificates } from "@/components/dashboard/achievements-certificates"
import { UniversityResultsSection } from "@/components/dashboard/university-results-section"
import { FollowButton } from "@/components/dashboard/follow-button"
import Link from "next/link"
import { cn } from "@/lib/utils"
import useSWR from "swr"

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
    committee_name?: string | null
    committee_position?: string | null
  }
  documents: any[]
  stats: {
    followers: number
    events: number
  }
  isOwner: boolean
  currentUserId?: string
}

export function ProfileClient({ profile, documents, stats, isOwner, currentUserId }: ProfileClientProps) {
  const isOrg = profile.role === "organisation"
  
  // Define tabs based on role and ownership
  const tabs = [
    { key: "posts", label: "Posts", icon: <MessageSquare className="h-4 w-4" />, show: isOrg },
    { key: "events", label: "Events", icon: <Calendar className="h-4 w-4" />, show: isOrg },
    { key: "documents", label: "Documents", icon: <FileText className="h-4 w-4" />, show: !isOrg },
    { key: "certificates", label: "Certificates", icon: <Award className="h-4 w-4" />, show: !isOrg },
    { key: "university", label: "Education", icon: <GraduationCap className="h-4 w-4" />, show: !isOrg },
    { key: "following", label: "Following", icon: <Users className="h-4 w-4" />, show: isOwner },
  ].filter(t => t.show)

  const [activeTab, setActiveTab] = useState<string>(tabs[0]?.key || "documents")

  const displayName = profile.committee_name || profile.aadhaar_full_name || profile.full_name || "User"
  const roleMeta = ROLE_META[profile.role] || ROLE_META.job_seeker

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <main className="min-h-dvh bg-[#F4F4F6]">
      {/* ── Top Nav ── */}
      <header className="bg-white border-b border-[#E4E4E7] px-6 h-14 flex items-center sticky top-0 z-50">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2.5 hover:opacity-80 transition-all">
            <div className="h-8 w-8 rounded-lg bg-[#18181B] flex items-center justify-center">
              <span className="text-white text-xs font-bold">SH</span>
            </div>
            <span className="font-bold text-[#18181B]">Safe Hire</span>
          </Link>
          <div className="flex items-center gap-3">
            {isOwner && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-orange-100 text-orange-700 px-2 py-0.5 rounded-md">My Profile</span>
            )}
            <span className="text-xs text-[#A1A1AA]">{isOwner ? "Personal Settings" : "Public Profile"}</span>
          </div>
        </div>
      </header>

      {/* ── Hero Banner ── */}
      <div className="bg-gradient-to-r from-[#18181B] via-[#27272A] to-[#3F3F46] h-32 sm:h-44" />

      {/* ── Content ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="flex flex-col lg:flex-row gap-6 -mt-12 lg:-mt-20 items-start">

          {/* ─── Left Panel: Profile Card ─────────────────────────────── */}
          <div className="w-full lg:w-80 shrink-0 lg:sticky lg:top-20">
            <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-sm">
              <div className="px-6 pb-6 pt-4">
                <div className="h-24 w-24 rounded-3xl bg-gradient-to-br from-blue-50 to-blue-100 border-4 border-white shadow-lg flex items-center justify-center mb-5 overflow-hidden">
                  <span className="text-blue-700 text-3xl font-extrabold">{initials}</span>
                </div>

                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-black text-[#18181B] tracking-tight">{displayName}</h1>
                  {profile.aadhaar_verified && <ShieldCheck className="h-5 w-5 text-blue-500 shrink-0" />}
                </div>
                
                {profile.committee_position && (
                  <p className="text-sm font-medium text-[#71717A] mb-3">{profile.committee_position}</p>
                )}

                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={cn("inline-flex items-center gap-1.2 text-[11px] font-bold rounded-full px-3 py-1", roleMeta.bg, roleMeta.text)}>
                    {roleMeta.icon} {roleMeta.label}
                  </span>
                </div>

                {profile.safe_hire_id && (
                  <div className="mt-5 bg-[#F4F4F6] rounded-2xl px-4 py-3 border border-[#E4E4E7]/50 group transition-all hover:border-[#18181B]/20">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#A1A1AA] mb-1 opacity-70">Safe Hire ID</p>
                    <p className="font-mono text-sm font-bold text-[#18181B] break-all">{profile.safe_hire_id}</p>
                  </div>
                )}

                {/* Social Stats for Organisations */}
                {isOrg && (
                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#FAFAFB] border border-[#E4E4E7] p-3 text-center transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-xl font-black text-[#18181B]">{stats.followers}</p>
                      <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wide mt-0.5 group-hover:text-[#18181B]">Followers</p>
                    </div>
                    <div className="rounded-2xl bg-[#FAFAFB] border border-[#E4E4E7] p-3 text-center transition-all hover:bg-white hover:shadow-md group">
                      <p className="text-xl font-black text-[#18181B]">{stats.events}</p>
                      <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wide mt-0.5 group-hover:text-[#18181B]">Events</p>
                    </div>
                  </div>
                )}

                {/* Follow Button for Visitors */}
                {!isOwner && currentUserId && (
                  <div className="mt-6">
                    <FollowButton 
                      entityId={profile.user_id} 
                      entityType="organisation" 
                      className="w-full justify-center h-11 text-sm shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Right Panel: Tabbed Content ─────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Tab Bar */}
            <div className="bg-white/80 backdrop-blur-md sticky top-14 z-40 rounded-2xl border border-[#E4E4E7] shadow-sm mb-6 p-1.5 flex gap-1">
              {tabs.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 text-sm font-bold py-3 rounded-xl transition-all",
                    activeTab === tab.key
                      ? "bg-[#18181B] text-white shadow-lg scale-[1.02]"
                      : "text-[#71717A] hover:bg-[#F4F4F6] hover:text-[#18181B]"
                  )}
                >
                  {tab.icon}
                  <span className="hidden md:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {activeTab === "documents" && <DocumentsTab documents={documents} />}
              {activeTab === "certificates" && <AchievementsCertificates userId={profile.user_id} />}
              {activeTab === "university" && <UniversityResultsSection userId={profile.user_id} />}
              {activeTab === "following" && <FollowingTab userId={profile.user_id} />}
              {activeTab === "posts" && <PostsTab userId={profile.user_id} />}
              {activeTab === "events" && <EventsTab userId={profile.user_id} />}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

/* ─── Following Tab ─────────────────────────────────────────────────────── */
function FollowingTab({ userId }: { userId: string }) {
  const { data, mutate, isValidating } = useSWR("/api/follows/list", url => fetch(url).then(r => r.json()))
  
  const handleUnfollowSuccess = () => mutate()

  if (!data && isValidating) return <LoadingSpinner />
  
  const list = data?.following ?? []

  if (list.length === 0) {
    return (
      <EmptyTabState 
        icon={<Users className="h-8 w-8 text-[#A1A1AA]" />}
        title="Not following anyone yet"
        description="Follow committees and institutes to stay updated with their events and posts."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((item: any) => (
        <div key={item.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-4 flex items-center justify-between group hover:border-[#18181B] transition-all hover:shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center shrink-0 font-bold text-[#18181B]">
              {item.name[0].toUpperCase()}
            </div>
            <div className="min-w-0">
              <Link href={item.safe_hire_id ? `/profile/${item.safe_hire_id}` : "#"} className="font-bold text-sm text-[#18181B] truncate block hover:underline">
                {item.name}
              </Link>
              <p className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-wider">{item.role}</p>
            </div>
          </div>
          <FollowButton 
            entityId={item.id} 
            entityType="organisation" 
            className="h-8 text-[10px] px-3 font-black"
          />
        </div>
      ))}
    </div>
  )
}

/* ─── Posts Tab ─────────────────────────────────────────────────────────── */
function PostsTab({ userId }: { userId: string }) {
  const { data, isValidating } = useSWR(`/api/feed?org_user_id=${userId}`, url => fetch(url).then(r => r.json()))

  if (!data && isValidating) return <LoadingSpinner />
  const posts = data?.items?.filter((i: any) => i._type === "post") || []

  if (posts.length === 0) {
    return (
      <EmptyTabState 
        icon={<MessageSquare className="h-8 w-8 text-[#A1A1AA]" />}
        title="No posts yet"
        description="This organisation hasn't shared any updates yet."
      />
    )
  }

  return (
    <div className="space-y-4">
      {posts.map((post: any) => (
        <div key={post.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-5 hover:border-[#18181B] transition-all">
          <p className="text-sm text-[#18181B] leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
          {post.image_url && (
            <div className="rounded-xl overflow-hidden mb-4 border border-[#F4F4F6]">
              <img src={post.image_url} alt="Post" className="w-full h-auto object-cover max-h-96" />
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest">
              {new Date(post.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Events Tab ────────────────────────────────────────────────────────── */
function EventsTab({ userId }: { userId: string }) {
  const { data, isValidating } = useSWR(`/api/feed?org_user_id=${userId}`, url => fetch(url).then(r => r.json()))

  if (!data && isValidating) return <LoadingSpinner />
  const events = data?.items?.filter((i: any) => i._type === "event") || []

  if (events.length === 0) {
    return (
      <EmptyTabState 
        icon={<Calendar className="h-8 w-8 text-[#A1A1AA]" />}
        title="No events organised"
        description="Upcoming events will appear here once they are scheduled."
      />
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {events.map((event: any) => (
        <div key={event.id} className="bg-white rounded-2xl border border-[#E4E4E7] p-5 hover:border-[#18181B] transition-all group">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-purple-600 uppercase tracking-widest">{event.event_type || "Event"}</p>
              <h3 className="font-bold text-[#18181B] line-clamp-1">{event.title}</h3>
            </div>
          </div>
          <p className="text-xs text-[#71717A] line-clamp-2 mb-4 leading-relaxed">{event.description}</p>
          <div className="flex items-center justify-between pt-4 border-t border-[#F4F4F6]">
             <span className="text-[10px] text-[#A1A1AA] font-bold uppercase tracking-widest">
                {new Date(event.event_date || event.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
             </span>
             <Link href={event.safe_hire_id ? `/profile/${event.safe_hire_id}` : "#"} className="text-[10px] font-black uppercase text-[#18181B] hover:underline flex items-center gap-1">
                View Details <ArrowRight className="h-3 w-3" />
             </Link>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ─── Helpers ───────────────────────────────────────────────────────────── */
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-20">
      <div className="h-8 w-8 border-4 border-[#18181B] border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

function EmptyTabState({ icon, title, description }: { icon: any, title: string, description: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#E4E4E7] bg-white flex flex-col items-center justify-center py-20 text-center px-6">
      <div className="h-16 w-16 rounded-3xl bg-[#F4F4F6] flex items-center justify-center mb-5 animate-pulse">
        {icon}
      </div>
      <p className="text-lg font-black text-[#18181B] tracking-tight">{title}</p>
      <p className="text-sm text-[#71717A] mt-2 max-w-xs mx-auto leading-relaxed">{description}</p>
    </div>
  )
}

function DocumentsTab({ documents }: { documents: any[] }) {
  if (documents.length === 0) {
    return (
      <EmptyTabState 
        icon={<FileText className="h-8 w-8 text-[#A1A1AA]" />}
        title="No documents yet"
        description="Documents will appear here once uploaded and verified by our system."
      />
    )
  }

  const verified = documents.filter(d => d.verification_status === "verified")
  const others   = documents.filter(d => d.verification_status !== "verified")

  return (
    <div className="space-y-5">
      <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm px-6 py-5 flex items-center justify-between group hover:border-[#18181B] transition-all">
        <div>
          <p className="text-lg font-black text-[#18181B] tracking-tight">{documents.length} Document{documents.length !== 1 ? "s" : ""}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">{verified.length} Verified</span>
            <span className="text-xs text-[#A1A1AA] font-bold">·</span>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md">{others.length} Pending</span>
          </div>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center group-hover:bg-emerald-100 transition-all">
          <CheckCircle2 className="h-6 w-6 text-emerald-600" />
        </div>
      </div>

      <div className="grid gap-3">
        {documents.map(doc => (
          <div key={doc.id} className="bg-white rounded-2xl border border-[#E4E4E7] px-6 py-5 flex items-center justify-between group hover:border-[#18181B] transition-all hover:shadow-lg hover:-translate-y-0.5">
            <div className="flex items-center gap-5 min-w-0">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110",
                doc.verification_status === "verified" ? "bg-emerald-50" : "bg-amber-50"
              )}>
                <FileText className={cn(
                  "h-6 w-6",
                  doc.verification_status === "verified" ? "text-emerald-600" : "text-amber-600"
                )} />
              </div>
              <div className="min-w-0">
                <p className="font-black text-base text-[#18181B] truncate tracking-tight">{doc.title || doc.doc_type}</p>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] text-[#A1A1AA] font-black uppercase tracking-widest">
                    {doc.doc_type.replace(/_/g, " ")}
                  </p>
                  <span className="text-[10px] text-[#E4E4E7]">|</span>
                  <p className="text-[10px] text-[#A1A1AA] font-black uppercase tracking-widest">
                    {new Date(doc.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
            </div>
            <span className={cn(
              "shrink-0 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm",
              doc.verification_status === "verified" ? "bg-emerald-500 text-white" : "bg-amber-500 text-white"
            )}>
              {doc.verification_status === "verified" ? "Verified" : "Pending"}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
