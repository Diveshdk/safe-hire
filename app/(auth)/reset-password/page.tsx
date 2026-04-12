"use client"

import { useState, useEffect } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ShieldCheck, Eye, EyeOff, CheckCircle2 } from "lucide-react"

import { AuthChangeEvent, Session } from "@supabase/supabase-js"

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)

  // Supabase sends the recovery token via URL fragment; we need to let the 
  // client SDK pick it up and exchange it for a session.
  useEffect(() => {
    const supabase = getSupabaseBrowser()
    
    // Check for an existing session immediately (needed if redirected from server)
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      if (session) {
        setSessionReady(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
      // "PASSWORD_RECOVERY" is the specific event for reset links, 
      // but we also accept "SIGNED_IN" if the session was established in a previous step.
      if (event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && session)) {
        setSessionReady(true)
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError("Password must be at least 6 characters."); return }
    if (password !== confirm) { setError("Passwords do not match."); return }

    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.updateUser({ password })

    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      setDone(true)
      setTimeout(() => router.replace("/sign-in"), 2500)
    }
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <div className="h-9 w-9 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="SafeHire" className="h-full w-full object-cover" />
          </div>
          <span className="font-semibold text-[#18181B]">Safe Hire</span>
        </div>

        {done ? (
          <div className="text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold text-[#18181B]">Password Updated!</h1>
            <p className="text-[#71717A] text-sm">Redirecting you to sign in…</p>
          </div>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-[#18181B]">Set New Password</h1>
            <p className="text-[#71717A] mt-2 text-sm">Choose a strong password for your account.</p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="rp-password" className="text-sm font-medium text-[#18181B]">New Password</Label>
                <div className="relative">
                  <Input
                    id="rp-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="h-12 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA] pr-12"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#18181B]">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="rp-confirm" className="text-sm font-medium text-[#18181B]">Confirm Password</Label>
                <Input
                  id="rp-confirm"
                  type="password"
                  placeholder="Enter password again"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
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
                disabled={loading || !sessionReady}
                className="w-full bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Updating…
                  </span>
                ) : !sessionReady ? "Validating link…" : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  )
}
