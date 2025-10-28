import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { RoleSelection } from "@/components/auth/role-selection"

export default async function HomePage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    // Show landing page for non-authenticated users
    return <LandingPage />
  }

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, aadhaar_verified")
    .eq("user_id", user.id)
    .maybeSingle()

  // Redirect based on existing role
  if (profile?.role === "employer_admin") {
    redirect("/recruiter/dashboard")
  } else if (profile?.role === "job_seeker") {
    redirect("/employee/dashboard")
  } else if (profile?.role === "institution") {
    redirect("/institution/dashboard")
  }

  // If no role is set, show role selection
  return <RoleSelection />
}

function LandingPage() {
  return (
    <main className="min-h-dvh bg-background">
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <span className="text-primary font-semibold">SH</span>
          </div>
          <span className="font-medium">Safe Hire</span>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/sign-in" className="text-sm text-muted-foreground hover:text-foreground">
            Sign In
          </Link>
          <Button asChild>
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </nav>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <p className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs">
            Trusted Digital Identity
          </p>
          <h1 className="mt-4 text-pretty text-4xl md:text-5xl font-semibold">
            Making Hiring <span className="text-primary">Safe</span> and <span className="text-primary">Easy</span>
          </h1>
          <p className="mt-4 text-muted-foreground max-w-prose">
            Eliminate hiring fraud with Aadhaar-verified digital identities. Create your Safe Hire ID and share
            verifiable credentials with employers.
          </p>
          <div className="mt-8 flex gap-3">
            <Button asChild>
              <Link href="/sign-up">Create Safe Hire ID</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/sign-in">For Employers</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/company/check">Check Company Authenticity</Link>
            </Button>
          </div>
        </div>
        <div className="rounded-3xl border border-border bg-card/30 p-6">
          <div className="text-sm text-muted-foreground">Safe Hire ID</div>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-secondary/40 p-4">
              <div className="text-xs text-muted-foreground">Name</div>
              <div className="mt-1 font-medium">Priya Sharma</div>
            </div>
            <div className="rounded-2xl bg-secondary/40 p-4">
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-1 text-green-400">Verified</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
