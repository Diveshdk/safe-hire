import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    const debugInfo: any = {
      timestamp: new Date().toISOString(),
      auth: {
        hasUser: !!user,
        userId: user?.id || null,
        error: authError?.message || null
      },
      database: {
        tables: {},
        policies: {}
      },
      environment: {
        hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        hasServiceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        hasGeminiKey: !!process.env.GEMINI_API_KEY
      }
    }

    if (user) {
      // Check profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      debugInfo.auth.profile = {
        exists: !!profile,
        role: profile?.role || null,
        error: profileError?.message || null
      }

      // Check table existence by trying to query them
      try {
        const { data: certificates, error: certError } = await supabase
          .from('user_nft_certificates')
          .select('count')
          .limit(1)

        debugInfo.database.tables.user_nft_certificates = {
          exists: !certError,
          error: certError?.message || null
        }
      } catch (error) {
        debugInfo.database.tables.user_nft_certificates = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }

      try {
        const { data: issued, error: issuedError } = await supabase
          .from('issued_certificates')
          .select('count')
          .limit(1)

        debugInfo.database.tables.issued_certificates = {
          exists: !issuedError,
          error: issuedError?.message || null
        }
      } catch (error) {
        debugInfo.database.tables.issued_certificates = {
          exists: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json(debugInfo)

  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
