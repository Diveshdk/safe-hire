"use client"

import { LogInWithAnonAadhaar, useAnonAadhaar } from "@anon-aadhaar/react"
import { useEffect, useState } from "react"
import { CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AnonAadhaarVerifyProps {
  onVerified: (proof: any) => void
  onSkip?: () => void
}

export function AnonAadhaarVerify({ onVerified, onSkip }: AnonAadhaarVerifyProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="h-20 animate-pulse bg-muted rounded-lg" />

  return <AnonAadhaarInner onVerified={onVerified} onSkip={onSkip} />
}

function AnonAadhaarInner({ onVerified, onSkip }: AnonAadhaarVerifyProps) {
  const [anonAadhaar] = useAnonAadhaar()
  const [hasVerified, setHasVerified] = useState(false)

  useEffect(() => {
    if (anonAadhaar?.status === "logged-in" && !hasVerified) {
      setHasVerified(true)
      onVerified(anonAadhaar)
    }
  }, [anonAadhaar, hasVerified, onVerified])

  // Generate nullifier seed - in production, use env variable
  const nullifierSeed = BigInt(224050376795949629440000)

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 rounded-lg bg-primary/5 p-4 border border-primary/20">
        <ShieldCheck className="h-5 w-5 text-primary mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-sm font-medium">Anonymous Aadhaar Verification Required</p>
          <p className="text-xs text-muted-foreground">
            Verify your identity privately using zero-knowledge proofs. Your Aadhaar details remain anonymous and secure.
          </p>
        </div>
      </div>

      {anonAadhaar?.status === "logged-out" && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground text-center">
            Upload your Aadhaar QR code or PDF.
          </p>
          <div className="flex justify-center">
            <LogInWithAnonAadhaar 
              nullifierSeed={nullifierSeed}
              fieldsToReveal={["revealAgeAbove18"]}
            />
          </div>
        </div>
      )}

      {anonAadhaar?.status === "logging-in" && (
        <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4 justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm">Generating Zero-Knowledge proof...</p>
        </div>
      )}

      {anonAadhaar?.status === "logged-in" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 rounded-lg bg-green-500/10 p-4 border border-green-500/20">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm font-medium text-green-500">Verification Successful</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Your identity has been verified anonymously.
              </p>
            </div>
          </div>
        </div>
      )}

      {onSkip && anonAadhaar?.status !== "logged-in" && (
        <div className="pt-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-2 italic">Developer? Use Demo mode for testing.</p>
          <Button
            type="button"
            variant="ghost"
            onClick={onSkip}
            className="w-full text-xs h-8"
          >
            Skip for now (Demo mode)
          </Button>
        </div>
      )}
    </div>
  )
}
