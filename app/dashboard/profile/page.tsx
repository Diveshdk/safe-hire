import { getSupabaseServer } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export default async function MyProfilePage() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/sign-in")

  const { data: profile } = await supabase
    .from("profiles")
    .select("safe_hire_id")
    .eq("user_id", user.id)
    .maybeSingle()

  if (profile?.safe_hire_id) {
    redirect(`/profile/${profile.safe_hire_id}`)
  }

  redirect("/dashboard")
}
