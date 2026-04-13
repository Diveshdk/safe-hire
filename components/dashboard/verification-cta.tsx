"use client"

import { useState } from "react"
import { ShieldCheck, ArrowRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AadhaarVerificationForm } from "./aadhaar-verification-form"
import { useRouter } from "next/navigation"

export function VerificationSettingsCTA({ role }: { role: string }) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleSuccess = async (data: { fullName: string; last4: string | null }) => {
    // Sync verification status to profile
    await fetch("/api/profile/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aadhaar_full_name: data.fullName,
        aadhaar_last4: data.last4,
        aadhaar_verified: true,
        certificate_name: data.fullName
      })
    })

    setIsOpen(false)
    router.refresh()
  }

  return (
    <>
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 shrink-0">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-[#18181B]">Get Verified with Aadhaar</h3>
            <p className="text-sm text-[#71717A] leading-relaxed">
              Verified users get a <span className="text-blue-600 font-bold italic">Blue Checkmark</span>, priority in recruiter searches, and increased visibility.
            </p>
            <button
              onClick={() => setIsOpen(true)}
              className="mt-4 flex items-center gap-2 bg-[#18181B] text-white px-5 py-2.5 rounded-full text-xs font-bold hover:bg-[#27272A] transition-all shadow-md active:scale-95"
            >
              Verify Aadhaar & Get Badge <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <div className="p-8">
            <DialogHeader className="mb-6">
              <DialogTitle className="text-2xl font-black tracking-tight text-[#18181B]">🔐 Get Verified</DialogTitle>
              <DialogDescription className="text-sm text-[#71717A]">
                Get noticed more by recruiters with a verified badge.
              </DialogDescription>
            </DialogHeader>
            <AadhaarVerificationForm 
              role={role} 
              onSuccess={handleSuccess} 
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
