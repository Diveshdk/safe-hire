"use client"

import { useState, useEffect } from "react"
import { ShieldCheck, X, ArrowRight, Check } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { AadhaarVerificationForm } from "./aadhaar-verification-form"
import { useRouter } from "next/navigation"

export function VerificationPrompt({ profile }: { profile: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const router = useRouter()

  useEffect(() => {
    if (!profile || profile.aadhaar_verified) return

    // Check if dismissed in last 24 hours
    const lastDismissed = localStorage.getItem("aadhaar_prompt_dismissed")
    const now = Date.now()
    if (lastDismissed && now - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
      return
    }

    // Show after 5 seconds to be less intrusive and let user see the dashboard first
    const timer = setTimeout(() => setIsOpen(true), 5000)
    return () => clearTimeout(timer)
  }, [profile])

  const handleDismiss = () => {
    localStorage.setItem("aadhaar_prompt_dismissed", Date.now().toString())
    setIsOpen(false)
  }

  const handleSuccess = async (data: { fullName: string; last4: string | null }) => {
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

  if (!profile || profile.aadhaar_verified) return null

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[420px] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
        <div className="relative">
          {/* Header Image/Background */}
          <div className="h-40 bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 flex flex-wrap gap-4 p-4">
              {Array.from({ length: 24 }).map((_, i) => (
                <ShieldCheck key={i} className="h-8 w-8 text-white rotate-12" />
              ))}
            </div>
            
            <div className="relative z-10 flex flex-col items-center gap-3">
              <div className="h-20 w-20 rounded-3xl bg-white flex items-center justify-center text-blue-600 shadow-2xl animate-in zoom-in-50 duration-500">
                <ShieldCheck className="h-12 w-12" />
              </div>
              <div className="flex items-center gap-1.5 bg-blue-500/30 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                <div className="bg-white rounded-full p-0.5">
                  <Check className="h-2.5 w-2.5 text-blue-600 stroke-[4]" />
                </div>
                <span className="text-[10px] font-black text-white uppercase tracking-widest textShadow">Verified Priority</span>
              </div>
            </div>

            <button 
              onClick={handleDismiss}
              className="absolute top-4 right-4 h-8 w-8 rounded-full bg-black/20 text-white flex items-center justify-center hover:bg-black/40 transition-all backdrop-blur-md z-20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-8">
            {!showForm ? (
              <div className="space-y-6 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black tracking-tight text-[#18181B]">Get Verified with Aadhaar</h2>
                  <p className="text-sm text-[#71717A] leading-relaxed px-2">
                    Verified users get <strong>3x more visibility</strong> and higher trust from recruiters. Get your blue checkmark today.
                  </p>
                </div>

                <div className="grid gap-3 pt-2">
                  <button
                    onClick={() => setShowForm(true)}
                    className="w-full bg-blue-600 text-white font-bold h-14 rounded-2xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95"
                  >
                    Verify Aadhaar Now <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="w-full text-[10px] font-black uppercase tracking-[0.15em] text-[#A1A1AA] h-12 rounded-xl border border-dashed border-[#E4E4E7] hover:border-[#A1A1AA] hover:text-[#71717A] hover:bg-[#F9F9FB] transition-all flex items-center justify-center gap-2"
                  >
                    Skip Verification Now
                  </button>
                </div>
              </div>
            ) : (
              <div className="animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-3 mb-6">
                  <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-full bg-[#F4F4F6] flex items-center justify-center hover:bg-[#E4E4E7] transition-all">
                    <X className="h-4 w-4 text-[#71717A]" />
                  </button>
                  <h3 className="text-lg font-black text-[#18181B]">Identity Verification</h3>
                </div>
                <AadhaarVerificationForm 
                  role={profile?.role || "job_seeker"} 
                  onSuccess={handleSuccess} 
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
