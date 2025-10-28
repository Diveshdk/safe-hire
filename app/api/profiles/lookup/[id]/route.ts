import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if current user is a recruiter
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (currentProfile?.role !== 'recruiter') {
      return NextResponse.json({ 
        error: 'Only recruiters can lookup profiles' 
      }, { status: 403 })
    }

    const safeHireId = decodeURIComponent(params.id)

    // Search for profile by Safe Hire ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        full_name,
        email,
        phone,
        location,
        bio,
        skills,
        experience_years,
        education,
        aadhaar_verified,
        safe_hire_id,
        role,
        created_at
      `)
      .eq('safe_hire_id', safeHireId)
      .eq('role', 'job_seeker')
      .single()

    if (profileError) {
      if (profileError.code === 'PGRST116') {
        // No profile found
        return NextResponse.json({ profile: null })
      }
      throw profileError
    }

    // Get NFT certificates for this profile
    const { data: nftCertificates, error: nftError } = await supabase
      .from('user_nft_certificates')
      .select(`
        id,
        certificate_id,
        institution_name,
        program_name,
        program_type,
        issue_date,
        grade,
        skills,
        verification_status
      `)
      .eq('user_id', profile.user_id)
      .order('issue_date', { ascending: false })

    if (nftError) {
      console.error('Error fetching NFT certificates:', nftError)
      // Continue without certificates if there's an error
    }

    // Combine profile with certificates
    const profileWithCertificates = {
      ...profile,
      nft_certificates: nftCertificates || []
    }

    return NextResponse.json({ profile: profileWithCertificates })

  } catch (error) {
    console.error('Profile lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to lookup profile' },
      { status: 500 }
    )
  }
}
