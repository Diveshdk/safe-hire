import { getSupabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = getSupabaseServer();
    const eventId = params.id;

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

    // Get event details and verify it belongs to this institution
    const { data: event, error: eventError } = await supabase
      .from('institution_events')
      .select('*')
      .eq('id', eventId)
      .eq('institution_id', profile.safe_hire_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found or access denied" }, { status: 404 });
    }

    return NextResponse.json(event);

  } catch (error) {
    console.error('Event fetch API error:', error);
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
