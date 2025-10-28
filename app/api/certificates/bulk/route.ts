import { getSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServer();
    const { 
      event_id, 
      count, 
      batch_prefix 
    } = await request.json();

    // Check if user is authenticated and is an institution
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user profile to verify institution role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, safe_hire_id')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'institution') {
      return NextResponse.json({ error: "Access denied - Institution role required" }, { status: 403 });
    }

    // Verify the event belongs to this institution
    const { data: event, error: eventError } = await supabase
      .from('institution_events')
      .select('id, title, institution_id')
      .eq('id', event_id)
      .eq('institution_id', profile.safe_hire_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    // Validate input
    if (!count || count < 1 || count > 1000) {
      return NextResponse.json({ error: "Count must be between 1 and 1000" }, { status: 400 });
    }

    // Call the database function to create bulk certificates
    const { data: certificates, error: bulkError } = await supabase
      .rpc('simple_bulk_create_certificates', {
        p_event_id: event_id,
        p_count: count,
        p_batch_prefix: batch_prefix || `${event.title.slice(0, 10).toUpperCase()}_`
      });

    if (bulkError) {
      console.error('Bulk certificate creation error:', bulkError);
      return NextResponse.json({ 
        error: "Failed to create bulk certificates", 
        details: bulkError.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      certificates,
      message: `Successfully created ${count} certificates for ${event.title}`
    });

  } catch (error) {
    console.error('Bulk certificate API error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
