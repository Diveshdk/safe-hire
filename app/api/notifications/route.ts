import { NextRequest, NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get('limit') || '20')
    const unreadOnly = url.searchParams.get('unread_only') === 'true'

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (unreadOnly) {
      query = query.eq('is_read', false)
    }

    const { data: notifications, error: notificationsError } = await query

    if (notificationsError) {
      console.error('Notifications fetch error:', notificationsError)
      return NextResponse.json({ 
        error: "Failed to fetch notifications", 
        details: notificationsError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      notifications: notifications || []
    })

  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseServer()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { notification_ids, mark_all_read } = await request.json()

    let updateQuery

    if (mark_all_read) {
      // Mark all notifications as read
      updateQuery = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false)
    } else if (notification_ids && notification_ids.length > 0) {
      // Mark specific notifications as read
      updateQuery = supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .in('id', notification_ids)
    } else {
      return NextResponse.json({ error: "notification_ids or mark_all_read required" }, { status: 400 })
    }

    const { error: updateError } = await updateQuery

    if (updateError) {
      console.error('Notification update error:', updateError)
      return NextResponse.json({ 
        error: "Failed to update notifications", 
        details: updateError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: "Notifications marked as read"
    })

  } catch (error) {
    console.error('Notification update API error:', error)
    return NextResponse.json({ 
      error: "Internal server error",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
