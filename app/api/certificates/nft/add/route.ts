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
      .from('nft_certificates')
      .select('id, claimed_by')
      .eq('nft_code', nftTokenId)
      .eq('is_claimed', true)
      .single()

    if (existingCert) {
      if (existingCert.claimed_by === user.id) {
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

    // Update the nft_certificates record to mark as claimed
    const { data: updatedCert, error: updateError } = await supabase
      .from('nft_certificates')
      .update({
        is_claimed: true,
        claimed_by: user.id,
        claimed_at: new Date().toISOString()
      })
      .eq('id', nftCertificate.id)
      .select()
      .single()

    if (updateError) {
      console.error('NFT certificate claim update error:', updateError)
      return NextResponse.json({ 
        error: "Failed to claim NFT certificate", 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      certificate: updatedCert,
      message: "NFT certificate claimed successfully!"
    })

  } catch (error) {
    console.error('Add NFT Certificate API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
