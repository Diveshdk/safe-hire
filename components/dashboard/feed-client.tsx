"use client"

import { useState, useCallback } from "react"
import Link from "next/link"
import {
  CalendarDays, Briefcase, ArrowRight, RefreshCw, Users,
  TrendingUp, Sparkles, MessageSquare, ShieldCheck,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { EmptyState } from "@/components/dashboard/empty-state"
import { FollowButton } from "@/components/dashboard/follow-button"
import { ReportButton } from "@/components/dashboard/report-button"

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
}

export function FeedClient({ initialItems, initialCursor, isFallback }: FeedClientProps) {
  const [items, setItems] = useState<FeedItem[]>(initialItems)
  const [cursor, setCursor] = useState<string | null>(initialCursor)
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(!!initialCursor)

  const loadMore = useCallback(async () => {
    if (loading || !cursor) return
    setLoading(true)
    try {
      const res = await fetch(`/api/feed?cursor=${encodeURIComponent(cursor)}`)
      const json = await res.json()
      if (json.ok) {
        setItems(prev => [...prev, ...json.items])
        setCursor(json.nextCursor)
        setHasMore(!!json.nextCursor)
      }
    } catch { /* noop */ }
    setLoading(false)
  }, [loading, cursor])

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<TrendingUp className="h-8 w-8" />}
        title="Your feed is empty"
        description="Follow organisations and companies to see their latest events, social updates, and job postings here."
        action={
          <Link
            href="/dashboard/job-seeker/jobs"
            className="inline-flex items-center gap-2 bg-[#18181B] text-white text-sm font-semibold px-5 py-2.5 rounded-full hover:bg-[#27272A] transition-all"
          >
            Browse Jobs <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />
    )
  }

  return (
    <div className="grid gap-6">
      {isFallback && (
        <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-700 font-medium">
          <Sparkles className="h-3.5 w-3.5 shrink-0" />
          Showing trending posts. Follow organisations & companies to personalise your feed.
        </div>
      )}

      {items.map((item, idx) => (
        <FeedCard key={`${item._type}-${item.id}`} item={item} pastelidx={idx} />
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
    </div>
  )
}

function FeedCard({ item, pastelidx }: { item: FeedItem; pastelidx: number }) {
  const isPost = item._type === "post"
  const isEvent = item._type === "event"
  const isJob = item._type === "job"
  
  const pastelClass = CARD_PASTELS[pastelidx % CARD_PASTELS.length]

  return (
    <div className={cn(
      "rounded-2xl flex flex-col transition-all duration-300 border border-black/5 overflow-hidden",
      isPost ? "bg-white shadow-sm hover:shadow-md" : cn("p-5 gap-3 card-hover", pastelClass)
    )}>
      
      {/* ── HEADER ── */}
      <div className={cn("flex items-start justify-between gap-3", isPost && "p-5 pb-3")}>
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar with verify ring if post */}
          <div className={cn(
            "h-10 w-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-[#18181B]",
            isPost ? "bg-[#F4F4F6] border border-[#E4E4E7]" : "bg-white shadow-sm"
          )}>
            {item.org_name[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className={cn("text-xs font-bold truncate", isPost ? "text-[#18181B] text-sm" : "text-[#71717A]")}>
                {item.org_name}
              </p>
              {isPost && <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />}
            </div>
            <p className="text-[10px] text-[#A1A1AA] font-semibold uppercase tracking-wider">
              {new Date(item.created_at).toLocaleDateString("en-IN", { day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>

        {/* Type badge */}
        <span className={cn(
          "shrink-0 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full",
          isEvent ? "bg-purple-100 text-purple-700" : 
          isJob ? "bg-emerald-100 text-emerald-700" :
          "bg-indigo-50 text-indigo-600 border border-indigo-100"
        )}>
          {item._type}
        </span>
      </div>

      {/* ── CONTENT ── */}
      <div className={cn(isPost ? "px-5 pb-5 pt-1" : "space-y-3")}>
        
        {/* Title/Description for Jobs/Events */}
        {!isPost && (
          <>
            <p className="font-bold text-[#18181B] text-sm leading-tight truncate">{item.title}</p>
            {item.description && (
              <p className="text-sm text-[#52525B] line-clamp-2 leading-relaxed">{item.description}</p>
            )}
          </>
        )}

        {/* Real-time Content for Social Posts */}
        {isPost && item.content && (
          <p className="text-[#18181B] text-base leading-relaxed whitespace-pre-wrap">{item.content}</p>
        )}

        {/* Media for Social Posts (The Big Instagram Style Box) */}
        {isPost && item.image_url && (
            <div className="mt-4 rounded-2xl overflow-hidden border border-[#F4F4F6] -mx-1">
                <img 
                    src={item.image_url} 
                    alt="Post media" 
                    className="w-full object-cover max-h-[500px]" 
                />
            </div>
        )}

        {/* Meta chips for Jobs/Events */}
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
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium">
                {item.location}
              </span>
            )}
            {isJob && item.salary_range && (
              <span className="text-xs bg-white/60 border border-black/5 text-[#52525B] px-2.5 py-1 rounded-full font-medium">
                {item.salary_range}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── FOOTER (Buttons) ── */}
      <div className={cn(
        "flex items-center justify-between border-t border-black/5",
        isPost ? "p-4 bg-[#F9F9FB]/50" : "pt-2"
      )}>
        <div className="flex items-center gap-2">
          {item.org_user_id && (
            <FollowButton entityId={item.org_user_id} entityType="organisation" />
          )}
          {item.company_id && (
            <FollowButton entityId={item.company_id} entityType="company" />
          )}
          <ReportButton entityId={item.id} entityType={item._type as any} />
        </div>

        {!isPost && (
          <Link
            href={isEvent ? `/dashboard/job-seeker/certificates` : `/dashboard/job-seeker/jobs`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#18181B] bg-white border border-black/10 px-4 py-2 rounded-full hover:bg-white/80 transition-all shadow-sm"
          >
            {isEvent ? "View Event" : "Apply Now"} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
        
        {isPost && (
             <button className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-[#F4F4F6] text-[#71717A] transition-colors">
                <MessageSquare className="h-4 w-4" />
             </button>
        )}
      </div>
    </div>
  )
}
