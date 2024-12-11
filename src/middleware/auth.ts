import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  try {
    // Refresh session if exists
    const { data: { session } } = await supabase.auth.getSession()

    // If there's a session, ensure user record exists
    if (session?.user) {
      const { data: user } = await supabase
        .from('users')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (!user) {
        // Create user record if it doesn't exist
        await supabase
          .from('users')
          .insert({
            id: session.user.id,
            email: session.user.email,
            role: 'admin', // Set as admin for now
          })
      }
    }

    // If there's no session and the path isn't public, redirect to sign in
    if (!session) {
      const requestUrl = new URL(req.url)
      const isPublicPath = [
        '/auth/signin',
        '/auth/signup',
        '/auth/reset-password'
      ].includes(requestUrl.pathname)

      if (!isPublicPath) {
        return NextResponse.redirect(new URL('/auth/signin', req.url))
      }
    }

    // If there's a session and trying to access auth pages, redirect to dashboard
    if (session) {
      const requestUrl = new URL(req.url)
      const isAuthPath = requestUrl.pathname.startsWith('/auth/')
      
      if (isAuthPath) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return res
  } catch (error) {
    console.error('Error in auth middleware:', error)
    // If there's an error, redirect to sign in
    return NextResponse.redirect(new URL('/auth/signin', req.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - api routes (they handle their own auth)
     * - static files
     * - public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}
