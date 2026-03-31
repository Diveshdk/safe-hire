import { AchievementsCertificates } from "@/components/dashboard/achievements-certificates"

export default function CertificatesPage() {
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-2xl font-bold">Achievements & Certificates</h1>
        <p className="text-muted-foreground mt-1 text-sm">View certificates earned from events, competitions, and organizations.</p>
      </div>
      <AchievementsCertificates />
    </div>
  )
}
