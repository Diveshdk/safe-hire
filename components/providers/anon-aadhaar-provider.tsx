"use client"

import { AnonAadhaarProvider } from "@anon-aadhaar/react"
import type React from "react"

export function AnonAadhaarProviderWrapper({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AnonAadhaarProvider _useTestAadhaar={true}>
      {children}
    </AnonAadhaarProvider>
  )
}
