import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

const DEMO_JOBS = (company_id: string) => [
  { 
    company_id, 
    title: "Frontend Engineer", 
    description: "Join our team to build amazing user interfaces using React and TypeScript. You'll work on cutting-edge web applications that impact thousands of users.", 
    requirements: "• 3+ years of React experience\n• Strong TypeScript skills\n• Experience with modern CSS frameworks\n• Knowledge of state management (Redux/Context)",
    benefits: "• Competitive salary and equity\n• Health, dental, and vision insurance\n• Flexible work arrangements\n• Professional development budget",
    salary_range: "$90,000 - $120,000",
    location: "San Francisco, CA",
    employment_type: "full-time",
    status: "open"
  },
  { 
    company_id, 
    title: "Backend Engineer", 
    description: "Build robust and scalable backend systems using Node.js and PostgreSQL. You'll design APIs and services that power our platform.", 
    requirements: "• 4+ years of Node.js experience\n• Strong database design skills\n• Experience with RESTful APIs\n• Knowledge of cloud platforms (AWS/GCP)",
    benefits: "• Competitive salary and equity\n• Health, dental, and vision insurance\n• Remote work options\n• Learning and development stipend",
    salary_range: "$100,000 - $130,000",
    location: "Remote",
    employment_type: "full-time",
    status: "open"
  },
  { 
    company_id, 
    title: "Data Analyst", 
    description: "Help drive business decisions through data analysis and insights. You'll work with SQL, create dashboards, and present findings to stakeholders.", 
    requirements: "• 2+ years of SQL experience\n• Experience with data visualization tools\n• Strong analytical thinking\n• Knowledge of statistical methods",
    benefits: "• Competitive salary\n• Health and wellness benefits\n• Flexible schedule\n• Professional growth opportunities",
    salary_range: "$70,000 - $95,000",
    location: "New York, NY",
    employment_type: "full-time",
    status: "open"
  },
]

export async function POST() {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  // use first company owned by user, otherwise create a demo one
  let { data: company } = await supabase.from("companies").select("id, name").eq("created_by", user.id).maybeSingle()
  if (!company) {
    const { data: created, error: cErr } = await supabase
      .from("companies")
      .insert({
        created_by: user.id,
        name: "Demo Co",
        registration_number: "DEMO000000",
        verification_status: "verified",
        description: "A demo company for testing purposes",
        location: "San Francisco, CA",
      })
      .select()
      .single()
    if (cErr) return NextResponse.json({ ok: false, message: cErr.message }, { status: 500 })
    company = created
  }

  if (!company) {
    return NextResponse.json({ ok: false, message: "Failed to create company" }, { status: 500 })
  }

  const { error } = await supabase.from("jobs").insert(DEMO_JOBS(company.id))
  if (error) return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
