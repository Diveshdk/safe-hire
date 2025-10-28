import { getSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const supabase = getSupabaseServer();
    const eventId = params.eventId;

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
      .select('id, institution_id')
      .eq('id', eventId)
      .eq('institution_id', profile.safe_hire_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    // Get certificates for this event
    const { data: certificates, error: certsError } = await supabase
      .from('nft_certificates')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (certsError) {
      console.error('Certificates fetch error:', certsError);
      return NextResponse.json({ 
        error: "Failed to fetch certificates", 
        details: certsError.message 
      }, { status: 500 });
    }

    return NextResponse.json(certificates || []);

  } catch (error) {
    console.error('Certificates by event API error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
