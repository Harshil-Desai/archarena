import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  const isSessionRoute = nextUrl.pathname.startsWith("/session")
  const isApiSessionRoute = nextUrl.pathname.startsWith("/api/session")
  const isApiAiRoute = nextUrl.pathname.startsWith("/api/ai")

  // Protect drawing session pages
  if (isSessionRoute && !isLoggedIn) {
    const loginUrl = new URL("/login", nextUrl.origin)
    loginUrl.searchParams.set("from", nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Protect AI API routes — return 401 instead of redirect
  if ((isApiSessionRoute || isApiAiRoute) && !isLoggedIn) {
    return NextResponse.json(
      { error: "unauthorized" },
      { status: 401 }
    )
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/session/:path*",
    "/api/session/:path*",
    "/api/ai/:path*",
  ],
}
