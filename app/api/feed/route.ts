import { NextResponse } from "next/server"
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server"
import { slugify } from "@/lib/utils/slugify"

// GET ?cursor=ISO_DATE&filter=all|institutes|committees
export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor")
  const filter = searchParams.get("filter") || "all"
  const PAGE_SIZE = 20

  const adminSupabase = getSupabaseAdmin()

  // 1. Get Follow Data
  const { data: followData } = await supabase
    .from("follows")
    .select("entity_id, entity_type")
    .eq("user_id", user.id)

  const orgIds = followData?.filter(f => f.entity_type === "organisation").map(f => f.entity_id) ?? []
  const companyIds = followData?.filter(f => f.entity_type === "company").map(f => f.entity_id) ?? []

  // Mode settings
  const isAll = filter === "all"
  const isCommittees = filter === "committees"
  const isInstitutes = filter === "institutes"

  let targetOrgUserIds: string[] = []
  
  if (isInstitutes) {
    targetOrgUserIds = orgIds
  } else if (isCommittees && orgIds.length > 0) {
    // Smart Filter: Find committee_ids of followed accounts
    const { data: followedProfiles } = await adminSupabase
      .from("profiles")
      .select("committee_id, committee_name")
      .in("user_id", orgIds)
    
    const followedSlugs = [...new Set((followedProfiles ?? []).map(p => p.committee_id || (p.committee_name ? slugify(p.committee_name) : null)).filter(Boolean))]
    
    if (followedSlugs.length > 0) {
      const { data: siblingProfiles } = await adminSupabase
        .from("profiles")
        .select("user_id")
        .in("committee_id", followedSlugs)
      
      targetOrgUserIds = [...new Set((siblingProfiles ?? []).map(p => p.user_id))]
    }
  }

  // ── Events ──
  let eventsQuery = supabase
    .from("events")
    .select("id, title, description, event_type, event_date, created_at, org_user_id")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) eventsQuery = eventsQuery.lt("created_at", cursor)
  if (!isAll) {
    if (targetOrgUserIds.length > 0) {
      eventsQuery = eventsQuery.in("org_user_id", targetOrgUserIds)
    } else {
      eventsQuery = eventsQuery.eq("id", "00000000-0000-0000-0000-000000000000") // empty result
    }
  }

  // ── Jobs ──
  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, description, job_type, location, salary_range, status, created_at, company_id, companies(name, id)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) jobsQuery = jobsQuery.lt("created_at", cursor)
  if (!isAll) {
    if (companyIds.length > 0) {
      jobsQuery = jobsQuery.in("company_id", companyIds)
    } else {
      jobsQuery = jobsQuery.eq("id", "00000000-0000-0000-0000-000000000000")
    }
  }

  // ── Posts ──
  let postsQuery = supabase
    .from("posts")
    .select("id, content, image_url, created_at, org_user_id")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) postsQuery = postsQuery.lt("created_at", cursor)
  if (!isAll) {
    if (targetOrgUserIds.length > 0) {
      postsQuery = postsQuery.in("org_user_id", targetOrgUserIds)
    } else {
      postsQuery = postsQuery.eq("id", "00000000-0000-0000-0000-000000000000")
    }
  }

  const [{ data: events }, { data: jobs }, { data: posts }] = await Promise.all([eventsQuery, jobsQuery, postsQuery])

  // ── Metadata Processing ──
  const allOrgUserIds = [...new Set([...(events ?? []).map((e: any) => e.org_user_id), ...(posts ?? []).map((p: any) => p.org_user_id)])].filter(Boolean)
  const orgMeta: Record<string, any> = {}

  if (allOrgUserIds.length > 0) {
    const { data: profilesData } = await adminSupabase
      .from("profiles")
      .select("*, institutes(*)")
      .in("user_id", allOrgUserIds)

    if (profilesData && profilesData.length > 0) {
      const instituteIds = [...new Set(profilesData.map((p: any) => p.institute_id).filter(Boolean))]
      const instituteMap: Record<string, any> = {}

      if (instituteIds.length > 0) {
        const { data: institutesData } = await adminSupabase
          .from("institutes")
          .select("id, name, safe_hire_id")
          .in("id", instituteIds)
        
        ;(institutesData ?? []).forEach((inst: any) => {
          instituteMap[inst.id] = inst
        })
      }

      profilesData.forEach((p: any) => {
        const instData = Array.isArray(p.institutes) ? p.institutes[0] : p.institutes
        const instituteName = instData?.name || (p.institute_id ? instituteMap[p.institute_id]?.name : null)
        const instituteSafeId = instData?.safe_hire_id || (p.institute_id ? instituteMap[p.institute_id]?.safe_hire_id : null)
        
        const authorName = p.aadhaar_full_name || p.full_name || null
        const meta = {
          comm_name: p.committee_name || instituteName || "Organisation",
          comm_safe_id: p.safe_hire_id || instituteSafeId || null,
          author_name: authorName,
          author_position: p.committee_position || null,
          auth_safe_id: p.safe_hire_id || null,
        }
        if (p.user_id) orgMeta[p.user_id] = meta
        if (p.id) orgMeta[p.id] = meta
      })
    }
  }

  const feedItems = [
    ...(events ?? []).map((e: any) => ({
      ...e,
      _type: "event" as const,
      org_name: orgMeta[e.org_user_id]?.comm_name || "Organisation",
      org_safe_id: orgMeta[e.org_user_id]?.comm_safe_id || null,
      author_name: orgMeta[e.org_user_id]?.author_name || null,
      author_position: orgMeta[e.org_user_id]?.author_position || null,
      auth_safe_id: orgMeta[e.org_user_id]?.auth_safe_id || null,
    })),
    ...(jobs ?? []).map((j: any) => ({
      ...j,
      _type: "job" as const,
      org_name: j.companies?.name || "Company",
      org_safe_id: null,
    })),
    ...(posts ?? []).map((p: any) => ({
      ...p,
      _type: "post" as const,
      org_name: orgMeta[p.org_user_id]?.comm_name || "Organisation",
      org_safe_id: orgMeta[p.org_user_id]?.comm_safe_id || null,
      author_name: orgMeta[p.org_user_id]?.author_name || null,
      author_position: orgMeta[p.org_user_id]?.author_position || null,
      auth_safe_id: orgMeta[p.org_user_id]?.auth_safe_id || null,
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, PAGE_SIZE)

  return NextResponse.json({
    ok: true,
    items: feedItems,
    isFallback: isAll,
    nextCursor: feedItems.length === PAGE_SIZE ? feedItems[feedItems.length - 1]?.created_at : null,
  })
}
