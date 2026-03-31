"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export function ApplyButton({ jobId, applied }: { jobId: string; applied: boolean }) {
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(applied)
  const router = useRouter()

  async function handleApply() {
    if (done || loading) return
    setLoading(true)
    const res = await fetch("/api/jobs/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: jobId }),
    })
    setLoading(false)
    if (res.ok || res.status === 409) {
      setDone(true)
      router.refresh()
    }
  }

  return (
    <button
      type="button"
      onClick={handleApply}
      disabled={done || loading}
      className={`inline-flex h-8 items-center justify-center rounded-lg px-3 text-xs font-medium transition-colors ${
        done
          ? "bg-green-500/10 text-green-600 cursor-default"
          : loading
          ? "bg-primary/50 text-primary-foreground cursor-wait"
          : "bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
      }`}
    >
      {done ? "✓ Applied" : loading ? "Applying…" : "Apply Now"}
    </button>
  )
}
