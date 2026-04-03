import { CompanySearch } from "@/components/dashboard/company-search"
import { ShieldCheck } from "lucide-react"

export default function JobSeekerVerifyCompanyPage() {
  return (
    <div className="grid gap-10 max-w-4xl mx-auto py-4 font-sans">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          Job Seeker Resource: Company Authenticity Check
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#18181B] tracking-tight">
          Verify Employer Legitimacy
        </h1>
        <p className="text-lg text-[#71717A] max-w-2xl mx-auto leading-relaxed">
          Before you apply or share your details, verify if a company is officially registered and active. 
          Protect yourself from hiring fraud.
        </p>
      </div>

      <div className="bg-[#F4F4F6]/50 rounded-[40px] p-2">
        <div className="bg-white rounded-[32px] border border-[#E4E4E7] shadow-xl p-8 md:p-12">
          {/* Job seekers use view-only mode */}
          <CompanySearch hideVerify={true} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 opacity-60">
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-6 text-sm">
          <h4 className="font-bold text-[#18181B] mb-2 uppercase tracking-wide text-xs">Aadhaar vs Corporate</h4>
          <p className="text-[#71717A] leading-relaxed italic">
            SafeHire verifies both the individual (via Aadhaar) and the company (via MCA) 
            to create a transparent, fraud-free hiring ecosystem.
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-6 text-sm">
          <h4 className="font-bold text-[#18181B] mb-2 uppercase tracking-wide text-xs">Verify Job Listings</h4>
          <p className="text-[#71717A] leading-relaxed italic">
            If a company is "Authenticity Verified" on SafeHire, it means their legal CIN 
            and operational status have been cryptographically linked to their profile.
          </p>
        </div>
      </div>
    </div>
  )
}
