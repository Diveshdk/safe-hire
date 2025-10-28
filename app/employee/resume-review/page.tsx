import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EmployeeNavbar } from "@/components/employee/navbar"
import { AiResumeReviewer } from "@/components/dashboard/ai-resume-reviewer"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function ResumeReviewPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "job_seeker") {
    redirect("/")
  }

  return (
    <main className="min-h-dvh bg-background">
      <EmployeeNavbar profile={profile} />
      
      <section className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/employee/dashboard">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
          </div>
          <h1 className="text-3xl font-bold">AI Resume Review</h1>
          <p className="text-muted-foreground mt-1">
            Get professional AI-powered feedback on your resume to improve your job application success rate.
          </p>
        </div>

        <AiResumeReviewer />
      </section>
    </main>
  )
}
