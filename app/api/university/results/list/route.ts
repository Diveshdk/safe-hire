import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

/**
 * GET /api/university/results/list
 * Get university results for a student
 */
export async function GET(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("user_id") || user.id
    const includeInactive = searchParams.get("include_inactive") === "true"

    let query = supabase
      .from("university_results")
      .select("*")
      .eq("student_user_id", userId)
      .order("academic_year", { ascending: false })

    // Only show active results unless specifically requested
    if (!includeInactive) {
      query = query.eq("is_active", true)
    }

    const { data: results, error } = await query

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      results: results || [],
      total: results?.length || 0,
    })
  } catch (error: any) {
    console.error("[university/results/list] Error:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
