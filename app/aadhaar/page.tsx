"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { AadhaarVerification } from "@/components/aadhaar-verification"
import { parseApiResponse } from "@/lib/api-utils"

type VerifyResponse = { success: boolean; fullName?: string; message?: string }

export default function AadhaarOnboardingPage() {
  const [aadhaarNumber, setAadhaarNumber] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const router = useRouter()

  const handleVerificationSuccess = async (proof: any) => {
    setLoading(true)
    setMessage(null)

    try {
      // Send the verification result to your API
      const res = await fetch("/api/verify/aadhaar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          mode: "anon-aadhaar", 
          proof: proof,
          aadhaarNumber: aadhaarNumber 
        }),
      })
      
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
        setMessage(`✅ Aadhaar verification successful! Redirecting to dashboard...`)
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
      console.error("Anon Aadhaar verification error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh bg-background flex items-center justify-center px-4">
      <div className="max-w-lg w-full">
        <h1 className="text-3xl font-semibold text-center">Aadhaar Verification</h1>
        <p className="text-center text-muted-foreground mt-2 mb-6">
          Verify your identity using zero-knowledge proofs. Your privacy is protected.
        </p>

        <AadhaarVerification 
          aadhaarNumber={aadhaarNumber}
          onVerified={handleVerificationSuccess}
        />

        {loading && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md border border-blue-200">
            <div className="flex items-center space-x-2">
              <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Processing verification...</span>
            </div>
          </div>
        )}

        {message && (
          <div className={`mt-4 text-sm p-3 rounded-md ${
            message.includes('✅') 
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : message.includes('❌')
              ? 'bg-red-50 text-red-700 border border-red-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            className="flex-1" 
            onClick={() => router.push("/dashboard")}
            disabled={loading}
          >
            Verify Later
          </Button>
        </div>

        <div className="mt-6 text-xs text-muted-foreground text-center space-y-1">
          <p>🔐 <strong>Privacy First:</strong> Uses zero-knowledge proofs</p>
          <p>🚫 <strong>No Data Storage:</strong> Your Aadhaar details never leave your device</p>
          <p>✅ <strong>Cryptographic Verification:</strong> Mathematically proven authenticity</p>
        </div>

        <div className="mt-4 text-center">
          <a
            href="https://github.com/anon-aadhaar/anon-aadhaar"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-primary underline"
          >
            Learn more about Anon Aadhaar →
          </a>
        </div>
      </div>
    </main>
  )
}
