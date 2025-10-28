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
      router.replace("/")
      router.refresh()
    }
  }

  return (
    <Button variant="secondary" onClick={onSignOut} disabled={loading}>
      {loading ? "Signing out…" : "Sign Out"}
    </Button>
  )
}
