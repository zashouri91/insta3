'use client'

import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter, usePathname } from 'next/navigation'
import { canAccessRoute } from '@/lib/rbac'
import type { UserRole } from '@/lib/rbac'
import { toast } from 'react-hot-toast'

export default function RoleProtectedRoute({
  children,
}: {
  children: React.ReactNode
}) {
  const [loading, setLoading] = useState(true)
  const [hasAccess, setHasAccess] = useState(false)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAccess = async () => {
      try {
        // Get the current user and their role
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser()

        if (authError) {
          console.error('Auth error:', authError)
          toast.error('Authentication error. Please sign in again.')
          router.push('/auth/login')
          return
        }

        if (!user) {
          toast.error('Please sign in to access this page')
          router.push('/auth/login')
          return
        }

        // Get the user's role from the users table
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()

        if (roleError && roleError.code === 'PGRST116') {
          console.error('Role error: No user role found', roleError)
          toast.error('User role not found. Please contact support.')
          router.push('/auth/login')
          return
        } else if (roleError) {
          console.error('Role error:', roleError)
          toast.error('Error fetching user role. Please try again.')
          return
        }

        if (!userData) {
          console.error('No user data found')
          toast.error('User profile not found. Please contact support.')
          router.push('/auth/login')
          return
        }

        console.log('User role:', userData.role)
        const hasRouteAccess = canAccessRoute(userData.role as UserRole, pathname)

        if (!hasRouteAccess) {
          toast.error('You do not have permission to access this page')
          router.push('/dashboard')
          return
        }

        setHasAccess(true)
      } catch (error) {
        console.error('Error in role check:', error)
        toast.error('An unexpected error occurred. Please try again.')
        router.push('/auth/login')
      } finally {
        setLoading(false)
      }
    }

    checkAccess()
  }, [supabase, router, pathname])

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!hasAccess) {
    return null
  }

  return <>{children}</>
}
