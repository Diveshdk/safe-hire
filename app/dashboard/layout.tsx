import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardShell } from "@/components/dashboard/dashboard-shell"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role")
    .eq("user_id", user.id)
    .maybeSingle()

  const displayName = profile?.aadhaar_full_name || profile?.full_name || "User"
  const role = profile?.role || "job_seeker"

  return (
    <DashboardShell
      role={role}
      displayName={displayName}
      safeHireId={profile?.safe_hire_id || null}
      aadhaarVerified={!!profile?.aadhaar_verified}
    >
      {children}
    </DashboardShell>
  )
}
