import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

// Define route permissions
const routePermissions = {
  '/api/surveys': ['admin', 'manager', 'user'],
  '/api/surveys/create': ['admin', 'manager'],
  '/api/users': ['admin'],
  '/api/analytics': ['admin', 'manager'],
  '/api/organizations': ['admin'],
} as const

export async function rbacMiddleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient<Database>({ req, res })

  // Check if user is authenticated
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role from the database
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if the route requires specific permissions
  const path = req.nextUrl.pathname
  const requiredRoles = Object.entries(routePermissions).find(([route]) => 
    path.startsWith(route)
  )?.[1]

  if (requiredRoles && !requiredRoles.includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return res
}

// Helper function to check if user has required role
export async function hasRole(supabase: any, userId: string, requiredRole: string) {
  const { data: user } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single()

  return user?.role === requiredRole
}

// Helper function to check if user belongs to organization
export async function belongsToOrganization(supabase: any, userId: string, organizationId: string) {
  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', userId)
    .single()

  return user?.organization_id === organizationId
}
