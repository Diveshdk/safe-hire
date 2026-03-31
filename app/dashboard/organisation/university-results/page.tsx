import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { UniversityResultUploader } from "@/components/dashboard/university-result-uploader"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function UniversityResultsPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "organisation") redirect("/dashboard")

  return (
    <main className="min-h-dvh bg-background">
      <div className="container max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/organisation">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold">University Results Management</h1>
          <p className="text-muted-foreground mt-1">
            Submit and manage academic results with principal verification
          </p>
        </div>

        {/* Result Uploader */}
        <UniversityResultUploader />
      </div>
    </main>
  )
}
