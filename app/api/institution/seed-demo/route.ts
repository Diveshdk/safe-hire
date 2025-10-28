import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST() {
  try {
    const supabase = getSupabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Verify user is an institution
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle()

    if (profile?.role !== "institution") {
      return NextResponse.json(
        { success: false, message: "Access denied. Institution role required." },
        { status: 403 }
      )
    }

    // Check if demo certificates already exist for this institution
    const { data: existing } = await supabase
      .from("nft_certificates")
      .select("id")
      .eq("institution_id", user.id)
      .limit(1)

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { success: false, message: "Demo certificates already exist for this institution" },
        { status: 400 }
      )
    }

    // Demo certificates data
    const demoCertificates = [
      {
        certificate_name: 'Bachelor of Science in Computer Science',
        certificate_type: 'academic',
        recipient_name: 'John Doe',
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

    // Generate NFT codes and insert certificates
    const certificatesWithNftCodes = []
    
    for (const cert of demoCertificates) {
      // Generate unique NFT code
      const { data: nftCode, error: nftError } = await supabase
        .rpc('generate_nft_code')

      if (nftError || !nftCode) {
        console.error("Error generating NFT code:", nftError)
        continue
      }

      certificatesWithNftCodes.push({
        institution_id: user.id,
        nft_code: nftCode,
        is_active: true,
        ...cert
      })
    }

    // Insert all certificates
    const { data, error } = await supabase
      .from("nft_certificates")
      .insert(certificatesWithNftCodes)
      .select()

    if (error) {
      console.error("Error creating demo certificates:", error)
      return NextResponse.json(
        { success: false, message: "Failed to create demo certificates" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Successfully created ${data.length} demo certificates`,
      nft_codes: data.map(cert => ({
        recipient: cert.recipient_name,
        certificate: cert.certificate_name,
        nft_code: cert.nft_code
      }))
    })

  } catch (error) {
    console.error("Demo certificates creation API error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
