import { NextResponse } from "next/server"
import { getSupabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  
  // "next" is where we want to send the user after successful auth exchange.
  // Default to root if no "next" is provided.
  const next = searchParams.get("next") ?? "/"

  if (code) {
    const supabase = getSupabaseServer()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // If we are on a recovery flow, redirect to the "next" destination (reset-password)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // If there was an error or no code, redirect either to the next page (which will handle session check)
  // or a fallback error page if necessary.
  return NextResponse.redirect(`${origin}${next}`)
}
