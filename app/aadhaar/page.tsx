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
    <main className="min-h-dvh bg-background flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15">
          <span className="text-primary text-xl font-semibold">SH</span>
        </div>
        <h1 className="text-3xl font-semibold text-center">Aadhaar Verification</h1>
        <p className="text-center text-muted-foreground mt-2 text-sm">
          Required to activate your account. We extract only your name to match with your documents.
        </p>

        {/* Mode tabs */}
        <div className="mt-6 flex gap-2 justify-center flex-wrap">
          {MODES.map(({ id, label, icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => { setMode(id); setFile(null); setMessage(null) }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-medium transition-all",
                mode === id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {icon} {label}
            </button>
          ))}
        </div>

        {/* Forms */}
        <div className="mt-6 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
          {message && (
            <div className={cn(
              "mb-4 rounded-lg px-3 py-2 text-sm",
              message.type === "error" ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-600"
            )}>
              {message.text}
            </div>
          )}

          {mode === "ocr" && (
            <form onSubmit={submitOcr} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="ocr-file">Aadhaar Card Image or PDF</Label>
                <Input
                  id="ocr-file"
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Upload a clear front-side photo of your Aadhaar card. We will extract your name and Aadhaar number automatically.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing OCR…</> : "Verify with OCR"}
              </Button>
            </form>
          )}

          {mode === "xml" && (
            <form onSubmit={submitXml} className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="xml-file">Aadhaar Offline eKYC XML</Label>
                <Input
                  id="xml-file"
                  type="file"
                  accept=".xml"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Download from{" "}
                  <a href="https://myaadhaar.uidai.gov.in/offline-ekyc" target="_blank" rel="noopener noreferrer" className="text-primary underline">
                    myaadhaar.uidai.gov.in
                  </a>
                  {" "}→ extract from ZIP → upload the .xml file here.
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Verify XML"}
              </Button>
            </form>
          )}

          {mode === "demo" && (
            <form onSubmit={submitDemo} className="grid gap-4">
              <div className="rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2 text-xs text-amber-600">
                🧪 Demo mode — for testing only. Does not verify a real Aadhaar.
              </div>
              <div className="grid gap-2">
                <Label htmlFor="demo-name">Your Full Name</Label>
                <Input
                  id="demo-name"
                  placeholder="Priya Sharma"
                  value={demoName}
                  onChange={(e) => setDemoName(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "Continue with Demo"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  )
}
