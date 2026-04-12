"use client"

import { useState } from "react"
import { Trash2, Loader2, CheckCircle2, ShieldAlert } from "lucide-react"
import { useRouter } from "next/navigation"

export function SettingsClient() {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [isDone, setIsDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDeleteIdentity() {
    setIsDeleting(true)
    setError(null)
    
    try {
      const res = await fetch("/api/profile/delete-identity", { method: "POST" })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.message || "Failed to erase identity data")
      }

      setIsDone(true)
      setTimeout(() => {
        router.refresh()
      }, 2000)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setIsDeleting(false)
    }
  }

  if (isDone) {
    return (
      <div className="flex items-center gap-2 text-emerald-700 bg-emerald-100/50 p-3 rounded-xl border border-emerald-200">
        <CheckCircle2 className="h-4 w-4" />
        <span className="text-xs font-bold">Identity records erased successfully.</span>
      </div>
    )
  }

  return (
    <div className="pt-2">
      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="flex items-center gap-2 bg-white border border-amber-300 text-amber-700 px-4 py-2 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors shadow-sm"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete My Verified Identity
        </button>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-700 leading-relaxed font-medium">
            🚩 <strong>CONFIRM ERASURE:</strong> This will permanently remove your name and verified status from SafeHire. 
            You will lose your "Authenticated" badge immediately. This action is irreversible.
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteIdentity}
              disabled={isDeleting}
              className="flex-1 flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Erasing…
                </>
              ) : (
                "Yes, Erase My Identity"
              )}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="flex-1 bg-white border border-[#E4E4E7] text-[#18181B] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#F4F4F6] transition-colors"
            >
              Cancel
            </button>
          </div>
          {error && <p className="text-[10px] text-red-600 font-bold ml-1">Error: {error}</p>}
        </div>
      )}
    </div>
  )
}
