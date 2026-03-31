import { getSupabaseServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ShieldCheck, User, Briefcase, Building2, Award, GraduationCap, FileText, ExternalLink } from "lucide-react"
import { AchievementsCertificates } from "@/components/dashboard/achievements-certificates"
import { UniversityResultsSection } from "@/components/dashboard/university-results-section"
import Link from "next/link"

const ROLE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  employee: { label: "Employee", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Briefcase className="h-3.5 w-3.5" /> },
  employer_admin: { label: "Employer", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Briefcase className="h-3.5 w-3.5" /> },
  job_seeker: { label: "Job Seeker", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: <User className="h-3.5 w-3.5" /> },
  organisation: { label: "Organisation", color: "bg-purple-500/10 text-purple-600 border-purple-500/20", icon: <Building2 className="h-3.5 w-3.5" /> },
}

async function getProfileData(safeHireId: string) {
  const supabase = getSupabaseServer()
  const { data: profile } = await supabase
    .from("profiles")
    .select("user_id, full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role")
    .eq("safe_hire_id", safeHireId)
    .maybeSingle()
  return profile
}

async function getDocuments(userId: string) {
  const supabase = getSupabaseServer()
  const { data } = await supabase
    .from("documents")
    .select("id, title, doc_type, verification_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return data || []
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const profile = await getProfileData(params.id)
  if (!profile) notFound()

  const displayName = profile.full_name || profile.aadhaar_full_name || "User"
  const roleMeta = ROLE_META[profile.role] || ROLE_META.job_seeker
  const documents = await getDocuments(profile.user_id)

  const initials = displayName
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const resumeDoc = documents.find((d: any) => d.doc_type === "resume")

  return (
    <main className="min-h-dvh bg-background">
      {/* Header */}
      <header className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground text-xs font-bold">SH</span>
          </div>
          <span className="font-semibold">Safe Hire</span>
        </Link>
      </header>

      {/* Profile Hero */}
      <section className="max-w-4xl mx-auto px-6">
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          {/* Banner */}
          <div className="h-32 bg-gradient-to-r from-primary/15 via-primary/8 to-primary/5" />

          {/* Profile info */}
          <div className="px-6 pb-6">
            <div className="flex items-end gap-4 -mt-12">
              <div className="h-24 w-24 rounded-2xl bg-primary/10 border-4 border-card flex items-center justify-center shadow-sm">
                <span className="text-primary text-2xl font-bold">{initials}</span>
              </div>
              <div className="pb-1 flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold">{displayName}</h1>
                  {profile.aadhaar_verified && (
                    <span className="flex items-center gap-1 text-xs text-green-600 bg-green-500/10 border border-green-500/20 rounded-full px-2 py-0.5">
                      <ShieldCheck className="h-3.5 w-3.5" /> Aadhaar Verified
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-xs font-medium rounded-full px-2 py-0.5 border ${roleMeta.color}`}>
                    {roleMeta.icon} {roleMeta.label}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    SafeHire ID: <span className="font-mono font-semibold text-primary">{profile.safe_hire_id}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            {resumeDoc && (
              <div className="mt-4 flex gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-1.5">
                  <FileText className="h-3.5 w-3.5" /> Resume uploaded
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Tabbed content sections */}
      <section className="max-w-4xl mx-auto px-6 py-8 grid gap-8">
        {/* Documents */}
        {documents.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-primary" /> Documents
            </h2>
            <div className="grid gap-3">
              {documents.map((doc: any) => (
                <div key={doc.id} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title || doc.doc_type}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {doc.doc_type.replace("_", " ")} · {new Date(doc.created_at).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      doc.verification_status === "verified"
                        ? "text-green-600 bg-green-500/10"
                        : doc.verification_status === "flagged"
                        ? "text-red-600 bg-red-500/10"
                        : "text-muted-foreground bg-muted/50"
                    }`}
                  >
                    {doc.verification_status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements & Certificates */}
        <AchievementsCertificates userId={profile.user_id} />

        {/* University Results */}
        <UniversityResultsSection userId={profile.user_id} />
      </section>
    </main>
  )
}
