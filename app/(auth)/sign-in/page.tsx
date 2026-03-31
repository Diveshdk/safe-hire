"use client"

import type React from "react"
import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      setError("Please enter both email and password")
      setLoading(false)
      return
    }

    const supabase = getSupabaseBrowser()
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    
    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }

    // Fetch profile and route by role
    try {
      const res = await fetch("/api/me/profile")
      const json = await res.json()
      const role: string | null = json?.profile?.role ?? null

      if (role === "employer_admin" || role === "employee") {
        router.replace("/dashboard/employee")
      } else if (role === "job_seeker") {
        router.replace("/dashboard/job-seeker")
      } else if (role === "organisation") {
        router.replace("/dashboard/organisation")
      } else {
        router.replace("/sign-up")
      }
      router.refresh()
    } catch {
      router.replace("/dashboard")
    }

    setLoading(false)
  }

  async function handleForceSignOut() {
    const supabase = getSupabaseBrowser()
    await supabase.auth.signOut()
    window.location.reload()
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full py-12">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <span className="text-primary text-xl font-semibold">SH</span>
        </div>
        <h1 className="text-3xl font-semibold text-center">Welcome Back</h1>
        <p className="text-center text-muted-foreground mt-2">Sign in to your Safe Hire account</p>

        <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="si-email">Email Address</Label>
              <Input
                id="si-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="si-password">Password</Label>
              <Input
                id="si-password"
                name="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
            </div>
            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In…" : "Sign In"}
            </Button>
          </div>
          <div className="mt-4 text-center flex flex-col gap-2">
            <Link href="#" className="text-primary text-sm hover:underline">Forgot your password?</Link>
            <button 
              type="button" 
              onClick={handleForceSignOut}
              className="text-[10px] text-muted-foreground hover:text-foreground underline mt-4"
            >
              Session issues? Clear session & reload
            </button>
          </div>
        </form>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/sign-up" className="text-primary hover:underline">Sign Up</Link>
        </p>
      </div>
    </main>
  )
}
