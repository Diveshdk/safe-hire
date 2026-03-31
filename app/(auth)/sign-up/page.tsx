"use client"

import type React from "react"
import { useState } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Briefcase, User, Building2, ChevronRight, ChevronLeft, CheckCircle2, Upload, FlaskConical } from "lucide-react"
import { cn } from "@/lib/utils"

type Role = "job_seeker" | "employee" | "organisation"
type AadhaarMode = "xml" | "demo" | "ocr"

const ROLE_CONFIG = [
  {
    value: "job_seeker" as const,
    icon: <User className="h-7 w-7" />,
    label: "Job Seeker",
    desc: "Find verified jobs & build your profile",
  },
  {
    value: "employee" as const,
    icon: <Briefcase className="h-7 w-7" />,
    label: "Employee",
    desc: "Post jobs & manage hiring",
  },
  {
    value: "organisation" as const,
    icon: <Building2 className="h-7 w-7" />,
    label: "Organisation / Institution",
    desc: "Issue certificates & verify achievements",
  },
]

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 0 – role
  const [role, setRole] = useState<Role>("job_seeker")
  // Step 1 – account
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  // Step 2 – aadhaar (job_seeker / employee only)
  const [aadhaarMode, setAadhaarMode] = useState<AadhaarMode>("ocr")
  const [xmlFile, setXmlFile] = useState<File | null>(null)
  const [demoName, setDemoName] = useState("")
  // Step 3 (employee) / Step 2 (organisation) – org details
  const [orgName, setOrgName] = useState("")
  const [orgId, setOrgId] = useState("")  // CIN/PAN/Reg number
  const [companyDemo, setCompanyDemo] = useState(false)

  const isEmployee = role === "employee"
  const isOrg = role === "organisation"
  const isJobSeeker = role === "job_seeker"

  // Steps: job_seeker and employee get aadhaar step; org goes straight to org details
  // job_seeker:  0-Role → 1-Account → 2-Aadhaar
  // employee:    0-Role → 1-Account → 2-Aadhaar → 3-Company
  // organisation:0-Role → 1-Account → 2-Org Details
  const stepLabels = isEmployee
    ? ["Role", "Account", "Aadhaar", "Company"]
    : isOrg
    ? ["Role", "Account", "Organisation"]
    : ["Role", "Account", "Aadhaar"]

  function clearError() { setError(null) }

  function goNext() { clearError(); setStep((s) => s + 1) }
  function goBack() { clearError(); setStep((s) => s - 1) }

  function validateStep1() {
    if (!email.trim()) return "Please enter your email."
    if (password.length < 6) return "Password must be at least 6 characters."
    return null
  }

  function validateAadhaar() {
    if (aadhaarMode === "xml" && !xmlFile) return "Please select your Aadhaar XML file."
    if (aadhaarMode === "demo" && demoName.trim().length < 3) return "Enter your full name for demo verification."
    if (aadhaarMode === "ocr" && !xmlFile) return "Please upload your Aadhaar card image."
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = getSupabaseBrowser()

    // 1. Sign up — if email confirmation is disabled, data.session is returned immediately
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo:
          process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
      },
    })
    if (signUpErr) { setError(signUpErr.message); setLoading(false); return }

    // 2. If no session returned → email confirmation is required. Show friendly message.
    if (!signUpData?.session) {
      // Try signInWithPassword anyway (works if email confirmation is off in Supabase settings)
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        setLoading(false)
        setError(
          "Account created! Please check your email to confirm your account, then sign in. " +
          "(Tip: disable 'Email confirmations' in Supabase Auth settings for instant access during development.)"
        )
        return
      }
    }

    // 3. Save name + role
    const roleToSave = role === "employee" ? "employee" : role === "organisation" ? "organisation" : "job_seeker"
    const setupRes = await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ full_name: "", role: roleToSave }),
    })
    if (!setupRes.ok) {
      const j = await setupRes.json().catch(() => ({}))
      setError(j?.message || "Failed to save profile")
      setLoading(false)
      return
    }

    // 4. Aadhaar (job seeker + employee)
    if (!isOrg) {
      if (aadhaarMode === "xml" && xmlFile) {
        const form = new FormData()
        form.append("file", xmlFile)
        const res = await fetch("/api/verify/aadhaar?mode=offline-xml", { method: "POST", body: form })
        const data = await res.json()
        if (!data.success) { setError(data.message || "Aadhaar verification failed"); setLoading(false); return }
      } else if (aadhaarMode === "demo" && demoName.trim()) {
        const res = await fetch("/api/verify/aadhaar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode: "demo", fullName: demoName.trim() }),
        })
        const data = await res.json()
        if (!data.success) { setError(data.message || "Demo verification failed"); setLoading(false); return }
      } else if (aadhaarMode === "ocr" && xmlFile) {
        const form = new FormData()
        form.append("file", xmlFile)
        const res = await fetch("/api/verify/aadhaar?mode=ocr", { method: "POST", body: form })
        const data = await res.json()
        if (!data.success) { setError(data.message || "OCR verification failed"); setLoading(false); return }
      }
    } else {
      // 4b. Organisation: mark aadhaar verified with org name (bypass individual Aadhaar)
      await fetch("/api/verify/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo", fullName: orgName.trim() }),
      }).catch(() => {})
    }

    // 5. & 6. Company/Organisation Verification
    if ((isEmployee || isOrg) && orgName) {
      const vRes = await fetch("/api/company/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationNumber: orgId.trim() || undefined,
          name: orgName.trim(),
          demo: companyDemo || (!orgId.trim() && isEmployee) || (isOrg && !orgId.trim()),
        }),
      })
      const vData = await vRes.json()
      if (!vRes.ok) {
        setError(vData.message || "Company verification failed")
        setLoading(false)
        return
      }
    }

    setLoading(false)
    if (isEmployee) router.replace("/dashboard/employee")
    else if (isOrg) router.replace("/dashboard/organisation")
    else router.replace("/dashboard/job-seeker")
  }

  function renderCinHints() {
    return (
      <div className="mt-2 space-y-1">
        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Try these Mock CINs to test real verification:</p>
        <div className="flex flex-wrap gap-1.5">
          {["U72200KA2004PTC035301", "L72200PN1945PLC004656"].map(c => (
            <button 
              key={c}
              type="button"
              onClick={() => setOrgId(c)}
              className="text-[10px] bg-primary/5 hover:bg-primary/10 border border-primary/10 px-1.5 py-0.5 rounded text-primary transition-colors"
            >
              {c === "U72200KA2004PTC035301" ? "Google India" : "TATA (TCS)"}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <span className="text-primary text-xl font-semibold">SH</span>
        </div>
        <h1 className="text-3xl font-semibold text-center">Create Account</h1>
        <p className="text-center text-muted-foreground mt-2">Get your Safe Hire verified identity</p>

        {/* Step indicators */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {stepLabels.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold border transition-all",
                  i < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : i === step
                    ? "border-primary text-primary"
                    : "border-border text-muted-foreground"
                )}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("hidden sm:block text-xs font-medium", i === step ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className="h-px w-5 bg-border" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="mt-5 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>
          )}

          {/* ── STEP 0: Role Selection ── */}
          {step === 0 && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">Select the role that best describes you.</p>
              <div className="grid gap-3">
                {ROLE_CONFIG.map(({ value, icon, label, desc }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border p-4 text-left transition-all",
                      role === value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                    )}
                  >
                    <div className={cn("shrink-0", role === value ? "text-primary" : "")}>{icon}</div>
                    <div>
                      <div className="font-semibold text-sm">{label}</div>
                      <div className="text-xs opacity-70 mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <Button className="w-full mt-1" type="button" onClick={goNext}>
                Continue <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* ── STEP 1: Account Details ── */}
          {step === 1 && (
            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="su-email">Email Address</Label>
                <Input
                  id="su-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="su-password">Password</Label>
                <Input
                  id="su-password"
                  type="password"
                  placeholder="Create a strong password (min 6 chars)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button
                  type="button"
                  className="flex-1"
                  onClick={() => {
                    const err = validateStep1()
                    if (err) { setError(err); return }
                    goNext()
                  }}
                >
                  Continue <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 2a: Aadhaar (job_seeker & employee) ── */}
          {step === 2 && !isOrg && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">⚠️ Aadhaar verification is required.</strong> Choose your preferred verification method below.
              </p>
              <div className="flex gap-2 flex-wrap">
                {(["ocr", "xml", "demo"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => {
                      setAadhaarMode(m)
                      setXmlFile(null)
                    }}
                    className={cn(
                      "flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                      aadhaarMode === m ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {m === "ocr" ? (
                      <><Upload className="h-3.5 w-3.5" /> Scan Image/PDF</>
                    ) : m === "xml" ? (
                      <><Upload className="h-3.5 w-3.5" /> Offline XML</>
                    ) : (
                      <><FlaskConical className="h-3.5 w-3.5" /> Demo Mode</>
                    )}
                  </button>
                ))}
              </div>

              {aadhaarMode === "xml" && (
                <div className="grid gap-2">
                  <Label htmlFor="su-xml">Aadhaar Offline eKYC XML</Label>
                  <Input
                    id="su-xml"
                    type="file"
                    accept=".xml"
                    onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Download from{" "}
                    <a href="https://myaadhaar.uidai.gov.in/offline-ekyc" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                      myaadhaar.uidai.gov.in
                    </a>{" "}
                    → extract from ZIP → upload the .xml file.
                  </p>
                </div>
              )}

              {aadhaarMode === "ocr" && (
                <div className="grid gap-2">
                  <Label htmlFor="su-ocr">Aadhaar Card Image / PDF</Label>
                  <Input
                    id="su-ocr"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setXmlFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Upload a clear photo or PDF of your Aadhaar card for instant OCR verification.
                  </p>
                </div>
              )}

              {aadhaarMode === "demo" && (
                <div className="grid gap-2">
                  <Label htmlFor="su-demoname">Full Name (Demo)</Label>
                  <Input
                    id="su-demoname"
                    placeholder="Priya Sharma"
                    value={demoName}
                    onChange={(e) => setDemoName(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">Demo mode skips real Aadhaar verification — for testing only.</p>
                </div>
              )}

              <div className="flex gap-2 mt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                {isEmployee ? (
                  <Button
                    type="button"
                    className="flex-1"
                    onClick={() => {
                      const err = validateAadhaar()
                      if (err) { setError(err); return }
                      goNext()
                    }}
                  >
                    Continue <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    className="flex-1" 
                    disabled={loading}
                    onClick={(e) => {
                      const err = validateAadhaar()
                      if (err) { setError(err); return }
                      // Validation passed, now submit
                      const form = e.currentTarget.closest('form')
                      if (form) {
                        const submitEvent = new Event('submit', { bubbles: true, cancelable: true })
                        form.dispatchEvent(submitEvent)
                      }
                    }}
                  >
                    {loading ? "Creating Account…" : "Create Account"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* ── STEP 2b: Org Details (organisation) ── */}
          {step === 2 && isOrg && (
            <div className="grid gap-4">
              <p className="text-sm text-muted-foreground">
                Provide your organisation details for verification.
              </p>
              <div className="grid gap-1.5">
                <Label htmlFor="su-orgname">Organisation / Institution Name</Label>
                <Input
                  id="su-orgname"
                  placeholder="Delhi University / Coding Club"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="su-orgid">Registration Number / UDISE / PAN</Label>
                <Input
                  id="su-orgid"
                  placeholder="e.g. U12345KA2020 or AAAPA1234A"
                  value={orgId}
                  onChange={(e) => setOrgId(e.target.value.toUpperCase())}
                />
                {renderCinHints()}
              </div>
              <div className="flex gap-2 mt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating Account…" : "Create Account"}
                </Button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Company Details (employee only) ── */}
          {step === 3 && isEmployee && (
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Provide your company details for verification.</p>
                <button
                  type="button"
                  onClick={() => setCompanyDemo((v) => !v)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    companyDemo
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <FlaskConical className="h-3.5 w-3.5" />
                  {companyDemo ? "Demo Mode On" : "Use Demo Mode"}
                </button>
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="su-cname">Company Name</Label>
                <Input
                  id="su-cname"
                  placeholder="Acme Pvt Ltd"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                />
              </div>

              {!companyDemo && (
                <div className="grid gap-1.5">
                  <Label htmlFor="su-cid">CIN or PAN</Label>
                  <Input
                    id="su-cid"
                    placeholder="e.g. U12345KA2020PTC012345"
                    value={orgId}
                    onChange={(e) => setOrgId(e.target.value.toUpperCase())}
                  />
                  {renderCinHints()}
                  <p className="text-xs text-muted-foreground">Skip verification? Toggle Demo Mode above.</p>
                </div>
              )}

              {companyDemo && (
                <p className="text-xs rounded-lg bg-primary/5 border border-primary/20 px-3 py-2 text-muted-foreground">
                  🧪 Demo mode — company will be saved without external verification. You can update this later.
                </p>
              )}

              <div className="flex gap-2 mt-1">
                <Button type="button" variant="secondary" className="flex-1" onClick={goBack}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Creating Account…" : "Create Account"}
                </Button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm mt-5 text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="text-primary">Sign In</Link>
        </p>
      </div>
    </main>
  )
}
