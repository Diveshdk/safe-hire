"use client"

import { useState } from "react"
import { Flag } from "lucide-react"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

const REASONS = [
  "Spam or misleading",
  "Inappropriate content",
  "Fraudulent listing",
  "Duplicate post",
  "Other",
]

interface ReportButtonProps {
  entityId: string
  entityType: "event" | "job" | "certificate"
  className?: string
}

export function ReportButton({ entityId, entityType, className }: ReportButtonProps) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState(REASONS[0])
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity_id: entityId, entity_type: entityType, reason, description }),
      })
      const json = await res.json()
      if (json.ok) {
        toast({ title: "Report submitted", description: json.message })
        setOpen(false)
        setDescription("")
        setReason(REASONS[0])
      } else {
        toast({ title: "Could not submit report", description: json.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Network error", variant: "destructive" })
    }
    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium text-[#A1A1AA] hover:text-red-500 transition-colors",
            className
          )}
          title="Report this content"
        >
          <Flag className="h-3 w-3" />
          Report
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-md rounded-2xl border-[#E4E4E7]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#18181B]">
            <Flag className="h-4 w-4 text-red-500" />
            Report {entityType.charAt(0).toUpperCase() + entityType.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4 mt-1">
          <div className="grid gap-1.5">
            <Label className="text-sm font-medium text-[#18181B]">Reason</Label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="h-11 rounded-xl border border-[#E4E4E7] bg-white px-3 text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] w-full"
            >
              {REASONS.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="grid gap-1.5">
            <Label className="text-sm font-medium text-[#18181B]">Additional details <span className="text-[#A1A1AA] font-normal">(optional)</span></Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Tell us more about the issue..."
              rows={3}
              className="rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 resize-none text-[#18181B] placeholder:text-[#A1A1AA]"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
            Reports are anonymous. False reports may result in account restrictions. Limit: 3 per day.
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-full transition-all disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Report"
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
