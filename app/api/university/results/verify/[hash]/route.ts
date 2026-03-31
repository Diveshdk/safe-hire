import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

/**
 * GET /api/university/results/verify/:hash
 * Verify a university result by its verification hash
 */
export async function GET(req: Request, { params }: { params: { hash: string } }) {
  const supabase = getSupabaseServer()

  try {
    const { hash } = params

    if (!hash) {
      return NextResponse.json(
        { ok: false, message: "Verification hash is required" },
        { status: 400 }
      )
    }

    const { data: result, error } = await supabase
      .from("university_results")
      .select(
        `
        *,
        student:student_user_id (
          user_id,
          full_name,
          aadhaar_full_name,
          safe_hire_id
        )
      `
      )
      .eq("verification_hash", hash)
      .eq("is_active", true)
      .eq("university_verification_status", "verified")
      .eq("principal_verification_status", "approved")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    if (!result) {
      return NextResponse.json(
        {
          ok: false,
          message: "University result not found, not verified, or not activated",
          verified: false,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      result: {
        id: result.id,
        student_name: result.student?.full_name || result.student?.aadhaar_full_name || "Unknown",
        student_safe_hire_id: result.student_safe_hire_id,
        university_name: result.university_name,
        university_code: result.university_code,
        course_name: result.course_name,
        academic_year: result.academic_year,
        semester_year: result.semester_year,
        result_type: result.result_type,
        grade_cgpa: result.grade_cgpa,
        percentage: result.percentage,
        division_class: result.division_class,
        result_status: result.result_status,
        principal_name: result.principal_name,
        principal_designation: result.principal_designation,
        principal_signature_timestamp: result.principal_signature_timestamp,
        verification_hash: result.verification_hash,
        immutable_record_hash: result.immutable_record_hash,
        is_active: result.is_active,
        activated_at: result.activated_at,
        created_at: result.created_at,
      },
    })
  } catch (error: any) {
    console.error("[university/results/verify] Error:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
