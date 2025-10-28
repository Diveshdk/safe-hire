"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignInPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    
    // Redirect to specific URL or dashboard
    if (redirectUrl) {
      router.replace(redirectUrl)
    } else {
      router.replace("/dashboard") // gate continues in middleware
    }
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <span className="text-primary text-xl font-semibold">SH</span>
        </div>
        <h1 className="text-3xl font-semibold text-center">Welcome Back</h1>
        <p className="text-center text-muted-foreground mt-2">Sign in to your Safe Hire account</p>
        
        {redirectUrl && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              💼 <strong>Sign in to apply for this job</strong>
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="mt-8 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive-foreground">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing In…" : "Sign In"}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Link href="#" className="text-primary text-sm">
              Forgot your password?
            </Link>
          </div>
        </form>

        <p className="text-center text-sm mt-6 text-muted-foreground">
          {"Don't have an account? "}
          <Link href="/sign-up" className="text-primary">
            Sign Up
          </Link>
        </p>
      </div>
    </main>
  )
}
