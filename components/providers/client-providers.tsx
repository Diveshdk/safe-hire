"use client"

import { AnonAadhaarProvider } from "@anon-aadhaar/react"
import { Toaster } from "@/components/ui/toaster"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <AnonAadhaarProvider _useTestAadhaar={true}>
      {children}
      <Toaster />
    </AnonAadhaarProvider>
  )
}
