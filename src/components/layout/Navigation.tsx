'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  ChartBarIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  UsersIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import type { UserRole } from '@/lib/rbac'
import { canAccessRoute } from '@/lib/rbac'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  {
    name: 'Management',
    items: [
      { name: 'Users', href: '/management/users', icon: UsersIcon },
      { name: 'Groups', href: '/management/groups', icon: UserGroupIcon },
      { name: 'Locations', href: '/management/locations', icon: MapPinIcon },
      {
        name: 'Surveys',
        href: '/management/surveys',
        icon: ClipboardDocumentListIcon,
      },
    ],
  },
  { name: 'Email Signature', href: '/signature', icon: EnvelopeIcon },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
]

export default function Navigation() {
  const pathname = usePathname()
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<UserRole>('user')
  const supabase = createClientComponentClient()

  useEffect(() => {
    console.log('=== Navigation Component Mount ===')
    const getUser = async () => {
      console.log('🔍 Fetching user session...')
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('📱 Session result:', { session, sessionError })
        
        if (sessionError) {
          console.error('❌ Session error:', sessionError)
          return
        }

        if (!session?.user) {
          console.log('⚠️ No active session')
          return
        }

        const user = session.user
        console.log('✅ User authenticated:', user.email)
        setUser(user)
        
        // Directly query the user role using the auth user ID
        const { data: userData, error: roleError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single()
        
        console.log('👤 User data result:', { userData, roleError })
        
        if (roleError) {
          console.error('❌ Role error:', roleError)
          return
        }

        if (userData) {
          console.log('✅ Setting user role to:', userData.role)
          setUserRole(userData.role as UserRole)
        }
      } catch (error) {
        console.error('❌ Unexpected error:', error)
      }
    }

    getUser()
  }, [supabase])

  // Filter navigation items based on user role
  const filteredNavigation = navigation.map(item => {
    if ('items' in item) {
      const filteredItems = item.items.filter(subItem => {
        const hasAccess = canAccessRoute(userRole, subItem.href)
        console.log(`🔐 Access to ${subItem.href}:`, { userRole, hasAccess })
        return hasAccess
      })
      return filteredItems.length > 0 ? { ...item, items: filteredItems } : null
    }
    const hasAccess = canAccessRoute(userRole, item.href)
    console.log(`🔐 Access to ${item.href}:`, { userRole, hasAccess })
    return hasAccess ? item : null
  }).filter(Boolean)

  console.log('📋 Final navigation:', { userRole, items: filteredNavigation })

  return (
    <nav className="flex flex-col flex-grow">
      <div className="space-y-4">
        {filteredNavigation.map((item) => {
          if (item && 'items' in item) {
            // Only show sections that have visible items
            if (item.items.length === 0) return null
            
            return (
              <div key={item.name} className="space-y-1">
                <h3 className="px-3 text-sm font-semibold text-gray-500">
                  {item.name}
                </h3>
                {item.items.map((subItem) => {
                  const isActive = pathname === subItem.href
                  return (
                    <Link
                      key={subItem.name}
                      href={subItem.href}
                      className={twMerge(
                        'group flex items-center px-3 py-2 text-sm font-medium rounded-md ml-2',
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <subItem.icon
                        className={twMerge(
                          'mr-3 h-5 w-5',
                          isActive
                            ? 'text-gray-500'
                            : 'text-gray-400 group-hover:text-gray-500'
                        )}
                        aria-hidden="true"
                      />
                      {subItem.name}
                    </Link>
                  )
                })}
              </div>
            )
          } else if (item) {
            // This is a single item
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={twMerge(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <item.icon
                  className={twMerge(
                    'mr-3 h-6 w-6',
                    isActive
                      ? 'text-gray-500'
                      : 'text-gray-400 group-hover:text-gray-500'
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            )
          }
          return null
        })}
      </div>

      <div className="mt-auto pt-10">
        <div className="space-y-1">
          <div className="px-2 py-2">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-600">
                    {user?.email?.[0].toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
