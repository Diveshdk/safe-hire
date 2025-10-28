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

    const body = await request.json()
    const {
      document_type,
      institution_name,
      field_of_study,
      year_completed,
      grade,
      notes,
      nft_code
    } = body

    let verificationStatus = "pending"
    let nftCertificate = null
    let verifiedByNft = false

    // If NFT code is provided, verify it
    if (nft_code) {
      const { data: nftData, error: nftError } = await supabase
        .from("nft_certificates")
        .select("*, profiles!nft_certificates_institution_id_fkey(full_name, email)")
        .eq("nft_code", nft_code.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle()

      if (nftError) {
        console.error("Error checking NFT code:", nftError)
      } else if (nftData) {
        // Get user's profile to check name matching
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("full_name")
          .eq("user_id", user.id)
          .maybeSingle()

        // Check if names match (case-insensitive)
        if (userProfile?.full_name && 
            userProfile.full_name.toLowerCase().trim() === nftData.recipient_name.toLowerCase().trim()) {
          verificationStatus = "verified"
          nftCertificate = nftData
          verifiedByNft = true
        } else {
          // Names don't match, keep as pending but note the NFT attempt
          console.log("NFT code valid but name mismatch:", {
            profileName: userProfile?.full_name,
            nftName: nftData.recipient_name
          })
        }
      }
    }

    // Insert academic verification record
    const { data, error } = await supabase
      .from("verifications")
      .insert({
        subject_user_id: user.id,
        type: "academic",
        status: verificationStatus,
        document_type,
        institution_name: nftCertificate ? `${nftCertificate.certificate_name} (NFT Verified)` : institution_name,
        field_of_study: nftCertificate?.certificate_type || field_of_study,
        year_completed: parseInt(year_completed),
        grade,
        notes: nftCertificate ? `${notes || ''}\n\nNFT Verified: ${nft_code}\nIssued by: ${nftCertificate.profiles?.full_name || 'Institution'}` : notes,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating academic verification:", error)
      return NextResponse.json(
        { success: false, message: "Failed to submit verification" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      nft_verified: verifiedByNft,
      message: verifiedByNft ? "Academic credential verified instantly with NFT!" : "Academic credential submitted for review"
    })
  } catch (error) {
    console.error("Academic verification API error:", error)
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

      // Get existing academic verification for the user
  const { data: verification, error } = await supabase
    .from("verifications")
    .select("*")
    .eq("subject_user_id", user.id)
    .eq("type", "academic")
    .maybeSingle()

    if (error) {
      console.error("Error fetching verifications:", error)
      return NextResponse.json(
        { success: false, message: "Failed to fetch verifications" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        verification: verification,
        verifications: verification ? [verification] : []
      }
    })

  } catch (error) {
    console.error("Get verifications API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
