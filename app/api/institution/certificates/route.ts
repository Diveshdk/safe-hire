import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify user is an institution
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.role !== "institution") {
      return NextResponse.json(
        { success: false, message: "Access denied. Institution role required." },
        { status: 403 }
      )
    }

    const body = await request.json()
    const {
      certificate_name,
      certificate_type,
      recipient_name,
      description,
      issue_date,
      expiry_date,
      metadata
    } = body

    // Validate required fields
    if (!certificate_name || !certificate_type || !recipient_name) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    // Generate unique NFT code
    const { data: nftCodeResult, error: nftError } = await supabase
      .rpc('generate_nft_code')

    if (nftError || !nftCodeResult) {
      console.error("Error generating NFT code:", nftError)
      return NextResponse.json(
        { success: false, message: "Failed to generate NFT code" },
        { status: 500 }
      )
    }

    // Insert certificate record
    const { data, error } = await supabase
      .from("nft_certificates")
      .insert({
        institution_id: user.id,
        certificate_name,
        certificate_type,
        recipient_name: recipient_name.trim(),
        nft_code: nftCodeResult,
        description: description || null,
        issue_date: issue_date || new Date().toISOString().split('T')[0],
        expiry_date: expiry_date || null,
        metadata: metadata || {},
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating certificate:", error)
      return NextResponse.json(
        { success: false, message: "Failed to create certificate" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: "Certificate created successfully"
    })
  } catch (error) {
    console.error("Certificate creation API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const supabase = getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify user is an institution
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.role !== "institution") {
      return NextResponse.json(
        { success: false, message: "Access denied. Institution role required." },
        { status: 403 }
      )
    }

    // Get certificates for this institution
    const { data: certificates, error } = await supabase
      .from("nft_certificates")
      .select("*")
      .eq("institution_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching certificates:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch certificates" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: certificates || []
    })
  } catch (error) {
    console.error("Certificates fetch API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
