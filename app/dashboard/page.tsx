import { getSupabaseServer } from "@/lib/supabase/server"
import { CompanyVerifyCard } from "@/components/dashboard/company-verify-card"
import { JobsSection } from "@/components/dashboard/jobs"
import { AiResumeReviewer } from "@/components/dashboard/ai-resume-reviewer"
import { SignOutButton } from "@/components/auth/sign-out-button"
import AadhaarVerifyCard from "@/components/dashboard/aadhaar-verify-card"

export default async function DashboardPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role")
    .eq("user_id", user?.id)
    .maybeSingle()

  return (
    <main className="min-h-dvh bg-background">
      <header className="max-w-5xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-semibold">SH</span>
          </div>
          <span className="font-medium">Safe Hire</span>
        </div>
        <div>
          <SignOutButton />
        </div>
      </header>

      <section className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold">
          Welcome{profile?.aadhaar_full_name ? `, ${profile.aadhaar_full_name}` : ""}
        </h1>
        <p className="text-muted-foreground mt-2">
          Aadhaar verification: {profile?.aadhaar_verified ? "Verified" : "Not Verified"} • Safe Hire ID:{" "}
          <span className="font-mono">{profile?.safe_hire_id || "Generating…"}</span>
        </p>

        <div className="mt-8 grid gap-6">
          <AadhaarVerifyCard />
          <CompanyVerifyCard />
          <JobsSection />
          <AiResumeReviewer />
        </div>
      </section>
    </main>
  )
}
