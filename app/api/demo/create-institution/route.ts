import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = getSupabaseServer()

    // Demo institution credentials
    const demoEmail = "demo-university@safehire.com"
    const demoPassword = "DemoUniversity123!"

    // First check if the demo account already exists
    const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
      email: demoEmail,
      password: demoPassword,
    })

    if (existingUser?.user && !checkError) {
      // Account exists and can login - return existing account info
      const { data: certificates } = await supabase
        .from("nft_certificates")
        .select("certificate_name, recipient_name, nft_code")
        .eq("institution_id", existingUser.user.id)

      return NextResponse.json({
        success: true,
        message: "Demo institution account already exists and is ready to use!",
        credentials: {
          email: demoEmail,
          password: demoPassword
        },
        account_status: "ready",
        certificates_count: certificates?.length || 0,
        existing_nft_codes: certificates?.map(cert => ({
          recipient: cert.recipient_name,
          certificate: cert.certificate_name,
          nft_code: cert.nft_code
        })) || []
      })
    }

    // For demo purposes, we'll create a user that's immediately usable
    // In production, you'd need proper email confirmation
    const adminSupabase = getSupabaseServer() // This would need admin privileges
    
    // Create the demo user account (bypassing email confirmation for demo)
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: demoEmail,
      password: demoPassword,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/institution/dashboard`,
        data: {
          role: 'institution',
          institution_name: 'MIT Demo University'
        }
      },
    })
    
    // For demo: If user creation fails due to existing user, try to get existing user
    if (authError && authError.message.includes('already registered')) {
      // Try to sign in the existing user to get their ID
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email: demoEmail,
        password: demoPassword,
      })
      
      if (signInData.user) {
        // Use existing user
        const authData = { user: signInData.user }
      }
    }

    if (authError) {
      console.error("Auth error:", authError)
      return NextResponse.json(
        { success: false, message: authError.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: "Failed to create user" },
        { status: 500 }
      )
    }

    // Create institution profile
    const { error: profileError } = await supabase
      .from("profiles")
      .upsert({
        user_id: authData.user.id,
        email: demoEmail,
        role: 'institution',
        institution_name: 'MIT Demo University',
        institution_type: 'University',
        aadhaar_verified: true, // Skip Aadhaar for demo
      })

    if (profileError) {
      console.error("Profile error:", profileError)
      return NextResponse.json(
        { success: false, message: "Failed to create profile" },
        { status: 500 }
      )
    }

    // Create demo certificates
    const demoCertificates = [
      {
        certificate_name: 'Bachelor of Science in Computer Science',
        certificate_type: 'academic',
        recipient_name: 'John Doe',
        nft_code: 'MIT2024CS001',
        description: 'Bachelor of Science degree in Computer Science with specialization in Artificial Intelligence and Machine Learning. Graduated Summa Cum Laude with GPA 3.9/4.0.',
        issue_date: '2024-05-15',
        expiry_date: null,
        metadata: {
          gpa: "3.9",
          honors: "Summa Cum Laude",
          specialization: "AI/ML",
          thesis: "Deep Learning Applications in Natural Language Processing"
        }
      },
      {
        certificate_name: 'Master of Science in Data Science',
        certificate_type: 'academic',
        recipient_name: 'Jane Smith',
        nft_code: 'MIT2024DS002',
        description: 'Master of Science degree in Data Science with thesis on "Predictive Analytics for Healthcare Applications". Graduate Research Assistant.',
        issue_date: '2023-12-20',
        expiry_date: null,
        metadata: {
          gpa: "3.95",
          thesis: "Predictive Analytics for Healthcare",
          role: "Graduate Research Assistant",
          publications: 2
        }
      },
      {
        certificate_name: 'Professional Certificate in Machine Learning',
        certificate_type: 'certification',
        recipient_name: 'Alice Johnson',
        nft_code: 'MIT2024ML003',
        description: 'Professional certificate program covering advanced machine learning techniques, deep learning, and practical applications in industry.',
        issue_date: '2024-08-30',
        expiry_date: '2027-08-30',
        metadata: {
          duration: "6 months",
          projects: 4,
          grade: "A",
          skills: ["TensorFlow", "PyTorch", "Scikit-learn", "MLOps"]
        }
      },
      {
        certificate_name: 'Advanced Artificial Intelligence Course',
        certificate_type: 'course',
        recipient_name: 'Bob Wilson',
        nft_code: 'MIT2024AI004',
        description: 'Completed advanced course in Artificial Intelligence covering search algorithms, machine learning, neural networks, and knowledge representation.',
        issue_date: '2024-05-10',
        expiry_date: null,
        metadata: {
          grade: "A+",
          final_project: "Natural Language Question Answering System",
          professor: "Prof. AI Expert"
        }
      },
      {
        certificate_name: 'Innovation Competition Winner',
        certificate_type: 'competition',
        recipient_name: 'Charlie Brown',
        nft_code: 'MIT2024IC005',
        description: 'First place winner in the annual Innovation Competition with IoT solution for smart city infrastructure.',
        issue_date: '2024-04-20',
        expiry_date: null,
        metadata: {
          position: "1st Place",
          prize: "$25,000",
          category: "Smart Cities",
          team_size: 4,
          judges_score: "95/100"
        }
      },
      {
        certificate_name: 'Doctor of Philosophy in Computer Science',
        certificate_type: 'academic',
        recipient_name: 'Diana Prince',
        nft_code: 'MIT2024PHD006',
        description: 'PhD in Computer Science with dissertation on "Quantum Algorithms for Machine Learning". Published 8 papers in top-tier conferences.',
        issue_date: '2024-06-01',
        expiry_date: null,
        metadata: {
          dissertation: "Quantum Algorithms for Machine Learning",
          advisor: "Prof. Quantum Expert",
          publications: 8,
          awards: ["Best Thesis Award", "Research Excellence Award"]
        }
      }
    ]

    // Insert certificates
    const certificatesWithInstitutionId = demoCertificates.map(cert => ({
      ...cert,
      institution_id: authData.user!.id,
      is_active: true
    }))

    const { error: certError } = await supabase
      .from("nft_certificates")
      .upsert(certificatesWithInstitutionId, { 
        onConflict: 'nft_code',
        ignoreDuplicates: false 
      })

    if (certError) {
      console.error("Certificates error:", certError)
      // Don't fail if certificates already exist
    }

    return NextResponse.json({
      success: true,
      message: "Demo institution account created successfully!",
      credentials: {
        email: demoEmail,
        password: demoPassword
      },
      institution: {
        name: "MIT Demo University",
        type: "University"
      },
      certificates_created: demoCertificates.length,
      nft_codes: demoCertificates.map(cert => ({
        recipient: cert.recipient_name,
        certificate: cert.certificate_name,
        nft_code: cert.nft_code
      })),
      email_confirmation_required: true,
      instructions: "Check your email to confirm your account, then login with the credentials provided."
    })

  } catch (error) {
    console.error("Demo institution creation error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
