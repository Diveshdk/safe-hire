import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import crypto from "crypto"

/**
 * POST /api/university/results/submit
 * Submit university results for a student (requires principal signature)
 */
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // Verify user is organisation/university
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("user_id", user.id)
    .maybeSingle()

  if (!["organisation", "university_principal", "reviewer"].includes(profile?.role || "")) {
    return NextResponse.json(
      { ok: false, message: "Only universities/organisations can submit results" },
      { status: 403 }
    )
  }

  try {
    const body = await req.json()
    const {
      student_safe_hire_id,
      university_name,
      university_code,
      course_name,
      academic_year,
      semester_year,
      result_type,
      grade_cgpa,
      percentage,
      division_class,
      result_status,
      document_url,
      principal_signature_data,
    } = body

    // Validate required fields
    if (
      !student_safe_hire_id ||
      !university_name ||
      !course_name ||
      !academic_year ||
      !result_type
    ) {
      return NextResponse.json(
        { ok: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Find student by SafeHire ID
    const { data: studentProfile, error: studentError } = await supabase
      .from("profiles")
      .select("user_id, full_name, aadhaar_full_name")
      .eq("safe_hire_id", student_safe_hire_id)
      .maybeSingle()

    if (studentError || !studentProfile) {
      return NextResponse.json(
        { ok: false, message: "Student SafeHire ID not found" },
        { status: 404 }
      )
    }

    // Generate verification hash
    const verificationData = `${student_safe_hire_id}|${university_name}|${course_name}|${academic_year}|${Date.now()}`
    const verificationHash = crypto.createHash("sha256").update(verificationData).digest("hex")

    // Generate immutable record hash (for blockchain anchoring later)
    const recordData = JSON.stringify({
      student_safe_hire_id,
      university_name,
      course_name,
      academic_year,
      grade_cgpa,
      percentage,
      timestamp: new Date().toISOString(),
    })
    const immutableRecordHash = crypto.createHash("sha256").update(recordData).digest("hex")

    // Process principal signature if provided
    let principalSignatureHash = null
    let principalVerificationStatus = "pending"
    let principalName = null
    let principalDesignation = null

    if (principal_signature_data) {
      principalName = principal_signature_data.name
      principalDesignation = principal_signature_data.designation
      const sigData = `${principalName}|${university_name}|${Date.now()}`
      principalSignatureHash = crypto.createHash("sha256").update(sigData).digest("hex")
      principalVerificationStatus = "approved" // Auto-approve for now, can add verification flow
    }

    // Insert university result
    const { data: result, error: insertError } = await supabase
      .from("university_results")
      .insert({
        student_user_id: studentProfile.user_id,
        student_safe_hire_id,
        university_name,
        university_code,
        course_name,
        academic_year,
        semester_year,
        result_type,
        grade_cgpa,
        percentage,
        division_class,
        result_status,
        document_url,
        principal_name: principalName,
        principal_designation: principalDesignation,
        principal_signature_hash: principalSignatureHash,
        principal_signature_timestamp: principalSignatureHash ? new Date().toISOString() : null,
        principal_verification_status: principalVerificationStatus,
        university_verification_status: "verified",
        verified_by_user_id: user.id,
        verified_at: new Date().toISOString(),
        is_active: principalSignatureHash ? true : false, // Activate if principal signed
        activated_at: principalSignatureHash ? new Date().toISOString() : null,
        verification_hash: verificationHash,
        immutable_record_hash: immutableRecordHash,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[university/results/submit] Insert error:", insertError)
      return NextResponse.json({ ok: false, message: insertError.message }, { status: 500 })
    }

    // Create document record if document_url provided
    if (document_url) {
      await supabase.from("documents").insert({
        user_id: studentProfile.user_id,
        doc_type: "academic_result",
        title: `${course_name} - ${academic_year} Results`,
        file_url: document_url,
        verification_status: "verified",
        issued_by_user_id: user.id,
        issued_by_name: university_name,
        university_result_id: result.id,
        ocr_data: {
          university_name,
          course_name,
          academic_year,
          verification_hash: verificationHash,
        },
      })
    }

    return NextResponse.json({
      ok: true,
      message: principalSignatureHash
        ? "University result submitted and activated successfully"
        : "University result submitted, pending principal approval",
      result: {
        id: result.id,
        verification_hash: verificationHash,
        is_active: result.is_active,
        principal_verification_status: result.principal_verification_status,
      },
    })
  } catch (error: any) {
    console.error("[university/results/submit] Error:", error)
    return NextResponse.json(
      { ok: false, message: error.message || "Internal server error" },
      { status: 500 }
    )
  }
}
