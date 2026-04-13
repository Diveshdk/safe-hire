"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  CalendarDays, Briefcase, ArrowRight, RefreshCw,
  TrendingUp, Sparkles, MessageSquare, ShieldCheck, MapPin, DollarSign,
  Trash2, Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FollowButton } from "@/components/dashboard/follow-button"
import { ReportButton } from "@/components/dashboard/report-button"
import { DeletePostButton } from "@/components/dashboard/delete-post-button"

type FeedItem = {
  id: string
  title?: string
  content?: string
  description?: string
  _type: "event" | "job" | "post"
  org_name: string
  image_url?: string | null
  event_type?: string | null
  event_date?: string | null
  job_type?: string | null
  location?: string | null
  salary_range?: string | null
  created_at: string
  org_user_id?: string
  company_id?: string
  author_name?: string | null
  author_position?: string | null
  auth_safe_id?: string | null
  org_safe_id?: string | null
}

const CARD_PASTELS = [
  "card-pastel-peach",
  "card-pastel-mint",
  "card-pastel-lavender",
  "card-pastel-sky",
  "card-pastel-pink",
  "card-pastel-lemon",
]

interface FeedClientProps {
  initialItems: FeedItem[]
  initialCursor: string | null
  isFallback: boolean
  currentUserId?: string
}

export function FeedClient({ initialItems, initialCursor, isFallback, currentUserId }: FeedClientProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialCursor)
  const [activeFilter, setActiveFilter] = useState<"all" | "institutes" | "committees">("all")
  const [switching, setSwitching] = useState(false)

  const fetchFeed = useCallback(async (filter: string, resetCursor?: boolean) => {
    const currentCursor = resetCursor ? "" : cursor
    const res = await fetch(`/api/feed?filter=${filter}${currentCursor ? `&cursor=${encodeURIComponent(currentCursor)}` : ""}`)
    const json = await res.json()
    return json
  }, [cursor])

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return
    setLoading(true)
    try {
      const json = await fetchFeed(activeFilter)
      if (json.ok) {
        setItems(prev => [...prev, ...json.items])
        setCursor(json.nextCursor)
        setHasMore(!!json.nextCursor)
      }
    } catch { /* noop */ }
    setLoading(false)
  }, [loading, cursor, activeFilter, fetchFeed])

  const switchFilter = async (filter: "all" | "institutes" | "committees") => {
    if (filter === activeFilter || switching) return
    setSwitching(true)
    setActiveFilter(filter)
    try {
      const json = await fetchFeed(filter, true)
      if (json.ok) {
        setItems(json.items)
        setCursor(json.nextCursor)
        setHasMore(!!json.nextCursor)
      }
    } catch { /* noop */ }
    setSwitching(false)
  }

  const handleDelete = useCallback((id: string) => {
    setItems(prev => prev.filter(item => item.id !== id))
  }, [])

  return (
    <div className="grid gap-6">
      {/* Feed Filters */}
      <div className="bg-white/80 backdrop-blur-md sticky top-0 md:top-6 z-30 rounded-2xl border border-[#E4E4E7] p-1.5 flex gap-1 shadow-sm">
        {(["all", "institutes", "committees"] as const).map((f) => (
          <button
            key={f}
            onClick={() => switchFilter(f)}
            disabled={switching}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeFilter === f
                ? "bg-[#18181B] text-white shadow-lg scale-[1.02]"
                : "text-[#71717A] hover:bg-[#F4F4F6] hover:text-[#18181B] active:scale-95"
            )}
          >
            {f === "all" ? "Discovery" : f === "institutes" ? "Institutes" : "Committees"}
          </button>
        ))}
      </div>

      <div className={cn("grid gap-4 transition-all duration-300", switching && "opacity-40 scale-[0.98] pointer-events-none")}>
        {items.length === 0 && !switching ? (
          <EmptyState
            icon={<TrendingUp className="h-8 w-8" />}
            title="Nothing to see here"
            description={
              activeFilter === "all" 
                ? "There are no public posts or events available at the moment."
                : "Follow organisations to see their specific updates in this view."
            }
            action={
              activeFilter !== "all" && (
                <button
                  onClick={() => switchFilter("all")}
                  className="inline-flex items-center gap-2 bg-[#18181B] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#27272A] transition-all"
                >
                  Return to Discovery
                </button>
              )
            }
          />
        ) : (
          <>
            {items.map((item, idx) => (
              <div
                key={`${item._type}-${item.id}`}
                style={{ animationDelay: `${Math.min(idx * 50, 300)}ms` }}
                className="animate-in fade-in slide-in-from-bottom-2 duration-300 fill-mode-both"
              >
                <FeedCard 
                  item={item} 
                  pastelidx={idx} 
                  currentUserId={currentUserId}
                  onDelete={handleDelete}
                />
              </div>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="flex items-center justify-center gap-2 w-full py-4 rounded-2xl border border-[#E4E4E7] bg-white text-sm font-bold text-[#18181B] hover:bg-[#F4F4F6] transition-all disabled:opacity-60"
              >
                {loading ? (
                  <><span className="w-4 h-4 border-2 border-[#18181B] border-t-transparent rounded-full animate-spin" /> Loading more...</>
                ) : (
                  <><RefreshCw className="h-4 w-4" /> Load more updates</>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  )
}

function FeedCard({ item, pastelidx, currentUserId, onDelete }: { item: FeedItem; pastelidx: number; currentUserId?: string; onDelete?: (id: string) => void }) {
  const isPost = item._type === "post"
  const isEvent = item._type === "event"
  const isJob = item._type === "job"

  const pastelClass = CARD_PASTELS[pastelidx % CARD_PASTELS.length]

  const avatarLetter = (item.org_name || "O")[0].toUpperCase()

  const formattedDate = new Date(item.created_at).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })

  return (
    <div className={cn(
      "rounded-2xl flex flex-col transition-all duration-200 border overflow-hidden",
      isPost
        ? "bg-white border-[#E4E4E7] shadow-sm hover:shadow-md hover:-translate-y-0.5"
        : cn("border-black/5 p-4 gap-3 card-hover", pastelClass)
    )}>

      {/* ── HEADER ── */}
      <div className={cn("flex items-start justify-between gap-3", isPost && "p-4 pb-2")}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar */}
          <div className={cn(
            "h-9 w-9 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm",
            isPost ? "bg-[#F4F4F6] text-[#18181B] border border-[#E4E4E7]" : "bg-white/70 text-[#18181B] shadow-sm"
          )}>
            {avatarLetter}
          </div>

          {/* Name + meta */}
          <div className="min-w-0 flex-1 flex flex-col">
            {/* Line 1: Author + Position + Committee */}
            <div className="flex items-center gap-1.5 flex-wrap min-w-0">
              {item.author_name ? (
                <Link 
                  href={item.auth_safe_id ? `/profile/${item.auth_safe_id}` : "#"}
                  className="text-sm font-bold text-[#18181B] truncate hover:underline underline-offset-2 transition-all"
                >
                  {item.author_name}
                </Link>
              ) : (
                <span className="text-sm font-bold text-[#18181B]">Organisation</span>
              )}
              {isPost && <ShieldCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
              
              <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-[#71717A] font-medium">
                {item.author_position && (
                  <span className="italic truncate max-w-[100px]">({item.author_position})</span>
                )}
                <span className="text-[#A1A1AA]">·</span>
                <Link
                  href={item.org_safe_id ? `/profile/${item.org_safe_id}` : "#"}
                  className="truncate max-w-[150px] font-semibold text-[#52525B] hover:text-[#18181B] hover:underline transition-all"
                >
                  {item.org_name}
                </Link>
              </div>
            </div>

            {/* Line 2: Date and Time */}
            <p className="text-[10px] text-[#A1A1AA] font-medium mt-0.5 uppercase tracking-wide">
              {formattedDate}
            </p>
          </div>
        </div>

        {/* Type badge */}
        <span className={cn(
          "shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
          isEvent ? "bg-purple-100 text-purple-700" :
          isJob   ? "bg-emerald-100 text-emerald-700" :
                    "bg-indigo-50 text-indigo-600 border border-indigo-100"
        )}>
          {item._type}
        </span>
      </div>

      {/* ── CONTENT ── */}
      <div className={cn(isPost ? "px-4 pb-4 pt-1" : "space-y-2")}>

        {/* Jobs/Events */}
        {!isPost && (
          <>
            <p className="font-bold text-[#18181B] text-sm leading-snug line-clamp-2">{item.title}</p>
            {item.description && (
              <p className="text-sm text-[#52525B] line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </>
        )}

        {/* Post content */}
        {isPost && item.content && (
          <p className="text-[#18181B] text-sm leading-relaxed whitespace-pre-wrap">{item.content}</p>
        )}

        {/* Post image */}
        {isPost && item.image_url && (
          <div className="mt-3 rounded-xl overflow-hidden border border-[#F0F0F2]">
            <img
              src={item.image_url}
              alt="Post media"
              className="w-full object-cover max-h-[1000px]"
              loading="lazy"
            />
          </div>
        )}

        {/* Meta chips */}
        {!isPost && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {isEvent && item.event_type && (
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium capitalize">
                {item.event_type}
              </span>
            )}
            {isEvent && item.event_date && (
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(item.event_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </span>
            )}
            {isJob && item.job_type && (
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium capitalize">
                {item.job_type.replace("-", " ")}
              </span>
            )}
            {isJob && item.location && (
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <MapPin className="h-3 w-3" />{item.location}
              </span>
            )}
            {isJob && item.salary_range && (
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                <DollarSign className="h-3 w-3" />{item.salary_range}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER ── */}
      <div className={cn(
        "flex items-center justify-between border-t border-black/5",
        isPost ? "p-3 bg-[#F9F9FB]/60" : "pt-2"
      )}>
        <div className="flex items-center gap-2">
          {item.org_user_id && currentUserId !== item.org_user_id && (
            <FollowButton entityId={item.org_user_id} entityType="organisation" hideIfFollowing={true} />
          )}
          {item.company_id && (
            <FollowButton entityId={item.company_id} entityType="company" hideIfFollowing={true} />
          )}
          <ReportButton entityId={item.id} entityType={item._type as any} />
          
          {isPost && currentUserId === item.org_user_id && (
            <DeletePostButton postId={item.id} onDelete={() => onDelete?.(item.id)} />
          )}
        </div>

        {!isPost && (
          <Link
            href={isEvent ? `/dashboard/job-seeker/certificates` : `/dashboard/job-seeker/jobs`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#18181B] bg-white border border-black/10 px-3.5 py-1.5 rounded-full hover:bg-white/80 transition-all shadow-sm"
          >
            {isEvent ? "View Event" : "Apply Now"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}

        {isPost && (
          <button className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#F0F0F2] text-[#A1A1AA] hover:text-[#71717A] transition-colors">
            <MessageSquare className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
