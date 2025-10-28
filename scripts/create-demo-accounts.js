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

async function createDemoAccounts() {
  console.log('Creating demo accounts...')

  // Create a demo recruiter account
  const recruiterEmail = 'recruiter@demo.com'
  const recruiterPassword = 'demo123456'
  
  try {
    // Create recruiter user
    const { data: recruiterUser, error: recruiterError } = await supabase.auth.admin.createUser({
      email: recruiterEmail,
      password: recruiterPassword,
      email_confirm: true
    })

    if (recruiterError) {
      console.error('Error creating recruiter:', recruiterError.message)
    } else {
      console.log('✅ Created recruiter account:', recruiterEmail)
      
      // Update profile to set role
      await supabase.from('profiles').upsert({
        user_id: recruiterUser.user.id,
        role: 'employer_admin',
        full_name: 'Demo Recruiter',
        email: recruiterEmail
      })

      // Create demo company
      const { data: company, error: companyError } = await supabase.from('companies').insert({
        owner_user_id: recruiterUser.user.id,
        name: 'TechCorp Solutions',
        registration_number: 'U72900KA2020PTC123456',
        verification_status: 'verified',
        verifier_source: 'demo',
        verified_at: new Date().toISOString(),
        address: 'Bangalore, Karnataka, India',
        website: 'https://techcorp.demo.com',
        description: 'Leading technology solutions provider specializing in AI and blockchain innovations.'
      }).select().single()

      if (!companyError && company) {
        console.log('✅ Created demo company:', company.name)

        // Create demo jobs
        const jobs = [
          {
            company_id: company.id,
            title: 'Senior Frontend Developer',
            description: 'Join our team to build cutting-edge React applications with TypeScript. Experience with Next.js and modern CSS frameworks required.',
            requirements: 'React, TypeScript, Next.js, 3+ years experience',
            salary_range: '₹15-25 LPA',
            location: 'Bangalore, India',
            employment_type: 'full-time',
            status: 'open'
          },
          {
            company_id: company.id,
            title: 'Backend Engineer',
            description: 'Design and develop scalable APIs and microservices using Node.js and PostgreSQL. Experience with AWS preferred.',
            requirements: 'Node.js, PostgreSQL, REST APIs, 2+ years experience',
            salary_range: '₹12-20 LPA',
            location: 'Bangalore, India',
            employment_type: 'full-time',
            status: 'open'
          },
          {
            company_id: company.id,
            title: 'DevOps Engineer',
            description: 'Manage CI/CD pipelines, containerization, and cloud infrastructure. Strong knowledge of Kubernetes and Docker required.',
            requirements: 'Docker, Kubernetes, AWS/GCP, CI/CD, 3+ years experience',
            salary_range: '₹18-28 LPA',
            location: 'Remote',
            employment_type: 'full-time',
            status: 'open'
          }
        ]

        const { error: jobsError } = await supabase.from('jobs').insert(jobs)
        if (!jobsError) {
          console.log('✅ Created 3 demo jobs')
        }
      }
    }
  } catch (error) {
    console.error('Error creating recruiter account:', error.message)
  }

  // Create a demo employee account
  const employeeEmail = 'employee@demo.com'
  const employeePassword = 'demo123456'
  
  try {
    const { data: employeeUser, error: employeeError } = await supabase.auth.admin.createUser({
      email: employeeEmail,
      password: employeePassword,
      email_confirm: true
    })

    if (employeeError) {
      console.error('Error creating employee:', employeeError.message)
    } else {
      console.log('✅ Created employee account:', employeeEmail)
      
      // Update profile to set role
      await supabase.from('profiles').upsert({
        user_id: employeeUser.user.id,
        role: 'job_seeker',
        full_name: 'Demo Job Seeker',
        email: employeeEmail,
        safe_hire_id: 'SH' + Math.random().toString(36).substr(2, 8).toUpperCase(),
        aadhaar_verified: true,
        verification_status: 'verified'
      })

      console.log('✅ Set up employee profile with verification')
    }
  } catch (error) {
    console.error('Error creating employee account:', error.message)
  }

  console.log('\n🎉 Demo accounts created successfully!')
  console.log('\nLogin credentials:')
  console.log('👔 Recruiter: recruiter@demo.com / demo123456')
  console.log('👨‍💼 Employee: employee@demo.com / demo123456')
  console.log('\nYou can now test both user flows!')
}

createDemoAccounts().catch(console.error)
