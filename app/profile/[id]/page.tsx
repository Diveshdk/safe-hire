import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { ProfileClient } from "@/components/dashboard/profile-client"

async function getProfileData(safeHireId: string) {
  const adminSupabase = getSupabaseAdmin()
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("user_id, full_name, aadhaar_full_name, aadhaar_verified, safe_hire_id, role, committee_name, committee_position")
    .eq("safe_hire_id", safeHireId)
    .maybeSingle()
  return profile
}

async function getDocuments(userId: string) {
  const adminSupabase = getSupabaseAdmin()
  const { data } = await adminSupabase
    .from("documents")
    .select("id, title, doc_type, verification_status, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  return data || []
}

async function getStats(userId: string) {
  const adminSupabase = getSupabaseAdmin()
  
  const { count: followerCount } = await adminSupabase
    .from("follows")
    .select("*", { count: "exact", head: true })
    .eq("entity_id", userId)

  const { count: eventCount } = await adminSupabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("org_user_id", userId)

  return {
    followers: followerCount || 0,
    events: eventCount || 0
  }
}

export default async function ProfilePage({ params }: { params: { id: string } }) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  const profile = await getProfileData(params.id)
  if (!profile) notFound()

  const documents = await getDocuments(profile.user_id)
  const stats = await getStats(profile.user_id)

  const isOwner = user?.id === profile.user_id

  return (
    <ProfileClient 
      profile={profile} 
      documents={documents} 
      stats={stats} 
      isOwner={isOwner} 
      currentUserId={user?.id}
    />
  )
}
