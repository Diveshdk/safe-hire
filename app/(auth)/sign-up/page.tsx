"use client"

import type React from "react"

import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { useRouter, useSearchParams } from "next/navigation"

export default function SignUpPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [role, setRole] = useState<'job_seeker' | 'employer_admin' | 'institution'>('job_seeker')
  const [companyName, setCompanyName] = useState("")
  const [companyId, setCompanyId] = useState("") // CIN or PAN
  const [institutionName, setInstitutionName] = useState("")
  const [institutionType, setInstitutionType] = useState("")
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectUrl = searchParams.get('redirect')

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = getSupabaseBrowser()
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/dashboard`,
      },
    })
    
    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // Sign in immediately after successful signup
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setLoading(false)
      setError(signInError.message)
      return
    }

    // Set the selected role
    try {
      const response = await fetch('/api/profile/set-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role }),
      })

      if (!response.ok) {
        throw new Error('Failed to set role')
      }

      // If employer, attempt company verification
      if (role === 'employer_admin' && companyName && companyId) {
        try {
          const res = await fetch("/api/company/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ registrationNumber: companyId.trim(), name: companyName.trim() }),
          })
          const json = await res.json()
          if (!res.ok || !json?.ok) {
            console.log("Company verification failed:", json)
          }
        } catch (err) {
          console.log("Company verification error:", (err as Error).message)
        }
      }

      // Redirect based on role or redirect URL
      if (redirectUrl && role === 'job_seeker') {
        router.replace(redirectUrl)
      } else if (role === 'employer_admin') {
        router.replace('/recruiter/dashboard')
      } else if (role === 'institution') {
        router.replace('/institution/dashboard')
      } else {
        router.replace('/employee/dashboard')
      }
    } catch (err) {
      console.error('Error setting role:', err)
      setError('Failed to complete signup. Please try again.')
    }

    setLoading(false)
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <span className="text-primary text-xl font-semibold">SH</span>
        </div>
        <h1 className="text-3xl font-semibold text-center">Create account</h1>
        <p className="text-center text-muted-foreground mt-2">Sign up and verify with Aadhaar</p>
        
        {redirectUrl && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              💼 <strong>Sign up to apply for this job</strong> - You'll be redirected after verification
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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-3">
              <Label>Account Type</Label>
              <div className="grid gap-2">
                <div className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  role === 'job_seeker' ? 'border-primary bg-primary/5' : 'border-border'
                }`} onClick={() => setRole('job_seeker')}>
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={role === 'job_seeker'} readOnly className="text-primary" />
                    <div>
                      <p className="font-medium">Job Seeker</p>
                      <p className="text-xs text-muted-foreground">Looking for job opportunities</p>
                    </div>
                  </div>
                </div>
                <div className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  role === 'employer_admin' ? 'border-primary bg-primary/5' : 'border-border'
                }`} onClick={() => setRole('employer_admin')}>
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={role === 'employer_admin'} readOnly className="text-primary" />
                    <div>
                      <p className="font-medium">Company/Recruiter</p>
                      <p className="text-xs text-muted-foreground">Hiring and recruiting talent</p>
                    </div>
                  </div>
                </div>
                <div className={`cursor-pointer rounded-lg border p-3 transition-colors ${
                  role === 'institution' ? 'border-primary bg-primary/5' : 'border-border'
                }`} onClick={() => setRole('institution')}>
                  <div className="flex items-center gap-2">
                    <input type="radio" checked={role === 'institution'} readOnly className="text-primary" />
                    <div>
                      <p className="font-medium">Institution/Organization</p>
                      <p className="text-xs text-muted-foreground">Educational institution or certification body</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {role === 'employer_admin' && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Acme Pvt Ltd"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="company-id">CIN or PAN</Label>
                  <Input
                    id="company-id"
                    placeholder="e.g., U12345KA2020PTC012345 or AAAPA1234A"
                    value={companyId}
                    onChange={(e) => setCompanyId(e.target.value.toUpperCase())}
                    required
                  />
                </div>
              </div>
            )}

            {role === 'institution' && (
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="institution-name">Institution Name</Label>
                  <Input
                    id="institution-name"
                    placeholder="e.g., XYZ University, ABC Institute"
                    value={institutionName}
                    onChange={(e) => setInstitutionName(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="institution-type">Institution Type</Label>
                  <Input
                    id="institution-type"
                    placeholder="e.g., University, College, Certification Body"
                    value={institutionType}
                    onChange={(e) => setInstitutionType(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            {error && <p className="text-sm text-destructive-foreground">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating…" : "Sign Up"}
            </Button>
          </div>
          <div className="mt-4 text-center">
            <Link href="/sign-in" className="text-primary text-sm">
              Have an account? Sign in
            </Link>
          </div>
        </form>
      </div>
    </main>
  )
}
