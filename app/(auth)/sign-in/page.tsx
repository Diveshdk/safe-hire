"use client"

import type React from "react"
import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, EyeOff } from "lucide-react"

export default function SignInPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
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
    <main className="min-h-dvh bg-background flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#18181B] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold">SH</span>
          </div>
          <span className="font-semibold text-white text-lg">Safe Hire</span>
        </Link>

        <div>
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <ShieldCheck className="h-4 w-4" /> Trusted by verified professionals
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Welcome back to<br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Safe Hire
            </span>
          </h2>
          <p className="text-white/50 mt-4 text-sm leading-relaxed max-w-sm">
            Sign in to access your verified profile, job listings, and credentials.
          </p>

          {/* Mini identity card */}
          <div className="mt-10 bg-white/5 border border-white/10 rounded-2xl p-5">
            <p className="text-white/40 text-xs mb-3">Safe Hire ID Preview</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-xs">Verified</p>
                <p className="text-white text-sm font-medium mt-1">✓ Aadhaar</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3">
                <p className="text-white/40 text-xs">Profile</p>
                <p className="text-white text-sm font-medium mt-1">SH-*****</p>
              </div>
            </div>
          </div>
        </div>

        <p className="text-white/20 text-xs">© 2025 Safe Hire. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-[#18181B] flex items-center justify-center">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
            <span className="font-semibold text-[#18181B]">Safe Hire</span>
          </div>

          <h1 className="text-3xl font-bold text-[#18181B]">Sign In</h1>
          <p className="text-[#71717A] mt-2 text-sm">Enter your credentials to continue</p>

          <form onSubmit={onSubmit} className="mt-8 space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="si-email" className="text-sm font-medium text-[#18181B]">
                Email Address
              </Label>
              <Input
                id="si-email"
                name="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="h-12 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="si-password" className="text-sm font-medium text-[#18181B]">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="si-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  className="h-12 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA] pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in…
                </span>
              ) : "Sign In"}
            </button>

            <div className="text-right">
              <Link href="/forgot-password" className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors">
                Forgot your password?
              </Link>
            </div>
          </form>

          <p className="text-center text-sm mt-8 text-[#71717A]">
            {"Don't have an account? "}
            <Link href="/sign-up" className="font-semibold text-[#18181B] hover:underline">
              Sign Up
            </Link>
          </p>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={handleForceSignOut}
              className="text-[10px] text-[#A1A1AA] hover:text-[#71717A] underline"
            >
              Session issues? Clear session &amp; reload
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
