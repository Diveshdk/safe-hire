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

    // Delete the NFT certificate (only user's own certificates)
    const { error: deleteError } = await supabase
      .from('user_nft_certificates')
      .delete()
      .eq('id', certificateId)
      .eq('user_id', user.id) // Ensure user can only delete their own certificates

    if (deleteError) {
      console.error('NFT certificate delete error:', deleteError)
      return NextResponse.json({ 
        error: "Failed to remove NFT certificate", 
        details: deleteError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      message: "NFT certificate removed successfully!"
    })

  } catch (error) {
    console.error('Remove NFT Certificate API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
