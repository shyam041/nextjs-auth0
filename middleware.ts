import { NextRequest, NextResponse } from 'next/server'
import { auth0 } from './lib/auth0'

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Let Auth0 handle authentication for auth-related routes
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return auth0.middleware(request)
  }
  const { origin } = new URL(request.url)  
  // Retrieve the session to check if the user is authenticated
  const session = await auth0.getSession()
  // If the user does not have a session, redirect to login page
  if (!session) {
    return NextResponse.redirect(`${origin}/auth/login`)
  }
  // Allow the request to continue if the session is valid
  return NextResponse.next()
}
// Configuration for the middleware to apply to all routes
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|api).*)', // Protect all routes except static files, metadata, and API routes
  ],
}
