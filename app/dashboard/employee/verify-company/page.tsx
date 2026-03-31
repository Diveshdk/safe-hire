import { CompanyVerifyCard } from "@/components/dashboard/company-verify-card"

export default function VerifyCompanyPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Company Verification</h1>
        <p className="text-muted-foreground mt-1 text-sm">Verify your company using CIN or PAN to start posting jobs.</p>
      </div>
      <CompanyVerifyCard />
    </div>
  )
}
