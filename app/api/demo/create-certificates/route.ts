import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = getSupabaseServer()
    
    // Create demo certificates that can be used by any job seeker for testing
    // These certificates will be created with a placeholder institution_id
    // but will work for NFT verification testing

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

    // Get any existing user to use as institution_id (just for demo purposes)
    const { data: existingUsers } = await supabase
      .from("profiles")
      .select("user_id")
      .limit(1)

    let institutionId = existingUsers?.[0]?.user_id

    // If no existing users, create a placeholder that works with RLS
    if (!institutionId) {
      // Use the current service role to create certificates that bypass RLS
      institutionId = '00000000-0000-0000-0000-000000000000' // This won't work due to foreign key
    }

    // Check if demo certificates already exist
    const { data: existing } = await supabase
      .from("nft_certificates")
      .select("nft_code")
      .in("nft_code", demoCertificates.map(cert => cert.nft_code))
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Demo certificates already exist and are ready for testing!",
        nft_codes: demoCertificates.map(cert => ({
          recipient: cert.recipient_name,
          certificate: cert.certificate_name,
          nft_code: cert.nft_code
        })),
        test_instructions: "Create a job seeker account and use these NFT codes with exact recipient names for instant verification."
      })
    }

    // Insert certificates using any existing user as institution
    const certificatesWithInstitutionId = demoCertificates.map(cert => ({
      ...cert,
      institution_id: institutionId,
      is_active: true
    }))

    const { data, error } = await supabase
      .from("nft_certificates")
      .insert(certificatesWithInstitutionId)
      .select()

    if (error) {
      console.error("Error creating demo certificates:", error)
      return NextResponse.json(
        { success: false, message: "Failed to create demo certificates: " + error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Demo NFT certificates created successfully!",
      certificates_created: data.length,
      nft_codes: data.map(cert => ({
        recipient: cert.recipient_name,
        certificate: cert.certificate_name,
        nft_code: cert.nft_code
      })),
      test_instructions: "Create a job seeker account and use these NFT codes with exact recipient names for instant verification."
    })

  } catch (error) {
    console.error("Demo certificates creation error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
