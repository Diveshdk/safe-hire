import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function EmployeeLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/sign-in")
  }

  // Check if user has job seeker role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.role !== "job_seeker") {
    redirect("/")
  }

  return <>{children}</>
}
