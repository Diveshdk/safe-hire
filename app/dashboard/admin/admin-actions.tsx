"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export function AdminRequestActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  async function act(action: "approve" | "reject") {
    setLoading(action)
    try {
      const res = await fetch("/api/institute/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId, action }),
      })
      const json = await res.json()
      if (json.ok) {
        toast({ title: action === "approve" ? "Institute approved ✓" : "Request rejected" })
        router.refresh()
      } else {
        toast({ title: "Error", description: json.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    }
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => act("approve")}
        disabled={!!loading}
        className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-60"
      >
        {loading === "approve"
          ? <span className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
          : <CheckCircle2 className="h-3.5 w-3.5" />}
        Approve
      </button>
      <button
        onClick={() => act("reject")}
        disabled={!!loading}
        className="flex items-center gap-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-semibold px-4 py-2 rounded-full transition-all disabled:opacity-60"
      >
        {loading === "reject"
          ? <span className="w-3 h-3 border border-red-700 border-t-transparent rounded-full animate-spin" />
          : <XCircle className="h-3.5 w-3.5" />}
        Reject
      </button>
    </div>
  )
}
