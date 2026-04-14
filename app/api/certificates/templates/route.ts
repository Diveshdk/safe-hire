import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

/**
 * GET /api/certificates/templates
 * List templates for the organisation
 */
export async function GET() {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  const { data: templates, error } = await supabase
    .from("certificate_templates")
    .select("*")
    .eq("org_user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, templates })
}

/**
 * POST /api/certificates/templates
 * Save a new certificate template
 */
export async function POST(req: Request) {
  const supabase = getSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ ok: false, message: "Unauthorized" }, { status: 401 })

  try {
    const { template_name, organization_name, config } = await req.json()

    if (!template_name || !config) {
      return NextResponse.json({ ok: false, message: "Template name and config are required" }, { status: 400 })
    }

    // Ensure storage bucket exists (using Admin client)
    const adminClient = getSupabaseAdmin()
    const { data: buckets } = await adminClient.storage.listBuckets()
    if (!buckets?.some(b => b.name === "certificates")) {
      await adminClient.storage.createBucket("certificates", {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/svg+xml", "application/pdf"],
        fileSizeLimit: 10485760 // 10MB
      })
    }

    const { data: template, error } = await supabase
      .from("certificate_templates")
      .upsert({
        org_user_id: user.id,
        template_name,
        organization_name,
        config,
        updated_at: new Date().toISOString()
      }, { onConflict: "org_user_id, template_name" })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, template })
  } catch (error: any) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 })
  }
}
