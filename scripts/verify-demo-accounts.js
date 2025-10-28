#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

async function verifyDemoAccounts() {
  console.log('🔍 Verifying demo accounts...\n')

  try {
    // Get profiles with user emails
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        role,
        full_name,
        safe_hire_id,
        aadhaar_verified,
        user_id
      `)

    if (error) {
      console.error('Error fetching profiles:', error)
      return
    }

    // Get user emails
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) {
      console.error('Error fetching users:', usersError)
      return
    }

    // Match profiles with emails
    const profilesWithEmails = profiles.map(profile => {
      const user = users.users.find(u => u.id === profile.user_id)
      return {
        ...profile,
        email: user?.email || 'Unknown'
      }
    })

    // Filter demo accounts
    const demoAccounts = profilesWithEmails.filter(p => 
      p.email === 'recruiter@demo.com' || p.email === 'employee@demo.com'
    )

    console.log('📋 Demo Account Status:')
    console.log('=' .repeat(50))

    demoAccounts.forEach(account => {
      console.log(`📧 Email: ${account.email}`)
      console.log(`👤 Role: ${account.role}`)
      console.log(`🏷️  Name: ${account.full_name || 'Not set'}`)
      console.log(`🆔 Safe Hire ID: ${account.safe_hire_id || 'Not set'}`)
      console.log(`✅ Aadhaar Verified: ${account.aadhaar_verified ? 'Yes' : 'No'}`)
      console.log('-'.repeat(30))
    })

    // Check companies for recruiter
    const recruiterProfile = demoAccounts.find(p => p.email === 'recruiter@demo.com')
    if (recruiterProfile) {
      const { data: companies } = await supabase
        .from('companies')
        .select('name, verification_status')
        .eq('owner_user_id', recruiterProfile.user_id)

      if (companies && companies.length > 0) {
        console.log(`🏢 Recruiter Company: ${companies[0].name}`)
        console.log(`🔐 Company Status: ${companies[0].verification_status}`)

        // Check jobs
        const { data: jobs } = await supabase
          .from('jobs')
          .select('title, status')
          .eq('company_id', (await supabase
            .from('companies')
            .select('id')
            .eq('owner_user_id', recruiterProfile.user_id)
            .single()
          ).data?.id)

        if (jobs && jobs.length > 0) {
          console.log(`💼 Jobs Created: ${jobs.length}`)
          jobs.forEach(job => {
            console.log(`   - ${job.title} (${job.status})`)
          })
        }
      } else {
        console.log('⚠️  No company found for recruiter')
      }
    }

    console.log('\n🎯 Test Instructions:')
    console.log('1. Recruiter Login: recruiter@demo.com / demo123456')
    console.log('   → Should redirect to /recruiter/dashboard')
    console.log('   → Should show company verification and jobs')
    console.log('')
    console.log('2. Employee Login: employee@demo.com / demo123456')
    console.log('   → Should redirect to /employee/dashboard')
    console.log('   → Should show academic verification options')

  } catch (error) {
    console.error('Verification error:', error)
  }
}

verifyDemoAccounts().catch(console.error)
