"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { getSupabaseBrowser } from "@/lib/supabase/client"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  Briefcase, User, Building2, ChevronRight, ChevronLeft,
  CheckCircle2, Upload, Eye, EyeOff,
  AlertCircle, Loader2, ShieldCheck, Users,
} from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { AadhaarVerificationForm } from "@/components/dashboard/aadhaar-verification-form"

type Role = "job_seeker" | "employee" | "organisation"
type AadhaarMode = "xml" | "ocr"

const ROLE_CONFIG = [
  {
    value: "job_seeker" as const,
    icon: <User className="h-6 w-6" />,
    label: "Job Seeker",
    desc: "Find verified jobs & build your profile",
    activeColor: "border-blue-500 bg-blue-50",
  },
  {
    value: "employee" as const,
    icon: <Briefcase className="h-6 w-6" />,
    label: "Employer",
    desc: "Post jobs & manage hiring",
    activeColor: "border-amber-500 bg-amber-50",
  },
  {
    value: "organisation" as const,
    icon: <Building2 className="h-6 w-6" />,
    label: "Organisation / Institution",
    desc: "Issue certificates & verify achievements",
    activeColor: "border-purple-500 bg-purple-50",
  },
]

// Step labels per role
const getStepLabels = (role: Role) => {
  if (role === "employee") return ["Role", "Company CIN", "Aadhaar", "Account"]
  if (role === "organisation") return ["Role", "Institute", "Committee", "Your Post", "Aadhaar", "Account"]
  return ["Role", "Aadhaar", "Certificate Name", "Account"]
}

// Step indices
function getStepIdx(role: Role) {
  if (role === "employee") return { cin: 1, institute: -1, committee: -1, mypost: -1, aadhaar: 2, certName: -1, account: 3 }
  if (role === "organisation") return { cin: -1, institute: 1, committee: 2, mypost: 3, aadhaar: 4, certName: -1, account: 5 }
  return { cin: -1, institute: -1, committee: -1, mypost: -1, aadhaar: 1, certName: 2, account: 3 }
}

export default function SignUpPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [registered, setRegistered] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)
  const [hasReadRules, setHasReadRules] = useState(false)
  const rulesRef = useRef<HTMLDivElement>(null)

  const handleRulesScroll = () => {
    if (rulesRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = rulesRef.current
      if (scrollTop + clientHeight >= scrollHeight - 20) {
        setHasReadRules(true)
      }
    }
  }

  const RULES_AND_REGULATIONS = `
1. IDENTITY VERIFICATION (AADHAAR)
SafeHire uses voluntary Aadhaar-based identity verification to prevent fraud. Your full 12-digit Aadhaar number is NEVER stored or transmitted to any server. We extract only your full name and the last 4 digits of your card, which are combined into a one-way SHA-256 cryptographic hash and stored as an irreversible code. This code is used solely to prevent duplicate accounts.

2. DATA MINIMIZATION
In accordance with the DPDPA 2023 and UIDAI guidelines, SafeHire follows the 'data minimization' principle. We collect only what is absolutely necessary to establish identity. Masked formats such as "**** **** 3948" are accepted.

3. COMMITTEE & ORGANISATION ACCOUNTS
Organisational account holders are personally responsible for the accuracy of events, certificates, and posts published under their committee. Misuse will result in account suspension and potential legal action.

4. DOCUMENT AUTHENTICITY
All uploaded documents are scanned for authenticity. Submission of forged, altered, or counterfeit documents is a violation of the Indian IT Act 2000 and the DPDPA 2023 and may result in criminal prosecution.

5. PLATFORM LIABILITY
SafeHire is a verification-assistance platform and is not liable for hiring decisions made by third parties. All verification is best-effort. Users agree to cross-verify information through official channels before making employment decisions.

6. CONSENT & VOLUNTARY USE
Use of Aadhaar for verification is voluntary. Providing Aadhaar on SafeHire is your explicit, informed consent for us to perform a one-time identity check. You may request deletion of your data at any time by contacting support.
  `.trim()

  // Role
  const [role, setRole] = useState<Role>("job_seeker")

  // CIN lookup (employer)
  const [orgId, setOrgId] = useState("")
  const [orgName, setOrgName] = useState("")
  const [isFetchingCin, setIsFetchingCin] = useState(false)
  const cinDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Institute (organisation)
  const [institutes, setInstitutes] = useState<{ id: string; name: string; domain: string }[]>([])
  const [selectedInstituteId, setSelectedInstituteId] = useState("")
  const [notListed, setNotListed] = useState(false)
  const [newInstituteName, setNewInstituteName] = useState("")
  const [newInstituteEmail, setNewInstituteEmail] = useState("")
  const [idCardFile, setIdCardFile] = useState<File | null>(null)
  const [submitingRequest, setSubmitingRequest] = useState(false)
  const [requestSent, setRequestSent] = useState(false)

  // Committee (organisation)
  const [committees, setCommittees] = useState<{ id: string; name: string }[]>([])
  const [fetchingCommittees, setFetchingCommittees] = useState(false)
  const [selectedCommitteeId, setSelectedCommitteeId] = useState("")
  const [committeeOther, setCommitteeOther] = useState(false)
  const [customCommitteeName, setCustomCommitteeName] = useState("")

  // Position
  const [position, setPosition] = useState("")

  // Aadhaar
  const [aadhaarMode, setAadhaarMode] = useState<AadhaarMode>("ocr")
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  // Aadhaar step verification state — OCR runs at STEP level, not final submit
  const [isVerifyingAadhaar, setIsVerifyingAadhaar] = useState(false)
  const [aadhaarVerified, setAadhaarVerified] = useState(false)
  const [aadhaarVerifiedName, setAadhaarVerifiedName] = useState<string | null>(null)
  const [aadhaarVerifiedNumber, setAadhaarVerifiedNumber] = useState<string | null>(null)
  const [certificateName, setCertificateName] = useState("")

  // Account
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  // GST Proof state
  const [requiresProof, setRequiresProof] = useState(false)
  const [companyRecordId, setCompanyRecordId] = useState<string | null>(null)
  const [isVerifyingDoc, setIsVerifyingDoc] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  const isEmployee = role === "employee"
  const isOrg = role === "organisation"
  const isJobSeeker = role === "job_seeker"
  const stepLabels = getStepLabels(role)
  const stepIdx = getStepIdx(role)

  function clearError() { setError(null) }
  function goNext() { clearError(); setStep(s => s + 1) }
  function goBack() { clearError(); setStep(s => s - 1) }

  // Load institutes when org role is selected and step reaches institute step
  useEffect(() => {
    if (isOrg && step === stepIdx.institute) {
      fetch("/api/institute/list")
        .then(r => r.json())
        .then(d => { if (d.ok) setInstitutes(d.institutes || []) })
        .catch(() => {})
    }
  }, [isOrg, step, stepIdx.institute])

  // Load committees when institute is selected
  useEffect(() => {
    if (!selectedInstituteId || committeeOther) return
    setFetchingCommittees(true)
    setCommittees([])
    setSelectedCommitteeId("")
    fetch(`/api/institute/committees?institute_id=${selectedInstituteId}`)
      .then(r => r.json())
      .then(d => { if (d.ok) setCommittees(d.committees || []) })
      .catch(() => {})
      .finally(() => setFetchingCommittees(false))
  }, [selectedInstituteId, committeeOther])

  // ── CIN Auto-Lookup (employer) ─────────────────────────────────────────────
  useEffect(() => {
    if (orgId.length < 10) { setOrgName(""); return }
    if (cinDebounceRef.current) clearTimeout(cinDebounceRef.current)
    cinDebounceRef.current = setTimeout(async () => {
      if (orgId.length !== 21 && orgId.length !== 10) return
      setIsFetchingCin(true)
      setError(null)
      setOrgName("")
      try {
        const res = await fetch(`/api/company/verify?cin=${encodeURIComponent(orgId)}`)
        const data = await res.json()
        if (data.ok) setOrgName(data.name || "")
        else setError(data.message || "Invalid CIN. No company found.")
      } catch { setError("Connection error while looking up CIN.") }
      setIsFetchingCin(false)
    }, 600)
  }, [orgId])

  // ── Institute request submission ───────────────────────────────────────────
  async function handleInstituteRequest() {
    if (!newInstituteName.trim() || !newInstituteEmail.trim()) {
      setError("Institute name and official email are required.")
      return
    }
    setSubmitingRequest(true)
    setError(null)

    let id_card_url = ""
    if (idCardFile) {
      const fd = new FormData()
      fd.append("file", idCardFile)
      const upRes = await fetch("/api/institute/upload-id", { method: "POST", body: fd })
      const upData = await upRes.json()
      if (!upData.ok) { setError(upData.message || "Failed to upload ID card"); setSubmitingRequest(false); return }
      id_card_url = upData.url
    }

    const res = await fetch("/api/institute/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ institute_name: newInstituteName, email: newInstituteEmail, id_card_url }),
    })
    const data = await res.json()
    setSubmitingRequest(false)
    if (data.ok) {
      setRequestSent(true)
    } else {
      setError(data.message || "Failed to submit request")
    }
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  function validateInstituteStep(): string | null {
    if (notListed) return requestSent ? null : "Please submit your institute request first."
    if (!selectedInstituteId) return "Please select your institute."
    return null
  }

  function validateCommitteeStep(): string | null {
    if (committeeOther && !customCommitteeName.trim()) return "Please enter your committee name."
    if (!committeeOther && !selectedCommitteeId) return "Please select a committee."
    return null
  }

  function validateCin(): string | null {
    if (isOrg) return validateInstituteStep()
    if (!orgName) return "Please enter a valid CIN / PAN so the company name can be verified."
    return null
  }

  // ── Aadhaar verification success callback ──────────────────────────────
  function handleAadhaarSuccess(data: { fullName: string; last4: string | null }) {
    setAadhaarVerified(true)
    setAadhaarVerifiedName(data.fullName)
    setAadhaarVerifiedNumber(data.last4)
    setCertificateName(data.fullName) // Pre-fill certificate name
    setError(null)
    goNext()
  }

  function handleAadhaarSkip() {
    setAadhaarVerified(false)
    setAadhaarVerifiedName(null)
    setAadhaarVerifiedNumber(null)
    setError(null)
    goNext()
  }

  const persistPendingData = () => {
    const data = {
      role,
      certificate_name: certificateName,
      aadhaar_full_name: aadhaarVerifiedName,
      aadhaar_last4: aadhaarVerifiedNumber,
      aadhaar_verified: aadhaarVerified,
      institute_id: selectedInstituteId,
      committee_id: committeeOther ? null : selectedCommitteeId,
      committee_name: committeeOther ? customCommitteeName : null,
      committee_position: position,
    }
    // Save to a transient cookie that the auth callback can read
    document.cookie = `sb-pending-signup=${encodeURIComponent(JSON.stringify(data))}; path=/; max-age=600; SameSite=Lax`
    console.log("Pending signup data persisted to cookie")
  }

  async function handleGoogleSignUp() {
    clearError()
    setLoading(true)
    
    // Persist data before redirecting to Google
    persistPendingData()
    
    const supabase = getSupabaseBrowser()
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
      },
    })
    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  function validateAccount(): string | null {
    if (!email.trim()) return "Please enter your email."
    if (password.length < 6) return "Password must be at least 6 characters."
    return null
  }

  // ── GST Document Verification ──────────────────────────────────────────────
  async function handleDocVerify(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !companyRecordId) return
    if (file.size > 5 * 1024 * 1024) { setError("File too large. Max 5MB."); return }
    setIsVerifyingDoc(true)
    setError(null)
    const formData = new FormData()
    formData.append("file", file)
    formData.append("companyId", companyRecordId)
    try {
      const res = await fetch("/api/company/verify-document", { method: "POST", body: formData })
      const data = await res.json()
      if (data.ok) {
        setIsVerified(true)
        setTimeout(() => {
          if (isEmployee) router.replace("/dashboard/employee")
          else if (isOrg) router.replace("/dashboard/organisation")
          else router.replace("/dashboard/job-seeker")
        }, 1500)
      } else {
        setError(data.message || "Document verification failed.")
      }
    } catch { setError("Internal error during OCR analysis.") }
    setIsVerifyingDoc(false)
  }

  // ── Final submit ───────────────────────────────────────────────────────────
  async function handleSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const accountErr = validateAccount()
    if (accountErr) { setError(accountErr); return }

    setLoading(true)
    setError(null)
    const supabase = getSupabaseBrowser()

    // 1. Aadhaar: use ALREADY VERIFIED data from step (OCR ran at step level)
    let aadhaarData: any = aadhaarVerified && aadhaarVerifiedName
      ? { fullName: aadhaarVerifiedName, aadhaarNumber: aadhaarVerifiedNumber, aadhaarLast4: aadhaarVerifiedNumber }
      : null

    // 2. Create account (Identity is now optional at signup)
    const { error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL || `${window.location.origin}/dashboard`,
      },
    })
    if (signUpErr) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) { setError(signInErr.message); setLoading(false); return }
    }

    // 3. Setup profile role AND identity metadata
    const roleToSave = isEmployee ? "employee" : isOrg ? "organisation" : "job_seeker"
    const setupRes = await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        full_name: "", 
        role: roleToSave,
        aadhaar_full_name: aadhaarData?.fullName || null,
        aadhaar_number: aadhaarData?.aadhaarNumber || null,
        aadhaar_last4: aadhaarData?.aadhaarLast4 || null,
        aadhaar_verified: !!aadhaarData,
        certificate_name: certificateName || aadhaarData?.fullName || ""
      }),
    })
    
    if (!setupRes.ok) {
      const j = await setupRes.json().catch(() => ({}))
      
      // If it's a duplicate Aadhaar, clean up the orphan auth account we just created
      if (j?.duplicate) {
        // Sign out and delete the orphan session so no SafeHire ID is generated
        await supabase.auth.signOut()
      }
      
      setError(j?.message || "Failed to finalize profile")
      setLoading(false)
      // Reset Aadhaar verification so user must re-verify
      setAadhaarVerified(false)
      setAadhaarVerifiedName(null)
      setAadhaarVerifiedNumber(null)
      return
    }

    // 4a. Company verification (employer)
    if (isEmployee && orgName) {
      const vRes = await fetch("/api/company/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationNumber: orgId.trim() || undefined, name: orgName.trim() }),
      })
      const vData = await vRes.json()
      if (!vRes.ok) { setError(vData.message || "Company verification failed"); setLoading(false); return }
      if (vData.requiresProof) {
        setCompanyRecordId(vData.company?.id)
        setRequiresProof(true)
        setLoading(false)
        return
      }
    }

    // 4b. Save institute/committee profile (organisation)
    if (isOrg) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && selectedInstituteId) {
        await supabase.from("profiles").update({
          institute_id: selectedInstituteId,
          committee_id: committeeOther ? null : (selectedCommitteeId || null),
          committee_name: committeeOther ? customCommitteeName : null,
          committee_position: position.trim() || null,
        }).eq("user_id", user.id)
      }
    }

    setLoading(false)
    // Directly go to dashboard
    if (isEmployee) router.replace("/dashboard/employee")
    else if (isOrg) router.replace("/dashboard/organisation")
    else router.replace("/dashboard/job-seeker")
  }

  const inputClass = "h-12 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA]"
  const labelClass = "text-sm font-medium text-[#18181B]"
  const selectClass = "h-12 rounded-xl border border-[#E4E4E7] bg-white px-3 text-sm text-[#18181B] focus:outline-none focus:border-[#18181B] w-full"

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl overflow-hidden flex items-center justify-center">
            <img src="/logo.png" alt="SafeHire" className="h-full w-full object-cover" />
          </div>
          <span className="font-semibold text-[#18181B] text-lg">Safe Hire</span>
        </div>

        {/* ── Email Confirmation Screen ── */}
        {registered && (
          <div className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm p-8 text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-[#18181B]">Almost there! Confirm your email</h2>
            <p className="text-sm text-[#71717A] leading-relaxed">
              We've sent a confirmation link to <strong>{email}</strong>.<br />
              Click the link in your inbox to activate your account and access your dashboard.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 text-left">
              ⚠️ <strong>Important:</strong> Your Aadhaar has been verified. Once you click the email link, you'll be taken directly to your dashboard.
              If you don't see the email, check your spam folder.
            </div>
            <a
              href="/sign-in"
              className="inline-block mt-2 text-sm font-semibold text-[#18181B] hover:underline"
            >
              ← Already confirmed? Sign in
            </a>
          </div>
        )}

        {!registered && (
          <>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-[#18181B]">Create Account</h1>
          <p className="text-[#71717A] mt-2 text-sm">Get your Safe Hire verified identity</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
          {stepLabels.map((label, i) => (
            <div key={label + i} className="flex items-center gap-2">
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-all",
                i < step ? "bg-[#18181B] text-white" :
                i === step ? "bg-[#18181B] text-white ring-4 ring-[#18181B]/10" :
                "bg-[#F4F4F6] text-[#A1A1AA] border border-[#E4E4E7]"
              )}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn("hidden sm:block text-xs font-medium", i === step ? "text-[#18181B]" : "text-[#A1A1AA]")}>
                {label}
              </span>
              {i < stepLabels.length - 1 && <div className="h-px w-4 bg-[#E4E4E7]" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-[#E4E4E7] shadow-sm p-7">
          {error && (
            <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* ── STEP 0: Role ── */}
          {step === 0 && (
            <div className="space-y-4">
              <p className="text-sm text-[#71717A]">Select the role that best describes you.</p>
              <div className="grid gap-3">
                {ROLE_CONFIG.map(({ value, icon, label, desc, activeColor }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={cn(
                      "flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                      role === value ? `${activeColor} shadow-sm` : "border-[#E4E4E7] bg-white hover:border-[#A1A1AA]"
                    )}
                  >
                    <div className={cn(
                      "shrink-0 h-11 w-11 rounded-xl flex items-center justify-center",
                      role === value ? "bg-[#18181B] text-white" : "bg-[#F4F4F6] text-[#71717A]"
                    )}>
                      {icon}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-[#18181B]">{label}</div>
                      <div className="text-xs text-[#71717A] mt-0.5">{desc}</div>
                    </div>
                  </button>
                ))}
              </div>
              <button type="button" onClick={goNext} className="w-full mt-2 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all flex items-center justify-center gap-2">
                Continue <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* ── CIN Step (employer) ── */}
          {step === stepIdx.cin && stepIdx.cin > 0 && !isOrg && (
            <div className="space-y-5">
              <div>
                <p className="text-sm font-semibold text-[#18181B]">Enter Company Registration Number</p>
                <p className="text-xs text-[#71717A] mt-0.5">CIN or PAN — we'll fetch the official name.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="su-cin" className={labelClass}>CIN / PAN</Label>
                  <div className="relative">
                    <Input
                      id="su-cin"
                      placeholder="e.g. U72200KA2004PTC035301"
                      value={orgId}
                      onChange={e => setOrgId(e.target.value.toUpperCase().trim())}
                      className={cn(inputClass, "uppercase pr-12")}
                      maxLength={21}
                    />
                    {isFetchingCin && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#18181B]" />
                      </div>
                    )}
                  </div>
                </div>
                {orgName && (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">✓ Company Verified</p>
                        <p className="text-sm font-bold text-emerald-900 leading-tight">{orgName}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={isFetchingCin || !orgName.trim()}
                  onClick={() => { const err = validateCin(); if (err) { setError(err); return } goNext() }}
                  className="flex-1 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── INSTITUTE STEP (org) ── */}
          {step === stepIdx.institute && isOrg && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <p className="text-sm font-semibold text-[#18181B]">Select Your Institute</p>
                <p className="text-xs text-[#71717A] mt-0.5">Choose from verified institutions or submit yours for review.</p>
              </div>

              {!notListed ? (
                <>
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Institute</Label>
                    <select
                      value={selectedInstituteId}
                      onChange={e => setSelectedInstituteId(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select institute…</option>
                      {institutes.map(inst => (
                        <option key={inst.id} value={inst.id}>{inst.name}</option>
                      ))}
                    </select>
                  </div>

                  {selectedInstituteId && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      Institute selected. Your sign-up email must match the institute domain.
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => { setNotListed(true); setSelectedInstituteId(""); setError(null) }}
                    className="text-xs text-[#71717A] hover:text-[#18181B] underline underline-offset-2 transition-colors"
                  >
                    My institute is not listed
                  </button>
                </>
              ) : (
                /* Not listed form */
                requestSent ? (
                  <div className="flex flex-col items-center text-center py-6 space-y-3">
                    <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center">
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-[#18181B]">Request Submitted!</p>
                      <p className="text-sm text-[#71717A] mt-1">An admin will verify and add your institute. You'll be notified via email.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setNotListed(false); setRequestSent(false); setError(null) }}
                      className="text-xs text-blue-600 hover:underline"
                    >
                      ← Back to institute list
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4 animate-in fade-in duration-300">
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                      Submit your institute details for admin verification. Once approved, it will appear in the list.
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Institute Name</Label>
                      <Input value={newInstituteName} onChange={e => setNewInstituteName(e.target.value)} placeholder="e.g. Lokmanya Tilak College of Engineering" className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Official Institute Email</Label>
                      <Input type="email" value={newInstituteEmail} onChange={e => setNewInstituteEmail(e.target.value)} placeholder="e.g. you@ltce.in" className={inputClass} />
                      <p className="text-[11px] text-[#71717A]">Must be an institutional domain (e.g. @ltce.in, @mu.ac.in)</p>
                    </div>
                    <div className="space-y-1.5">
                      <Label className={labelClass}>Institute ID Card <span className="text-[#A1A1AA] font-normal">(optional)</span></Label>
                      <Input type="file" accept="image/*,.pdf" onChange={e => setIdCardFile(e.target.files?.[0] || null)} className={inputClass} />
                    </div>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => { setNotListed(false); setError(null) }} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3 rounded-full hover:bg-[#F4F4F6] transition-all text-sm">
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitingRequest}
                        onClick={handleInstituteRequest}
                        className="flex-1 bg-[#18181B] text-white font-semibold py-3 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-60 text-sm flex items-center justify-center gap-2"
                      >
                        {submitingRequest ? <><Loader2 className="h-4 w-4 animate-spin" /> Submitting…</> : "Submit Request"}
                      </button>
                    </div>
                  </div>
                )
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!selectedInstituteId && !requestSent}
                  onClick={() => {
                    const err = validateInstituteStep()
                    if (err) { setError(err); return }
                    if (requestSent) {
                      // block account creation until approved — just show info
                      setError("Your institute is pending admin approval. You'll receive an email when approved.")
                      return
                    }
                    goNext()
                  }}
                  className="flex-1 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── COMMITTEE STEP (org) ── */}
          {step === stepIdx.committee && isOrg && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <p className="text-sm font-semibold text-[#18181B]">Select Your Committee</p>
                <p className="text-xs text-[#71717A] mt-0.5">Choose the committee you belong to at your institute.</p>
              </div>

              {!committeeOther ? (
                <div className="space-y-3">
                  {fetchingCommittees ? (
                    <div className="flex items-center gap-2 text-sm text-[#71717A] py-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading committees…
                    </div>
                  ) : (
                    <>
                      <div className="space-y-1.5">
                        <Label className={labelClass}>Committee</Label>
                        <select
                          value={selectedCommitteeId}
                          onChange={e => setSelectedCommitteeId(e.target.value)}
                          className={selectClass}
                        >
                          <option value="">Select committee…</option>
                          {committees.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setCommitteeOther(true); setSelectedCommitteeId(""); setError(null) }}
                        className="text-xs text-[#71717A] hover:text-[#18181B] underline underline-offset-2 transition-colors"
                      >
                        My committee is not listed / Other
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="space-y-1.5">
                    <Label className={labelClass}>Committee Name</Label>
                    <Input
                      value={customCommitteeName}
                      onChange={e => setCustomCommitteeName(e.target.value)}
                      placeholder="e.g. Technical Committee, NSS, ISTE"
                      className={inputClass}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => { setCommitteeOther(false); setCustomCommitteeName(""); setError(null) }}
                    className="text-xs text-[#71717A] hover:text-[#18181B] underline underline-offset-2 transition-colors"
                  >
                    ← Back to committee list
                  </button>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const err = validateCommitteeStep()
                    if (err) { setError(err); return }
                    goNext()
                  }}
                  className="flex-1 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── POSITION STEP (org) ── */}
          {step === stepIdx.mypost && isOrg && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div>
                <p className="text-sm font-semibold text-[#18181B]">Your Role in the Committee</p>
                <p className="text-xs text-[#71717A] mt-0.5">Enter your designation or position.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-position" className={labelClass}>Position / Designation</Label>
                <Input
                  id="su-position"
                  value={position}
                  onChange={e => setPosition(e.target.value)}
                  placeholder="e.g. Secretary, Technical Head, President"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!position.trim()}
                  onClick={goNext}
                  className="flex-1 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Aadhaar Step ── */}
          {step === stepIdx.aadhaar && stepIdx.aadhaar > 0 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <AadhaarVerificationForm 
                role={role}
                committeeId={selectedCommitteeId}
                onSuccess={handleAadhaarSuccess}
                onSkip={handleAadhaarSkip}
                showSkip={true}
              />
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3 rounded-xl hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2 text-sm">
                  <ChevronLeft className="h-4 w-4" /> Go Back
                </button>
              </div>
            </div>
          )}

          {/* ── Certificate Name Step ── */}
          {step === stepIdx.certName && (
            <div className="space-y-5 animate-in fade-in duration-300">
              <div className="space-y-2">
                <h2 className="text-sm font-bold text-[#18181B] flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#18181B] text-[10px] text-white font-bold">?</span>
                  Certificate Display Name
                </h2>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  How should your name appear on official certificates? We've pre-filled this from your identity verification.
                </p>
              </div>

              <div className="space-y-1.5 pt-2">
                <Label htmlFor="cert-name" className={labelClass}>Name on Certificate</Label>
                <div className="relative">
                  <Input
                    id="cert-name"
                    value={certificateName}
                    onChange={e => setCertificateName(e.target.value)}
                    placeholder="Enter your full name as you want it on certificates"
                    className={inputClass}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <CheckCircle2 className={cn("h-4 w-4 transition-colors", certificateName.trim().length > 2 ? "text-emerald-500" : "text-[#E4E4E7]")} />
                  </div>
                </div>
                <p className="text-[10px] text-[#A1A1AA] italic mt-1">
                  You can change this anytime from your profile settings.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="button"
                  disabled={!certificateName.trim()}
                  onClick={() => {
                    persistPendingData()
                    goNext()
                  }}
                  className="flex-1 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Save & Next <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── Account Step ── */}
          {step === stepIdx.account && !requiresProof && (
            <div className="space-y-4">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleSignUp}
                className="w-full border border-[#E4E4E7] text-[#18181B] font-bold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-3 mb-2"
              >
                <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
                Continue with Google
              </button>

              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-[#E4E4E7]"></span>
                </div>
                <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
                  <span className="bg-white px-2 text-[#A1A1AA]">Or use email & password</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="su-email" className={labelClass}>Email Address</Label>
                <Input
                  id="su-email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  className={inputClass}
                />
                {isEmployee && (
                  <p className="text-[11px] text-[#71717A]">
                    💡 Using your corporate email enables instant verification.
                  </p>
                )}
                {isOrg && selectedInstituteId && (() => {
                  const inst = institutes.find(i => i.id === selectedInstituteId)
                  return inst ? (
                    <p className="text-[11px] text-[#71717A]">
                      💡 Use your institute email ending in <code className="bg-[#F4F4F6] px-1 rounded">@{inst.domain}</code> for smooth verification.
                    </p>
                  ) : null
                })()}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="su-password" className={labelClass}>Password</Label>
                <div className="relative">
                  <Input
                    id="su-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Min 6 characters"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    autoComplete="new-password"
                    className={cn(inputClass, "pr-12")}
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
              <div className="space-y-4 pt-2">
                <div className="bg-[#F4F4F6] rounded-2xl p-4 border border-[#E4E4E7]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#18181B] mb-2 px-1">Rules & Regulations</p>
                  <div className="h-32 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-[#18181B]/10">
                    <pre className="text-[11px] text-[#71717A] leading-relaxed font-sans whitespace-pre-wrap">
                      {RULES_AND_REGULATIONS}
                    </pre>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-1">
                  <Checkbox 
                    id="su-agree" 
                    checked={agreedToTerms} 
                    onCheckedChange={(checked) => setAgreedToTerms(checked === true)}
                    className="mt-0.5 border-[#18181B]"
                  />
                  <Label htmlFor="su-agree" className="text-[11px] text-[#52525B] leading-snug cursor-pointer">
                    I have read and agree to all the Rules and Regulations, and I consent to the secure verification of my identity.
                  </Label>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <button type="button" onClick={goBack} className="flex-1 border border-[#E4E4E7] text-[#18181B] font-semibold py-3.5 rounded-full hover:bg-[#F4F4F6] transition-all flex items-center justify-center gap-2">
                  <ChevronLeft className="h-4 w-4" /> Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !agreedToTerms}
                  className="flex-1 bg-[#18181B] text-white font-semibold py-3.5 rounded-full hover:bg-[#27272A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading
                    ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Verifying…</>
                    : "Create Account"
                  }
                </button>
              </div>

            </div>
          )}

          {/* ── GST Proof Step ── */}
          {requiresProof && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              {isVerified ? (
                <div className="flex flex-col items-center text-center space-y-4 py-6">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <ShieldCheck className="h-8 w-8 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-black text-lg text-[#18181B]">Identity Anchored</p>
                    <p className="text-sm text-[#71717A] mt-1">Redirecting to your dashboard…</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">
                      <h4 className="font-bold text-amber-900 text-sm">Authorization Proof Required</h4>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        <strong>{email}</strong> doesn't match <strong>{orgName}</strong>'s domain.
                        Upload a GST certificate or business bill to verify your association.
                      </p>
                    </div>
                  </div>
                  <div className="bg-white p-7 rounded-2xl border-2 border-[#18181B] flex flex-col items-center text-center space-y-5 shadow-xl shadow-black/5">
                    <div className="h-14 w-14 rounded-2xl bg-[#18181B] flex items-center justify-center text-white">
                      {isVerifyingDoc ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                    </div>
                    <div className="space-y-1">
                      <h5 className="font-black uppercase text-[10px] tracking-widest text-[#18181B]">GST / Business Document</h5>
                      <p className="text-[11px] text-[#71717A] max-w-[220px]">
                        Upload a GST certificate, tax invoice, or business bill. JPG, PNG, or PDF · Max 5MB.
                      </p>
                    </div>
                    <label className={cn(
                      "w-full py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2",
                      isVerifyingDoc
                        ? "bg-[#F4F4F6] text-[#A1A1AA] border-[#E4E4E7]"
                        : "bg-white text-[#18181B] border-[#18181B] hover:bg-[#F4F4F6]"
                    )}>
                      <Upload className="h-4 w-4" />
                      {isVerifyingDoc ? "Analyzing Document…" : "Upload & Verify Identity"}
                      <input type="file" className="hidden" accept="image/*,.pdf" onChange={handleDocVerify} disabled={isVerifyingDoc} />
                    </label>
                  </div>
                </>
              )}
            </div>
          )}
        </form>

        <p className="text-center text-sm mt-6 text-[#71717A]">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-semibold text-[#18181B] hover:underline">Sign In</Link>
        </p>
        </>
        )}
      </div>
    </main>
  )
}
