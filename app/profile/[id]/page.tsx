import { getSupabaseServer } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileClient } from "@/components/dashboard/profile-client"

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

  const documents = await getDocuments(profile.user_id)

  return <ProfileClient profile={profile} documents={documents} />
}
