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

    // Look up the certificate by nft_code (which is the nftTokenId)
    const { data: nftCertificate, error: nftLookupError } = await supabase
      .from('nft_certificates')
      .select('*')
      .eq('nft_code', nftTokenId)
      .single()

    if (nftLookupError || !nftCertificate) {
      return NextResponse.json({ 
        error: "NFT certificate not found. Please check your NFT code or contact the issuing institution." 
      }, { status: 404 })
    }

    // Check if already claimed
    if (nftCertificate.is_claimed) {
      return NextResponse.json({ 
        error: "This NFT certificate has already been claimed." 
      }, { status: 409 })
    }

    // Create the NFT certificate record for the user
    const { data: nftCert, error: insertError } = await supabase
      .from('user_nft_certificates')
      .insert({
        user_id: user.id,
        nft_token_id: nftTokenId,
        certificate_id: nftCertificate.id,
        institution_name: nftCertificate.certificate_name, // Use certificate_name from nft_certificates
        program_name: nftCertificate.certificate_name,
        program_type: nftCertificate.certificate_type,
        issue_date: nftCertificate.issue_date,
        grade: null, // No grade in nft_certificates table
        skills: [], // Extract from metadata if needed
        blockchain_hash: nftCertificate.nft_code, // Use nft_code as blockchain reference
        verification_status: 'verified'
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

    // Update the nft_certificates record to mark as claimed
    const { error: updateError } = await supabase
      .from('nft_certificates')
      .update({
        is_claimed: true,
        claimed_by: user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', nftCertificate.id)

    if (updateError) {
      console.error('NFT certificate claim update error:', updateError)
      // Don't fail the request, but log the error
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
