import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { nftTokenId } = await request.json()

    if (!nftTokenId) {
      return NextResponse.json({ error: "NFT Token ID is required" }, { status: 400 })
    }

    // Check if this NFT is already claimed
    const { data: existingCert } = await supabase
      .from('user_nft_certificates')
      .select('id, user_id')
      .eq('nft_token_id', nftTokenId)
      .single()

    if (existingCert) {
      if (existingCert.user_id === user.id) {
        return NextResponse.json({ error: "You have already added this NFT certificate" }, { status: 409 })
      } else {
        return NextResponse.json({ error: "This NFT certificate has already been claimed by another user" }, { status: 409 })
      }
    }

    // Look up the certificate data from the issued certificates
    const { data: issuedCert, error: lookupError } = await supabase
      .from('issued_certificates')
      .select('*')
      .eq('nft_token_id', nftTokenId)
      .single()

    if (lookupError || !issuedCert) {
      return NextResponse.json({ 
        error: "NFT certificate not found. Please check your Token ID or contact the issuing institution." 
      }, { status: 404 })
    }

    // Create the NFT certificate record for the user
    const { data: nftCert, error: insertError } = await supabase
      .from('user_nft_certificates')
      .insert({
        user_id: user.id,
        nft_token_id: nftTokenId,
        certificate_id: issuedCert.id,
        institution_name: issuedCert.institution_name,
        program_name: issuedCert.program_name,
        program_type: issuedCert.program_type,
        issue_date: issuedCert.issue_date,
        grade: issuedCert.grade,
        skills: issuedCert.skills || [],
        blockchain_hash: issuedCert.blockchain_hash,
        verification_status: 'verified' // Since it's from issued_certificates, it's already verified
      })
      .select()
      .single()

    if (insertError) {
      console.error('NFT certificate insert error:', insertError)
      return NextResponse.json({ 
        error: "Failed to add NFT certificate", 
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      certificate: nftCert,
      message: "NFT certificate added successfully!"
    })

  } catch (error) {
    console.error('Add NFT Certificate API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
