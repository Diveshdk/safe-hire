import { ApplicantsPanel } from "@/components/dashboard/applicants-panel"

export default function ApplicantsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Applicants</h1>
        <p className="text-muted-foreground mt-1 text-sm">Review applications and manage candidates for your job postings.</p>
      </div>
      <ApplicantsPanel />
    </div>
  )
}
