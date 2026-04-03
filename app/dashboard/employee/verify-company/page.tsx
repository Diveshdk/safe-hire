import { CompanySearch } from "@/components/dashboard/company-search"
import { ShieldCheck } from "lucide-react"

export default function VerifyCompanyPage() {
  return (
    <div className="grid gap-10 max-w-4xl mx-auto py-4">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          SafeHire Corporate Authenticity Engine
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-[#18181B] tracking-tight">
          Verify Your Business
        </h1>
        <p className="text-lg text-[#71717A] max-w-2xl mx-auto leading-relaxed">
          Search for your company to generate an official <strong>SafeHire Authenticity Report</strong>. 
          Use this to prove your business legitimacy to potential hires.
        </p>
      </div>

      <div className="bg-[#F4F4F6]/50 rounded-[40px] p-2">
        <div className="bg-white rounded-[32px] border border-[#E4E4E7] shadow-xl p-8 md:p-12">
          <CompanySearch />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 opacity-60">
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-6 text-sm">
          <h4 className="font-bold text-[#18181B] mb-2 uppercase tracking-wide text-xs">Official Registration</h4>
          <p className="text-[#71717A] leading-relaxed italic">
            Verification is performed against the MCA registry and official corporate filings. 
            Aadhaar-linked accounts ensure true ownership audits.
          </p>
        </div>
        <div className="bg-white rounded-3xl border border-[#E4E4E7] p-6 text-sm">
          <h4 className="font-bold text-[#18181B] mb-2 uppercase tracking-wide text-xs">AI & Markets Data</h4>
          <p className="text-[#71717A] leading-relaxed italic">
            We supplement official records with real-time stock exchange listing status 
            and market capitalization for publicly traded firms.
          </p>
        </div>
      </div>
    </div>
  )
}
