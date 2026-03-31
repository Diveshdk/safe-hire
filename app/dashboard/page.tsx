import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

// Role-based router — redirects to the correct dashboard sub-page
export default async function DashboardRootPage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, aadhaar_verified")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!profile?.aadhaar_verified) redirect("/aadhaar")

  if (profile?.role === "employer_admin" || profile?.role === "employee") redirect("/dashboard/employee")
  if (profile?.role === "organisation") redirect("/dashboard/organisation")

  redirect("/dashboard/job-seeker")
}
