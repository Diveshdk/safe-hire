"use client"

import { Button } from "@/components/ui/button"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

export function SignOutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function onSignOut() {
    setLoading(true)
    try {
      const supabase = getSupabaseBrowser()
      await supabase.auth.signOut()
    } catch (e) {
      console.log("[v0] signOut error:", (e as Error).message)
    } finally {
      setLoading(false)
      window.location.href = "/" // Force a clean break and redirect
    }
  }

  return (
    <button
      onClick={onSignOut}
      disabled={loading}
      className="w-full text-sm font-medium text-[#71717A] border border-[#E4E4E7] py-2.5 rounded-full hover:bg-[#F4F4F6] hover:text-[#18181B] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
    >
      {loading ? (
        <><span className="w-3.5 h-3.5 border-2 border-[#A1A1AA] border-t-transparent rounded-full animate-spin" />Signing out…</>
      ) : "Sign Out"}
    </button>
  )
}
