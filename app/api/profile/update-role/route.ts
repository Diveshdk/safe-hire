import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { email, new_role } = await req.json()
    
    if (!new_role || !["job_seeker", "employer_admin", "institution"].includes(new_role)) {
      return NextResponse.json({ error: "Invalid role" }, { status: 400 })
    }

    // If email is provided, verify it matches the current user
    if (email && user.email !== email) {
      return NextResponse.json({ error: "Email mismatch" }, { status: 403 })
    }

    // Get current profile
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role, safe_hire_id")
      .eq("user_id", user.id)
      .single()

    // Update the role
    const { error } = await supabase
      .from("profiles")
      .update({ role: new_role })
      .eq("user_id", user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Generate new safe_hire_id if role changed and affects prefix
    let newSafeHireId = currentProfile?.safe_hire_id
    if (currentProfile?.role !== new_role) {
      const prefix = new_role === "employer_admin" ? "EX" : new_role === "institution" ? "IN" : "JS"
      const randomCode = Math.floor(Math.random() * 1000000).toString().padStart(6, "0")
      newSafeHireId = `${prefix}${randomCode}`
      
      await supabase
        .from("profiles")
        .update({ safe_hire_id: newSafeHireId })
        .eq("user_id", user.id)
    }

    return NextResponse.json({ 
      success: true, 
      old_role: currentProfile?.role,
      new_role,
      safe_hire_id: newSafeHireId,
      user_email: user.email
    })
    
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
