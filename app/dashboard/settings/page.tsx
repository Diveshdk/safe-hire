import { getSupabaseServer } from "@/lib/supabase/server"
import { ShieldCheck, Trash2, ShieldAlert, Lock, Info } from "lucide-react"
import { redirect } from "next/navigation"
import { SettingsClient } from "./settings-client"
import { CertificateNameSettings } from "../../../components/dashboard/CertificateNameSettings"

export default async function SettingsPage() {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("aadhaar_verified, aadhaar_full_name, safe_hire_id, certificate_name")
    .eq("user_id", user.id)
    .single()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-black text-[#18181B] tracking-tight">Account Settings</h1>
        <p className="text-[#71717A] text-sm mt-1">Manage your privacy, identity, and security preferences.</p>
      </div>

      <div className="grid gap-6">
        {/* Identity & Privacy Section */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] overflow-hidden shadow-sm">
          <div className="p-6 border-b border-[#F4F4F6] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-bold text-[#18181B]">Identity & Verification</h2>
                <p className="text-[11px] text-[#A1A1AA] font-medium uppercase tracking-wider">DPDPA 2023 Compliance</p>
              </div>
            </div>
            {profile?.aadhaar_verified && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-100 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            )}
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className="mt-1">
                <Info className="h-4 w-4 text-[#71717A]" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-[#18181B]">How your data is handled</p>
                <p className="text-xs text-[#71717A] leading-relaxed">
                  SafeHire follows strict data minimization principles. We do not store your full Aadhaar card or number. 
                  Only your verification status and an irreversible cryptographic hash of your identity are kept to prevent platform fraud.
                </p>
              </div>
            </div>

            {profile?.aadhaar_verified ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Right to Erasure</h3>
                    <p className="text-xs text-amber-800/80 mt-1 leading-relaxed">
                      Under Section 12 of the DPDPA 2023, you have the right to request the erasure of your personal identity data. 
                      Erasing your identity will remove your <strong>Verified</strong> badge and your name from our identity records.
                    </p>
                    <p className="text-[10px] font-bold text-amber-900/60 mt-2 uppercase tracking-widest">
                      Note: To prevent platform abuse, an anonymized hash of your identity will remain blacklisted.
                    </p>
                  </div>
                </div>
                
                <SettingsClient />
              </div>
            ) : (
              <div className="bg-[#F9F9FB] rounded-xl p-4 text-center border border-dashed border-[#E4E4E7]">
                <p className="text-xs text-[#71717A] font-medium">You haven't verified your identity yet.</p>
                <a href="/dashboard/job-seeker" className="text-xs font-bold text-[#18181B] underline mt-1 inline-block">Verify now to build trust</a>
              </div>
            )}
          </div>

          <div className="px-6 pb-6 pt-0 border-t border-[#F4F4F6]">
            <CertificateNameSettings initialName={profile?.certificate_name || profile?.aadhaar_full_name || ""} />
          </div>
        </div>

        {/* Security Section Placeholder */}
        <div className="bg-white rounded-2xl border border-[#E4E4E7] p-6 flex items-center justify-between opacity-60">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-[#F4F4F6] flex items-center justify-center">
              <Lock className="h-5 w-5 text-[#71717A]" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#18181B]">Two-Factor Authentication</p>
              <p className="text-xs text-[#A1A1AA]">Coming soon to all accounts.</p>
            </div>
          </div>
          <div className="h-6 w-10 rounded-full bg-[#E4E4E7]" />
        </div>
      </div>
    </div>
  )
}
