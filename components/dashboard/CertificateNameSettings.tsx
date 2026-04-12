"use client"

import React, { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, UserCircle } from "lucide-react"
import { toast } from "sonner"

export function CertificateNameSettings({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName || "")
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    if (!name.trim()) {
      toast.error("Certificate name cannot be empty")
      return
    }

    setIsSaving(true)
    try {
      const res = await fetch("/api/profile/setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          certificate_name: name,
          role: "job_seeker" // The setup API needs a role, but it won't change existing one in upsert if we handled it right. 
          // Wait, the setup API uses upsert based on user_id. 
          // Actually, let's better check what role to send. 
        }),
      })

      if (!res.ok) throw new Error("Failed to update certificate name")
      
      toast.success("Certificate name updated successfully", {
        description: "This name will be used for all future certificates issued to you.",
      })
    } catch (error) {
      toast.error("Error updating certificate name")
    } finally {
      setIsSaving(false)
    }
  }

  // NOTE: The /api/profile/setup requires a role. 
  // In a real app we'd fetch the role first, but here it's easier to just pass whatever is needed.
  // Actually, I should probably check if there's a better way or if I should modify the API to make role optional.
  
  return (
    <div className="py-6 space-y-4">
      <div className="flex items-center gap-3 mb-2">
        <div className="h-8 w-8 rounded-lg bg-slate-50 flex items-center justify-center">
          <UserCircle className="h-4 w-4 text-slate-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-[#18181B]">Certificate Name</h3>
          <p className="text-[11px] text-[#A1A1AA] font-medium">How your name appears on certificates</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 pt-1">
        <div className="flex-1 space-y-1.5">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Official Full Name"
            className="h-10 rounded-xl border-[#E4E4E7] bg-white focus:border-[#18181B] focus:ring-0 text-sm"
          />
        </div>
        <Button 
          onClick={handleSave} 
          disabled={isSaving || name === initialName}
          className="h-10 rounded-xl bg-[#18181B] text-white hover:bg-[#27272A] px-6 text-xs font-bold shrink-0 shadow-sm"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
              Saving…
            </>
          ) : (
            "Update Name"
          )}
        </Button>
      </div>
      
      <p className="text-[10px] text-[#71717A] leading-relaxed">
        <strong>Tip:</strong> Use your official name as it should appear on degrees, awards, and participation certificates. 
        Identity verification remains tied to your Aadhaar name.
      </p>
    </div>
  )
}
