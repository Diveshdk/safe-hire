"use client"

import useSWR from "swr"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { swrFetcher } from "@/lib/api-utils"

export default function AadhaarVerifyCard() {
  const { data, isLoading, error } = useSWR("/api/me/profile", swrFetcher)
  const verified = !!data?.aadhaar_verified
  
  if (isLoading) {
    return (
      <div className="rounded-lg border p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    )
  }
  
  if (error) {
    console.error("Failed to load profile:", error)
    return (
      <div className="rounded-lg border p-4 border-red-200 bg-red-50">
        <h3 className="text-lg font-semibold text-red-800">Error Loading Profile</h3>
        <p className="mt-1 text-sm text-red-600">
          Unable to check verification status. Please refresh the page.
        </p>
      </div>
    )
  }
  
  if (verified) return null

  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">Aadhaar verification</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify once to show a blue tick on your profile. You can also verify later.
      </p>
      <div className="mt-3 flex gap-2">
        <Button asChild>
          <Link href="/aadhaar">Verify now</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/dashboard">Verify later</Link>
        </Button>
      </div>
    </div>
  )
}
