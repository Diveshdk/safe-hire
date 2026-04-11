"use client"

import { useState, useCallback } from "react"
import { Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import useSWR from "swr"

const fetcher = (url: string) => fetch(url).then(r => r.json())

interface FollowButtonProps {
  entityId: string
  entityType: "organisation" | "company"
  className?: string
}

export function FollowButton({ entityId, entityType, className }: FollowButtonProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const { data, mutate } = useSWR(
    `/api/follows?entity_id=${entityId}&entity_type=${entityType}`,
    fetcher,
    { revalidateOnFocus: false }
  )

  const following = data?.following ?? false
  const count = data?.count ?? 0

  const toggle = useCallback(async () => {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch("/api/follows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_id: entityId, entity_type: entityType }),
      })
      const json = await res.json()
      if (json.ok) {
        mutate({ following: json.following, count: json.following ? count + 1 : Math.max(0, count - 1) }, false)
        toast({ title: json.following ? "Following!" : "Unfollowed" })
      } else if (res.status === 401) {
        toast({ title: "Sign in to follow", variant: "destructive" })
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" })
    }
    setLoading(false)
  }, [loading, entityId, entityType, count, mutate, toast])

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-all duration-200 disabled:opacity-60",
        following
          ? "bg-[#18181B] text-white border-[#18181B] hover:bg-red-600 hover:border-red-600"
          : "bg-white text-[#18181B] border-[#E4E4E7] hover:border-[#18181B] hover:bg-[#F4F4F6]",
        className
      )}
    >
      <Users className="h-3 w-3" />
      {loading ? (
        <span className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <span>{following ? "Following" : "Follow"}</span>
      )}
      {count > 0 && (
        <span className={cn(
          "ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
          following ? "bg-white/20" : "bg-[#F4F4F6]"
        )}>
          {count}
        </span>
      )}
    </button>
  )
}
