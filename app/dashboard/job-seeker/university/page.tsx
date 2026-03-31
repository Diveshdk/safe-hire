import { UniversityResultsSection } from "@/components/dashboard/university-results-section"

export default function UniversityPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">University Results</h1>
        <p className="text-muted-foreground mt-1 text-sm">View your verified academic records and university results.</p>
      </div>
      <UniversityResultsSection />
    </div>
  )
}
