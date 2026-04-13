"use client"

import { useState, useRef } from "react"
import { ShieldCheck, Upload, Loader2, CheckCircle2, AlertCircle, ChevronRight, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AadhaarVerificationFormProps {
  role: string
  committeeId?: string
  onSuccess: (data: { fullName: string; last4: string | null }) => void
  onSkip?: () => void
  showSkip?: boolean
  className?: string
}

type AadhaarMode = "ocr" | "xml"

export function AadhaarVerificationForm({
  role,
  committeeId,
  onSuccess,
  onSkip,
  showSkip = false,
  className
}: AadhaarVerificationFormProps) {
  const [aadhaarMode, setAadhaarMode] = useState<AadhaarMode>("ocr")
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null)
  const [isVerifying, setIsVerifying] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

3. CONSENT & VOLUNTARY USE
Use of Aadhaar for verification is voluntary. Providing Aadhaar on SafeHire is your explicit, informed consent for us to perform a one-time identity check. You may request deletion of your data at any time by contacting support.
  `.trim()

  async function handleVerify() {
    if (!aadhaarFile) {
      setError(aadhaarMode === "xml" ? "Please select your Aadhaar XML file." : "Please upload your Aadhaar card image.")
      return
    }
    setIsVerifying(true)
    setError(null)

    const modeParam = aadhaarMode === "xml" ? "offline-xml" : "ocr"
    const params = new URLSearchParams({ mode: modeParam, signup: "true", role })
    if (committeeId) params.append("committee_id", committeeId)

    const form = new FormData()
    form.append("file", aadhaarFile)

    try {
      const res = await fetch(`/api/verify/aadhaar?${params.toString()}`, { method: "POST", body: form })
      const data = await res.json()
      setIsVerifying(false)

      if (!data.success || !data.fullName) {
        setError(data.message || "Could not extract Aadhaar details. Please use a clear front photo of your Aadhaar card.")
        return
      }

      onSuccess({
        fullName: data.fullName,
        last4: data.aadhaarLast4 || data.aadhaarNumber || null
      })
    } catch (err) {
      setIsVerifying(false)
      setError("An error occurred during verification. Please try again.")
    }
  }

  const inputClass = "h-12 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-[#18181B] placeholder:text-[#A1A1AA]"
  const labelClass = "text-sm font-medium text-[#18181B]"

  return (
    <div className={cn("space-y-6", className)}>
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-sm text-blue-800 flex items-start gap-3">
        <ShieldCheck className="h-5 w-5 shrink-0 mt-0.5 text-blue-600" />
        <div className="space-y-1">
          <p className="font-bold">Aadhaar Identity Verification</p>
          <p className="text-xs opacity-90">Verify your identity to get the exclusive blue checkmark and build recruiter trust.</p>
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-sm font-bold text-[#18181B] flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-blue-600" />
          Read & Consent to Rules
        </Label>
        <div 
          ref={rulesRef}
          onScroll={handleRulesScroll}
          className="h-32 overflow-y-auto rounded-xl border border-[#E4E4E7] bg-[#F9F9FB] p-4 text-[13px] leading-relaxed text-[#52525B] scrollbar-thin shadow-inner"
        >
          <div className="whitespace-pre-wrap font-medium">
            {RULES_AND_REGULATIONS}
          </div>
          {!hasReadRules && (
            <div className="mt-4 pt-4 border-t border-[#E4E4E7] text-blue-600 font-bold text-center sticky bottom-0 bg-[#F9F9FB]">
              ↓ Scroll to bottom to accept ↓
            </div>
          )}
        </div>
        
        <div className="flex items-start space-x-3 py-1">
          <input
            id="v-agree"
            type="checkbox"
            disabled={!hasReadRules}
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[#E4E4E7] text-[#18181B] focus:ring-[#18181B] disabled:opacity-30"
          />
          <div className="space-y-1">
            <label 
              htmlFor="v-agree" 
              className={cn(
                "text-xs font-semibold leading-none",
                !hasReadRules ? "text-[#A1A1AA]" : "text-[#18181B] cursor-pointer"
              )}
            >
              I agree to the SafeHire Rules & Regulations.
            </label>
          </div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["ocr", "xml"] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => { setAadhaarMode(m); setAadhaarFile(null); setError(null) }}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-4 py-2 text-xs font-semibold transition-all",
              aadhaarMode === m
                ? "border-[#18181B] bg-[#18181B] text-white"
                : "border-[#E4E4E7] text-[#71717A] hover:border-[#A1A1AA] hover:text-[#18181B]"
            )}
          >
            {m === "ocr" ? <><Upload className="h-3.5 w-3.5" /> Scan Photo/PDF</> : <><Upload className="h-3.5 w-3.5" /> Offline XML</>}
          </button>
        ))}
      </div>

      {aadhaarMode === "xml" ? (
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="v-xml" className={labelClass}>Aadhaar Offline eKYC XML</Label>
            <Input id="v-xml" type="file" accept=".xml"
              onChange={e => { setAadhaarFile(e.target.files?.[0] || null); setError(null) }}
              className={inputClass} />
            <p className="text-[10px] text-[#71717A]">
              Download from UIDAI Portal → extract ZIP → upload .xml
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="v-ocr" className={labelClass}>Aadhaar Card Image / PDF</Label>
            <Input id="v-ocr" type="file" accept="image/*,.pdf"
              onChange={e => { setAadhaarFile(e.target.files?.[0] || null); setError(null) }}
              className={inputClass} />
            <p className="text-[10px] text-[#71717A]">Upload a clear photo of the <strong>front</strong> of your Aadhaar card. We only read your <strong>name</strong> and <strong>last 4 digits</strong>.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-[11px] px-3 py-2 rounded-xl flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-3 pt-2">
        <button
          type="button"
          disabled={!aadhaarFile || isVerifying || !agreedToTerms}
          onClick={handleVerify}
          className="w-full bg-[#18181B] text-white font-bold h-12 rounded-xl hover:bg-[#27272A] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-black/5"
        >
          {isVerifying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Verifying Identity…</>
          ) : (
            <>Verify Aadhaar & Continue <ChevronRight className="h-4 w-4" /></>
          )}
        </button>
        
        {showSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-xs font-semibold text-[#71717A] hover:text-[#18181B] flex items-center justify-center gap-1.5"
          >
            <X className="h-3.5 w-3.5" /> Skip verification for now
          </button>
        )}
      </div>
    </div>
  )
}
