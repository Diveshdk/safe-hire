import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { EmployeeNavbar } from "@/components/employee/navbar"
import { OnboardingCheck } from "@/components/employee/onboarding-check"
import { EmployeeDashboardContent } from "@/components/employee/dashboard-content"

export default async function EmployeeDashboard() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Get user profile and verification status
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle()

  // If user hasn't completed onboarding (Aadhaar verification), show onboarding flow
  if (!profile?.aadhaar_verified || !profile?.safe_hire_id) {
    return (
      <main className="min-h-dvh bg-background">
        <EmployeeNavbar profile={profile} />
        <OnboardingCheck profile={profile} />
      </main>
    )
  }

  // Show main employee dashboard
  return (
    <main className="min-h-dvh bg-background">
      <EmployeeNavbar profile={profile} />
      <EmployeeDashboardContent profile={profile} />
    </main>
  )
}
