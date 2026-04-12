import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"

export async function GET() {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Get all follow records for this user
  const { data: followRecords } = await supabase
    .from("follows")
    .select("entity_id, entity_type")
    .eq("user_id", user.id)

  if (!followRecords || followRecords.length === 0) {
    return NextResponse.json({ ok: true, following: [] })
  }

  const adminSupabase = getSupabaseAdmin()
  const entityIds = followRecords.map(f => f.entity_id)

  // Fetch profiles for these entities
  const { data: profiles } = await adminSupabase
    .from("profiles")
    .select("user_id, safe_hire_id, committee_name, full_name, role, aadhaar_full_name")
    .in("user_id", entityIds)

  // Also fetch institutes if any followed entity is an institute-type
  // (Assuming entity_id could be institute_id or user_id)
  const { data: institutes } = await adminSupabase
    .from("institutes")
    .select("id, name, safe_hire_id")
    .in("id", entityIds)

  const results = followRecords.map(f => {
    const profile = profiles?.find(p => p.user_id === f.entity_id)
    const institute = institutes?.find(i => i.id === f.entity_id)

    return {
      id: f.entity_id,
      type: f.entity_type,
      name: profile?.committee_name || profile?.aadhaar_full_name || profile?.full_name || institute?.name || "Organisation",
      safe_hire_id: profile?.safe_hire_id || institute?.safe_hire_id || null,
      role: profile?.role || "organisation"
    }
  })

  return NextResponse.json({ ok: true, following: results })
}
