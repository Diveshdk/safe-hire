import { CompanySearch } from "@/components/dashboard/company-search"
import { ShieldCheck } from "lucide-react"

export default function OrganisationVerifyCompanyPage() {
  return (
    <div className="grid gap-10 max-w-4xl mx-auto py-4 font-sans">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold px-4 py-2 rounded-full shadow-sm">
          <ShieldCheck className="h-4 w-4" />
          Organisation Resource: Company Discovery
        </div>
        <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold text-[#18181B] tracking-tight px-4">
          Verify Partner Legitimacy
        </h1>
        <p className="text-lg text-[#71717A] max-w-2xl mx-auto leading-relaxed">
          Verify the official registration status and MCA filings of potential partner organisations 
          across the corporate ecosystem.
        </p>
      </div>

      <div className="bg-[#F4F4F6]/50 rounded-[20px] sm:rounded-[40px] p-1 sm:p-2">
        <div className="bg-white rounded-[16px] sm:rounded-[32px] border border-[#E4E4E7] shadow-xl p-4 sm:p-8 md:p-12">
          {/* Organisations use view-only mode for checking others */}
          <CompanySearch hideVerify={true} />
        </div>
      </div>
    </div>
  )
}
