"use client"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) { setError("Please enter your email address."); return }

    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <main className="min-h-dvh bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] bg-[#18181B] flex-col justify-between p-12">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
            <span className="text-white font-bold">SH</span>
          </div>
          <span className="font-semibold text-white text-lg">Safe Hire</span>
        </Link>
        <div>
          <div className="flex items-center gap-2 text-white/50 text-sm mb-4">
            <ShieldCheck className="h-4 w-4" /> Secure account recovery
          </div>
          <h2 className="text-4xl font-bold text-white leading-tight">
            Reset your<br />
            <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
              Password
            </span>
          </h2>
          <p className="text-white/50 mt-4 text-sm leading-relaxed max-w-sm">
            Enter your registered email and we'll send you a secure link to reset your password.
          </p>
        </div>
        <p className="text-white/20 text-xs">© 2025 Safe Hire. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-xl bg-[#18181B] flex items-center justify-center">
              <span className="text-white font-bold text-sm">SH</span>
            </div>
            <span className="font-semibold text-[#18181B]">Safe Hire</span>
          </div>

          {sent ? (
            <div className="text-center space-y-4">
              <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#18181B]">Check your email</h1>
              <p className="text-[#71717A] text-sm leading-relaxed">
                We've sent a password reset link to <strong>{email}</strong>. 
                Click the link in the email to reset your password.
              </p>
              <p className="text-[#A1A1AA] text-xs">
                If you don't see it, check your spam folder.
              </p>
              <Link href="/sign-in" className="inline-block mt-4 text-sm font-semibold text-[#18181B] hover:underline">
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-[#18181B]">Forgot Password</h1>
              <p className="text-[#71717A] mt-2 text-sm">We'll email you a link to reset it.</p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="fp-email" className="text-sm font-medium text-[#18181B]">
                    Email Address
                  </Label>
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoComplete="email"
                    className="h-12 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA]"
                  />
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending…
                    </span>
                  ) : "Send Reset Link"}
                </button>

                <div className="text-center">
                  <Link href="/sign-in" className="text-sm text-[#71717A] hover:text-[#18181B] transition-colors flex items-center justify-center gap-1">
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Back to Sign In
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
