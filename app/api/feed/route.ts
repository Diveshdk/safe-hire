import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

// GET ?cursor=ISO_DATE → paginated feed (events + jobs + posts from followed entities)
export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const cursor = searchParams.get("cursor") // created_at for pagination
  const PAGE_SIZE = 20

  // Get all entities the user follows
  const { data: followData } = await supabase
    .from("follows")
    .select("entity_id, entity_type")
    .eq("user_id", user.id)

  const orgIds = followData?.filter(f => f.entity_type === "organisation").map(f => f.entity_id) ?? []
  const companyIds = followData?.filter(f => f.entity_type === "company").map(f => f.entity_id) ?? []

  const useGlobalFallback = orgIds.length === 0 && companyIds.length === 0

  // ── Events ────────────────────────────────────────────────────────────────
  let eventsQuery = supabase
    .from("events")
    .select("id, title, description, event_type, event_date, created_at, org_user_id, profiles!events_org_user_id_fkey(aadhaar_full_name, full_name)")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) eventsQuery = eventsQuery.lt("created_at", cursor)
  if (!useGlobalFallback && orgIds.length > 0) {
    eventsQuery = eventsQuery.in("org_user_id", orgIds)
  } else if (!useGlobalFallback) {
    eventsQuery = eventsQuery.eq("id", "00000000-0000-0000-0000-000000000000")
  }

  // ── Jobs ──────────────────────────────────────────────────────────────────
  let jobsQuery = supabase
    .from("jobs")
    .select("id, title, description, job_type, location, salary_range, status, created_at, company_id, companies(name, id)")
    .eq("status", "open")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) jobsQuery = jobsQuery.lt("created_at", cursor)
  if (!useGlobalFallback && companyIds.length > 0) {
    jobsQuery = jobsQuery.in("company_id", companyIds)
  } else if (!useGlobalFallback) {
    jobsQuery = jobsQuery.eq("id", "00000000-0000-0000-0000-000000000000")
  }

  // ── Posts ──────────────────────────────────────────────────────────────────
  let postsQuery = supabase
    .from("posts")
    .select("id, content, image_url, created_at, org_user_id, profiles!posts_org_user_id_fkey(aadhaar_full_name, full_name)")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE)

  if (cursor) postsQuery = postsQuery.lt("created_at", cursor)
  if (!useGlobalFallback && orgIds.length > 0) {
    postsQuery = postsQuery.in("org_user_id", orgIds)
  } else if (!useGlobalFallback) {
    postsQuery = postsQuery.eq("id", "00000000-0000-0000-0000-000000000000")
  }

  const [{ data: events }, { data: jobs }, { data: posts }] = await Promise.all([eventsQuery, jobsQuery, postsQuery])

  // Merge and sort by created_at descending
  const feedItems = [
    ...(events ?? []).map((e: any) => ({
      ...e,
      _type: "event" as const,
      org_name: e.profiles?.aadhaar_full_name || e.profiles?.full_name || "Organisation",
    })),
    ...(jobs ?? []).map((j: any) => ({
      ...j,
      _type: "job" as const,
      org_name: j.companies?.name || "Company",
    })),
    ...(posts ?? []).map((p: any) => ({
      ...p,
      _type: "post" as const,
      org_name: p.profiles?.aadhaar_full_name || p.profiles?.full_name || "Organisation",
    })),
  ]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, PAGE_SIZE)

  return NextResponse.json({
    ok: true,
    items: feedItems,
    isFallback: useGlobalFallback,
    nextCursor: feedItems.length === PAGE_SIZE ? feedItems[feedItems.length - 1]?.created_at : null,
  })
}
