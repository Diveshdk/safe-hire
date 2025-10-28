import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

const PUBLIC_PATHS = ["/", "/sign-in", "/sign-up", "/demo", "/debug"]
const PUBLIC_PREFIXES = ["/_next", "/favicon", "/images", "/assets", "/employee/jobs"]

export async function middleware(req: NextRequest) {
  // Skip middleware for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  // Guard Supabase envs to prevent runtime crash when variables are missing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnon) {
    console.log("[v0] Missing Supabase envs in middleware; allowing request to proceed without auth check.")
    return NextResponse.next()
  }

  const url = req.nextUrl
  const isPublic = PUBLIC_PATHS.includes(url.pathname) || PUBLIC_PREFIXES.some((p) => url.pathname.startsWith(p))

  let response = NextResponse.next()

  const supabase = createServerClient(supabaseUrl, supabaseAnon, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookies) {
        cookies.forEach(({ name, value }) => {
          response.cookies.set(name, value)
        })
      },
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // allow public routes, otherwise redirect to sign-in
    if (!isPublic) {
      const redirect = NextResponse.redirect(new URL("/sign-in", req.url))
      return redirect
    }
    return response
  }

  // Get user profile and role
  let profile = null
  try {
    const { data } = await supabase
      .from("profiles")
      .select("role, aadhaar_verified, safe_hire_id")
      .eq("user_id", user.id)
      .maybeSingle()
    profile = data
  } catch (_) {}

  // If authenticated and hitting "/", redirect based on role or to role selection
  if (url.pathname === "/") {
    if (profile?.role === "employer_admin") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url))
    } else if (profile?.role === "job_seeker") {
      return NextResponse.redirect(new URL("/employee/dashboard", req.url))
    } else if (profile?.role === "institution") {
      return NextResponse.redirect(new URL("/institution/dashboard", req.url))
    }
    // If no role is set, the page component will handle showing role selection
    return response
  }

  // Role-based route protection
  const isRecruiterRoute = url.pathname.startsWith("/recruiter")
  const isEmployeeRoute = url.pathname.startsWith("/employee")
  const isInstitutionRoute = url.pathname.startsWith("/institution")
  const isDashboardRoute = url.pathname === "/dashboard" // Legacy route

  // Redirect legacy dashboard route based on role
  if (isDashboardRoute) {
    if (profile?.role === "employer_admin") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url))
    } else if (profile?.role === "job_seeker") {
      return NextResponse.redirect(new URL("/employee/dashboard", req.url))
    } else if (profile?.role === "institution") {
      return NextResponse.redirect(new URL("/institution/dashboard", req.url))
    } else {
      return NextResponse.redirect(new URL("/", req.url))
    }
  }

  // Protect recruiter routes
  if (isRecruiterRoute && profile?.role !== "employer_admin") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Protect employee routes
  if (isEmployeeRoute && profile?.role !== "job_seeker") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // Protect institution routes
  if (isInstitutionRoute && profile?.role !== "institution") {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // For job seekers, ensure Aadhaar verification before accessing employee routes (except onboarding)
  const onAadhaarPage = url.pathname.startsWith("/aadhaar")
  if (profile?.role === "job_seeker" && !profile?.aadhaar_verified && isEmployeeRoute && !onAadhaarPage) {
    // The employee dashboard will handle showing onboarding, so let it through
    return response
  }

  // If not verified and trying to access other protected routes, send to appropriate onboarding
  if (!profile?.aadhaar_verified && !onAadhaarPage && !isPublic && (isRecruiterRoute || isEmployeeRoute)) {
    return NextResponse.redirect(new URL("/aadhaar", req.url))
  }

  // Authenticated users should not see sign-in/up if they have completed setup
  if (isPublic && (url.pathname === "/sign-in" || url.pathname === "/sign-up") && profile?.aadhaar_verified) {
    if (profile?.role === "employer_admin") {
      return NextResponse.redirect(new URL("/recruiter/dashboard", req.url))
    } else if (profile?.role === "job_seeker") {
      return NextResponse.redirect(new URL("/employee/dashboard", req.url))
    } else if (profile?.role === "institution") {
      return NextResponse.redirect(new URL("/institution/dashboard", req.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!.*\\.).*)"],
}
