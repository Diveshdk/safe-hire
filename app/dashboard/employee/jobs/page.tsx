import { JobsSection } from "@/components/dashboard/jobs"

export default function JobsPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Post & Manage Jobs</h1>
        <p className="text-muted-foreground mt-1 text-sm">Create new job postings and manage existing ones.</p>
      </div>
      <JobsSection />
    </div>
  )
}
