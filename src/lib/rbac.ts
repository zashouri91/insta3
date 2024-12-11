export type UserRole = 'user' | 'manager' | 'admin'

// Define permissions for each role
export const rolePermissions = {
  user: [
    'view:profile',
    'edit:profile',
    'view:surveys',
    'respond:surveys',
    'view:signatures',
    'manage:signatures',
  ],
  manager: [
    'view:profile',
    'edit:profile',
    'view:surveys',
    'respond:surveys',
    'manage:surveys',
    'view:signatures',
    'manage:signatures',
    'view:users',
    'view:groups',
    'manage:groups',
    'view:locations',
    'manage:locations',
    'view:analytics',
  ],
  admin: [
    'view:profile',
    'edit:profile',
    'view:surveys',
    'respond:surveys',
    'manage:surveys',
    'view:signatures',
    'manage:signatures',
    'view:users',
    'manage:users',
    'view:groups',
    'manage:groups',
    'view:locations',
    'manage:locations',
    'view:analytics',
    'manage:organization',
    'manage:settings',
  ],
} as const

export type Permission = typeof rolePermissions[UserRole][number]

// Check if a role has a specific permission
export function hasPermission(role: UserRole, permission: Permission): boolean {
  console.log('🔍 Checking permission:', { role, permission })
  const hasPermission = rolePermissions[role]?.includes(permission) ?? false
  console.log('✅ Permission result:', { role, permission, hasPermission })
  return hasPermission
}

// Get all permissions for a role
export function getPermissions(role: UserRole): Permission[] {
  console.log('📋 Getting permissions for role:', role)
  return rolePermissions[role] ?? []
}

// Check if a role has access to a specific route
export function canAccessRoute(role: UserRole, route: string): boolean {
  console.log('🔐 Checking route access:', { role, route })
  
  // Admin has access to everything
  if (role === 'admin') {
    console.log('✅ Admin access granted for:', route)
    return true
  }

  const routePermissions: Record<string, Permission> = {
    '/dashboard': 'view:profile',
    '/management/users': 'view:users',
    '/management/groups': 'view:groups',
    '/management/locations': 'view:locations',
    '/management/surveys': 'view:surveys',
    '/signature': 'view:signatures',
    '/analytics': 'view:analytics',
    '/settings': 'manage:settings',
  }

  const requiredPermission = routePermissions[route]
  console.log('📝 Required permission:', { route, requiredPermission })
  
  if (!requiredPermission) {
    console.log('⚠️ No permission required for route:', route)
    return true
  }
  
  const hasAccess = hasPermission(role, requiredPermission)
  console.log('🎯 Access result:', { role, route, requiredPermission, hasAccess })
  return hasAccess
}
