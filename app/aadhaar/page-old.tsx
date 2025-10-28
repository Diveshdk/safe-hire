"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { parseApiResponse } from "@/lib/api-utils"

type VerifyResponse = { success: boolean; fullName?: string; message?: string }

export default function AadhaarOnboardingPage() {
  const defaultMode = (process.env.NEXT_PUBLIC_DEFAULT_AADHAAR_MODE || "offline-xml") as "offline-xml" | "demo" | "apisetu"
  const [mode, setMode] = useState<"offline-xml" | "demo" | "apisetu">(defaultMode)
  const [file, setFile] = useState<File | null>(null)
  const [demoName, setDemoName] = useState("")
  const [aadhaarNumber, setAadhaarNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [txnId, setTxnId] = useState("")
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  async function submitOfflineXml(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setMessage("Please choose your Aadhaar XML file.")
      return
    }
    
    // Validate file type and size
    if (!file.name.toLowerCase().endsWith('.xml')) {
      setMessage("Please upload a valid XML file.")
      return
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setMessage("File size too large. Please upload a file smaller than 5MB.")
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch("/api/verify/aadhaar?mode=offline-xml", { method: "POST", body: form })
      
      // Check if we got an HTML response (likely a redirect or error page)
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        setMessage("❌ Authentication error. Please refresh the page and try again.")
        console.error("Got HTML response instead of JSON, likely authentication issue")
        return
      }
      
      const data = await parseApiResponse<VerifyResponse>(res)
      
      if (res.status === 401) {
        setMessage("You need to sign in to verify your Aadhaar. Redirecting to Sign In…")
        setTimeout(() => router.replace("/sign-in"), 800)
        return
      }
      
      if (data.success) {
        setMessage(`✅ Successfully verified as ${data.fullName}! Redirecting...`)
        setTimeout(() => router.replace("/dashboard"), 1500)
      } else {
        setMessage(`❌ ${data.message || "Verification failed"}`)
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ""
      if (errorMessage.includes("text/html")) {
        setMessage("❌ Authentication error. Please refresh the page and sign in again.")
      } else {
        setMessage(`❌ ${errorMessage || "Network error. Please check your connection and try again."}`)
      }
      console.error("Verification error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function submitDemo(e: React.FormEvent) {
    e.preventDefault()
    
    if (!demoName.trim()) {
      setMessage("Please enter a name for demo verification.")
      return
    }
    
    if (demoName.trim().length < 3) {
      setMessage("Name must be at least 3 characters long.")
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch("/api/verify/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "demo", fullName: demoName.trim() }),
      })
      
      console.log("Response status:", res.status)
      console.log("Response headers:", Object.fromEntries(res.headers.entries()))
      
      // Check if we got an HTML response (likely a redirect or error page)
      const contentType = res.headers.get("content-type")
      if (contentType && contentType.includes("text/html")) {
        // This likely means we're not authenticated or there's a redirect
        setMessage("❌ Authentication error. Please refresh the page and try again.")
        console.error("Got HTML response instead of JSON, likely authentication issue")
        return
      }
      
      const data = await parseApiResponse<VerifyResponse>(res)
      
      if (res.status === 401) {
        setMessage("You need to sign in to verify your Aadhaar. Redirecting to Sign In…")
        setTimeout(() => router.replace("/sign-in"), 800)
        return
      }
      
      if (data.success) {
        setMessage(`✅ Demo verification successful as ${data.fullName}! Redirecting...`)
        setTimeout(() => router.replace("/dashboard"), 1500)
      } else {
        setMessage(`❌ ${data.message || "Demo verification failed"}`)
      }
    } catch (error) {
      // Check if the error mentions HTML response
      const errorMessage = error instanceof Error ? error.message : ""
      if (errorMessage.includes("text/html")) {
        setMessage("❌ Authentication error. Please refresh the page and sign in again.")
      } else {
        setMessage(`❌ ${errorMessage || "Network error. Please check your connection and try again."}`)
      }
      console.error("Demo verification error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function submitApiSetuInit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!aadhaarNumber.trim() || aadhaarNumber.length !== 12) {
      setMessage("Please enter a valid 12-digit Aadhaar number.")
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch("/api/verify/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "apisetu", step: "init", uid: aadhaarNumber }),
      })
      const data = await parseApiResponse<VerifyResponse & { txnId?: string }>(res)
      
      if (res.status === 401) {
        setMessage("You need to sign in to verify your Aadhaar. Redirecting to Sign In…")
        setTimeout(() => router.replace("/sign-in"), 800)
        return
      }
      
      if (data.success && data.txnId) {
        setTxnId(data.txnId)
        setOtpSent(true)
        setMessage("✅ OTP sent to your registered mobile number. Please enter the OTP below.")
      } else {
        setMessage(`❌ ${data.message || "Failed to send OTP"}`)
      }
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : "Network error. Please check your connection and try again."}`)
      console.error("API Setu init error:", error)
    } finally {
      setLoading(false)
    }
  }

  async function submitApiSetuConfirm(e: React.FormEvent) {
    e.preventDefault()
    
    if (!otp.trim() || otp.length !== 6) {
      setMessage("Please enter a valid 6-digit OTP.")
      return
    }
    
    setLoading(true)
    setMessage(null)
    
    try {
      const res = await fetch("/api/verify/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "apisetu", step: "confirm", txnId, otp }),
      })
      const data = await parseApiResponse<VerifyResponse>(res)
      
      if (data.success) {
        setMessage(`✅ Successfully verified as ${data.fullName}! Redirecting...`)
        setTimeout(() => router.replace("/dashboard"), 1500)
      } else {
        setMessage(`❌ ${data.message || "OTP verification failed"}`)
      }
    } catch (error) {
      setMessage(`❌ ${error instanceof Error ? error.message : "Network error. Please check your connection and try again."}`)
      console.error("API Setu confirm error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-semibold text-center">Aadhaar Verification</h1>
        <p className="text-center text-muted-foreground mt-2">
          We only extract your full name to match with other documents.
        </p>

        <div className="mt-6 flex gap-2 justify-center">
          <Button
            type="button"
            variant={mode === "offline-xml" ? "default" : "secondary"}
            onClick={() => setMode("offline-xml")}
          >
            Offline XML (UIDAI)
          </Button>
          <Button
            type="button"
            variant={mode === "apisetu" ? "default" : "secondary"}
            onClick={() => setMode("apisetu")}
          >
            API Setu (OTP)
          </Button>
          <Button type="button" variant={mode === "demo" ? "default" : "secondary"} onClick={() => setMode("demo")}>
            Demo
          </Button>
        </div>
        <p className="mt-2 text-center text-xs">
          <a
            href="https://uidai.gov.in/en/307-faqs/aadhaar-online-services/aadhaar-paperless-offline-e-kyc/10731-how-to-generate-offline-aadhaar-2.html"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline"
          >
            How to generate Offline eKYC? (UIDAI)
          </a>
        </p>

        {mode === "offline-xml" ? (
          <form
            onSubmit={submitOfflineXml}
            className="mt-8 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur"
          >
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="file">Upload Aadhaar XML</Label>
                <Input
                  id="file"
                  type="file"
                  accept=".xml"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Verifying…" : "Verify"}
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/dashboard")}>
                  Verify later
                </Button>
              </div>
              {message && (
                <div className={`text-sm mt-1 p-3 rounded-md ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : message.includes('❌')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message}
                </div>
              )}
              <p className="text-xs mt-2 text-muted-foreground">
                Download the password-protected ZIP from the UIDAI portal, extract the XML using your share code on your
                computer, then upload the extracted XML file here. We do not store your Aadhaar number.
              </p>
              <p className="text-xs mt-2">
                <a
                  href="https://myaadhaar.uidai.gov.in/offline-ekyc"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  Generate your Aadhaar Offline eKYC XML on the official UIDAI website
                </a>
              </p>
            </div>
          </form>
        ) : mode === "apisetu" ? (
          <div className="mt-8 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
            {!otpSent ? (
              <form onSubmit={submitApiSetuInit}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="aadhaar">Aadhaar Number</Label>
                    <Input
                      id="aadhaar"
                      placeholder="XXXX XXXX XXXX"
                      value={aadhaarNumber}
                      onChange={(e) => setAadhaarNumber(e.target.value.replace(/\D/g, '').slice(0, 12))}
                      maxLength={12}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Sending OTP…" : "Send OTP"}
                    </Button>
                    <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/dashboard")}>
                      Verify later
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <form onSubmit={submitApiSetuConfirm}>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="otp">Enter OTP</Label>
                    <Input
                      id="otp"
                      placeholder="XXXXXX"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? "Verifying…" : "Verify OTP"}
                    </Button>
                    <Button type="button" variant="secondary" onClick={() => {
                      setOtpSent(false)
                      setOtp("")
                      setTxnId("")
                    }}>
                      Resend OTP
                    </Button>
                  </div>
                </div>
              </form>
            )}
            {message && (
              <div className={`text-sm mt-3 p-3 rounded-md ${
                message.includes('✅') 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : message.includes('❌')
                  ? 'bg-red-50 text-red-700 border border-red-200'
                  : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {message}
              </div>
            )}
            <p className="text-xs mt-2 text-muted-foreground">
              Note: API Setu integration requires valid API credentials. This mode may not work in the demo environment.
            </p>
          </div>
        ) : (
          <form onSubmit={submitDemo} className="mt-8 rounded-2xl border border-border bg-card/40 p-6 backdrop-blur">
            <div className="grid gap-2">
              <Label htmlFor="name">Demo Full Name</Label>
              <Input
                id="name"
                placeholder="Priya Sharma"
                value={demoName}
                onChange={(e) => setDemoName(e.target.value)}
                required
              />
              <div className="flex gap-2 mt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? "Verifying…" : "Verify in Demo"}
                </Button>
                <Button type="button" variant="secondary" className="flex-1" onClick={() => router.push("/dashboard")}>
                  Verify later
                </Button>
              </div>
              {message && (
                <div className={`text-sm mt-3 p-3 rounded-md ${
                  message.includes('✅') 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : message.includes('❌')
                    ? 'bg-red-50 text-red-700 border border-red-200'
                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                }`}>
                  {message}
                </div>
              )}
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
