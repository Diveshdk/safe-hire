import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const certificateId = params.id

    // Unclaim the NFT certificate (only user's own certificates)
    const { error: updateError } = await supabase
      .from('nft_certificates')
      .update({
        is_claimed: false,
        claimed_by: null,
        claimed_at: null
      })
      .eq('id', certificateId)
      .eq('claimed_by', user.id) // Ensure user can only unclaim their own certificates

    if (updateError) {
      console.error('NFT certificate unclaim error:', updateError)
      return NextResponse.json({ 
        error: "Failed to unclaim NFT certificate", 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "NFT certificate unclaimed successfully!"
    })

  } catch (error) {
    console.error('Unclaim NFT Certificate API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
