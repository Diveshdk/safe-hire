"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { Upload, FlaskConical, FileText, CheckCircle2, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type Mode = "ocr" | "xml" | "demo"
type VerifyResponse = { success: boolean; fullName?: string; aadhaarNumber?: string; message?: string }

export default function AadhaarOnboardingPage() {
  const [mode, setMode] = useState<Mode>("ocr")
  const [file, setFile] = useState<File | null>(null)
  const [demoName, setDemoName] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null)
  const [verified, setVerified] = useState<{ name: string; aadhaarNumber?: string } | null>(null)
  const router = useRouter()

  async function submitOcr(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setMessage({ type: "error", text: "Please choose your Aadhaar card image." }); return }
    setLoading(true); setMessage(null)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/verify/aadhaar?mode=ocr", { method: "POST", body: form })
    const data = await res.json() as VerifyResponse
    setLoading(false)
    if (res.status === 401) { router.replace("/sign-in"); return }
    if (data.success && data.fullName) {
      setVerified({ name: data.fullName, aadhaarNumber: data.aadhaarNumber })
      setTimeout(() => router.replace("/dashboard"), 2000)
    } else {
      setMessage({ type: "error", text: data.message || "Could not extract details. Try a clearer image or use Offline XML." })
    }
  }

  async function submitXml(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setMessage({ type: "error", text: "Please choose your Aadhaar XML file." }); return }
    setLoading(true); setMessage(null)
    const form = new FormData()
    form.append("file", file)
    const res = await fetch("/api/verify/aadhaar?mode=offline-xml", { method: "POST", body: form })
    const data = await res.json() as VerifyResponse
    setLoading(false)
    if (res.status === 401) { router.replace("/sign-in"); return }
    if (data.success && data.fullName) {
      setVerified({ name: data.fullName })
      setTimeout(() => router.replace("/dashboard"), 2000)
    } else {
      setMessage({ type: "error", text: data.message || "XML verification failed. Check that you uploaded the correct file." })
    }
  }

  async function submitDemo(e: React.FormEvent) {
    e.preventDefault()
    if (demoName.trim().length < 3) { setMessage({ type: "error", text: "Enter your full name (at least 3 characters)." }); return }
    setLoading(true); setMessage(null)
    const res = await fetch("/api/verify/aadhaar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "demo", fullName: demoName.trim() }),
    })
    const data = await res.json() as VerifyResponse
    setLoading(false)
    if (data.success) {
      setVerified({ name: data.fullName || demoName.trim() })
      setTimeout(() => router.replace("/dashboard"), 2000)
    } else {
      setMessage({ type: "error", text: data.message || "Demo verification failed." })
    }
  }

  const MODES: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "ocr", label: "Scan Card Image", icon: <Upload className="h-4 w-4" /> },
    { id: "xml", label: "Offline XML", icon: <FileText className="h-4 w-4" /> },
    { id: "demo", label: "Demo Mode", icon: <FlaskConical className="h-4 w-4" /> },
  ]

  if (verified) {
    return (
      <main className="min-h-dvh bg-background flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center grid gap-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold">Aadhaar Verified!</h1>
          <p className="text-muted-foreground">
            Welcome, <span className="text-foreground font-semibold">{verified.name}</span>.
            {verified.aadhaarNumber && <> Your Aadhaar has been securely linked to your account.</>}
          </p>
          <p className="text-sm text-muted-foreground animate-pulse">Redirecting to your dashboard…</p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-[#F4F4F6] flex items-center justify-center px-4 sm:px-10 py-12 sm:py-24">
      <div className="max-w-xl w-full">
        {/* Header content */}
        <div className="text-center space-y-8 sm:space-y-10 mb-12 sm:mb-16">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.25rem] bg-white border border-[#E4E4E7] shadow-xl transform rotate-3 overflow-hidden">
            <img src="/logo.png" alt="SafeHire" className="h-full w-full object-cover p-2" />
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl sm:text-5xl font-black text-[#18181B] tracking-tight uppercase leading-[0.9]">
              Identity Anchor
            </h1>
            <p className="text-[#71717A] text-base sm:text-lg max-w-sm mx-auto leading-relaxed font-medium">
              Activate your SafeHire profile with government-backed Aadhaar verification.
            </p>
          </div>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 sm:gap-3 justify-center mb-8 sm:mb-10 flex-wrap">
          {MODES.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setFile(null); setMessage(null) }}
              className={cn(
                "flex items-center gap-2 rounded-xl border px-5 py-3 text-[11px] font-black uppercase tracking-widest transition-all shadow-sm",
                mode === id 
                  ? "border-[#18181B] bg-[#18181B] text-white shadow-xl shadow-black/10 scale-105" 
                  : "border-[#E4E4E7] bg-white text-[#71717A] hover:border-[#18181B] hover:text-[#18181B]"
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Forms card */}
        <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] border border-[#E4E4E7] p-8 sm:p-14 shadow-2xl animate-in fade-in zoom-in-95 duration-500">
          {message && (
            <div className={cn(
              "mb-8 rounded-2xl px-5 py-4 text-sm font-bold flex items-center gap-3",
              message.type === "error" ? "bg-red-50 text-red-600 border border-red-100" : "bg-emerald-50 text-emerald-600 border border-emerald-100"
            )}>
              <div className={cn("h-2 w-2 rounded-full", message.type === "error" ? "bg-red-500" : "bg-emerald-500")} />
              {message.text}
            </div>
          )}

          {mode === "ocr" && (
            <form onSubmit={submitOcr} className="grid gap-8">
              <div className="grid gap-4">
                <Label htmlFor="ocr-file" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A1A1AA] ml-1">Card Image (Front)</Label>
                <div className="relative group">
                  <Input
                    id="ocr-file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="h-16 pl-6 pr-6 rounded-2xl border-[#E4E4E7] bg-[#FAFAFB] focus:bg-white focus:border-[#18181B] focus:ring-8 focus:ring-[#18181B]/5 transition-all text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#18181B] file:text-white cursor-pointer"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed font-medium ml-1">
                  Our Secure OCR engine will extract your official name for matching. 
                  <span className="text-[#18181B] font-bold"> No data is stored permanently.</span>
                </p>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#18181B] text-white text-[13px] font-black uppercase tracking-widest h-16 rounded-2xl hover:bg-black transition-all shadow-xl hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-40"
              >
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Verification in Progress…</> : "Initiate Secure Scan"}
              </button>
            </form>
          )}

          {mode === "xml" && (
            <form onSubmit={submitXml} className="grid gap-8">
              <div className="grid gap-4">
                <Label htmlFor="xml-file" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A1A1AA] ml-1">Offline eKYC XML</Label>
                <Input
                  id="xml-file"
                  type="file"
                  accept=".xml"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="h-16 pl-6 pr-6 rounded-2xl border-[#E4E4E7] bg-[#FAFAFB] focus:bg-white focus:border-[#18181B] transition-all text-sm file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:uppercase file:tracking-widest file:bg-[#18181B] file:text-white cursor-pointer"
                  required
                />
                <p className="text-[11px] text-[#71717A] leading-relaxed font-medium ml-1">
                  The most secure method. Download from{" "}
                  <a href="https://myaadhaar.uidai.gov.in/offline-ekyc" target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold underline">
                    UIDAI Portal
                  </a>
                  {" "}and upload the generated XML file here.
                </p>
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#18181B] text-white text-[13px] font-black uppercase tracking-widest h-16 rounded-2xl hover:bg-black transition-all shadow-xl hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-40"
              >
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Processing XML…</> : "Secure XML Handshake"}
              </button>
            </form>
          )}

          {mode === "demo" && (
            <form onSubmit={submitDemo} className="grid gap-8">
              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-5 py-4 text-[11px] text-amber-700 font-black uppercase tracking-wider flex items-center gap-3">
                <FlaskConical className="h-4 w-4 shrink-0" />
                Laboratory Test Environment — No official verification.
              </div>
              <div className="grid gap-4">
                <Label htmlFor="demo-name" className="text-[11px] font-black uppercase tracking-[0.2em] text-[#A1A1AA] ml-1">Full Legal Name</Label>
                <Input
                  id="demo-name"
                  placeholder="e.g. ARYA SHARMA"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  className="h-16 pl-6 pr-6 rounded-2xl border-[#E4E4E7] bg-[#FAFAFB] focus:bg-white focus:border-[#18181B] transition-all text-lg font-bold placeholder:text-[#D1D1D4]"
                  required
                />
              </div>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-[#18181B] text-white text-[13px] font-black uppercase tracking-widest h-16 rounded-2xl hover:bg-black transition-all shadow-xl hover:shadow-black/20 hover:-translate-y-1 active:translate-y-0 disabled:opacity-40"
              >
                {loading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin inline-block" /> Verifying Demo…</> : "Continue with Simulation"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
