import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const userId = url.searchParams.get('userId') || user.id

    // Get user's NFT certificates
    const { data: certificates, error } = await supabase
      .from('nft_certificates')
      .select('*')
      .eq('claimed_by', userId)
      .eq('is_claimed', true)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Certificates fetch error:', error)
      return NextResponse.json({ 
        error: "Failed to fetch certificates", 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      certificates: certificates || []
    })

  } catch (error) {
    console.error('NFT Certificates API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
