import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'
import { rbacMiddleware } from './middleware/rbac'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Refresh session if expired
  const { data: { session }, error } = await supabase.auth.getSession()

  // Handle auth for protected routes
  const isAuthPage = req.nextUrl.pathname.startsWith('/auth/')
  const isProtectedRoute = !req.nextUrl.pathname.match(
    /^\/(_next|api|auth|favicon\.ico|public)\/.*/
  )

  if (!session && isProtectedRoute) {
    const redirectUrl = new URL('/auth/signin', req.url)
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }

  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Apply RBAC middleware for API routes
  if (req.nextUrl.pathname.startsWith('/api/')) {
    return rbacMiddleware(req)
  }

  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}
