import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

// Only protect dashboard routes from unauthenticated access.
// All sign-in/sign-up/landing routing is handled client-side.
const PROTECTED_PREFIXES = ["/dashboard"]

export async function middleware(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) return NextResponse.next()

  const url = req.nextUrl

  // Only run auth check on protected routes
  const isProtected = PROTECTED_PREFIXES.some((p) => url.pathname.startsWith(p))
  if (!isProtected) return NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: { getAll() { return req.cookies.getAll() } },
  })

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(new URL("/sign-in", req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!.*\\.).*)" ],
}
