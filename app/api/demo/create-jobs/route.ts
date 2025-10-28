import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

const DEMO_COMPANY = {
  name: "TechCorp Inc",
  registration_number: "DEMO123456",
  verification_status: "verified",
  verifier_source: "demo",
  verified_at: new Date().toISOString(),
  owner_user_id: "00000000-0000-0000-0000-000000000000" // dummy UUID for demo
}

const DEMO_JOBS = (company_id: string) => [
  { 
    company_id, 
    title: "Frontend Developer", 
    description: "We're looking for a passionate Frontend Developer to join our team and help build amazing user experiences using React and TypeScript.", 
    requirements: "• 2+ years of React experience\n• Strong JavaScript/TypeScript skills\n• Experience with modern CSS frameworks\n• Knowledge of state management",
    benefits: "• Competitive salary\n• Health insurance\n• Flexible work hours\n• Professional development budget",
    salary_range: "$80,000 - $120,000",
    location: "San Francisco, CA",
    employment_type: "full-time",
    status: "open"
  },
  { 
    company_id, 
    title: "Backend Engineer", 
    description: "Join our backend team to build scalable APIs and services that power our platform used by thousands of users.", 
    requirements: "• 3+ years of Node.js experience\n• Strong database design skills\n• Experience with RESTful APIs\n• Knowledge of cloud platforms",
    benefits: "• Competitive salary and equity\n• Remote work options\n• Health benefits\n• Learning stipend",
    salary_range: "$90,000 - $130,000",
    location: "Remote",
    employment_type: "full-time",
    status: "open"
  },
  { 
    company_id, 
    title: "Product Manager", 
    description: "Lead product strategy and work with cross-functional teams to deliver features that delight our users.", 
    requirements: "• 3+ years of product management experience\n• Strong analytical skills\n• Experience with agile methodologies\n• Excellent communication skills",
    benefits: "• Competitive salary\n• Equity package\n• Flexible schedule\n• Career growth opportunities",
    salary_range: "$100,000 - $150,000",
    location: "New York, NY",
    employment_type: "full-time",
    status: "open"
  },
]

export async function POST() {
  // Use service role to bypass RLS for demo purposes
  const { createClient } = require('@supabase/supabase-js')
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  
  try {
    // Check if demo company already exists
    let { data: company } = await supabase
      .from("companies")
      .select("id, name")
      .eq("registration_number", "DEMO123456")
      .maybeSingle()
    
    if (!company) {
      // Create demo company
      const { data: created, error: cErr } = await supabase
        .from("companies")
        .insert(DEMO_COMPANY)
        .select("id, name")
        .single()
      
      if (cErr) {
        console.error("Error creating company:", cErr)
        return NextResponse.json({ ok: false, message: cErr.message }, { status: 500 })
      }
      company = created
    }

    if (!company) {
      return NextResponse.json({ ok: false, message: "Failed to create company" }, { status: 500 })
    }

    // Delete existing demo jobs to avoid duplicates
    await supabase
      .from("jobs")
      .delete()
      .eq("company_id", company.id)

    // Create demo jobs
    const { error: jobsError } = await supabase
      .from("jobs")
      .insert(DEMO_JOBS(company.id))

    if (jobsError) {
      console.error("Error creating jobs:", jobsError)
      return NextResponse.json({ ok: false, message: jobsError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      ok: true, 
      message: "Demo jobs created successfully",
      company: company.name,
      jobCount: DEMO_JOBS(company.id).length
    })
  } catch (error) {
    console.error("Error in demo creation:", error)
    return NextResponse.json({ 
      ok: false, 
      message: "Internal server error" 
    }, { status: 500 })
  }
}
