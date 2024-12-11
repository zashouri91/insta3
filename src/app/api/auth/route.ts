import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function POST(request: Request) {
  const { email, password, name, organizationId } = await request.json()
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // Create the user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        organization_id: organizationId,
      },
    },
  })

  if (authError) {
    return NextResponse.json({ error: authError.message }, { status: 400 })
  }

  // Create the user record in our users table
  const { error: dbError } = await supabase
    .from('users')
    .insert({
      id: authData.user!.id,
      email,
      name,
      organization_id: organizationId,
      role: 'user', // Default role
    })

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'User created successfully' })
}

export async function PUT(request: Request) {
  const { userId, role } = await request.json()
  const supabase = createRouteHandlerClient<Database>({ cookies })

  // Get the current user's session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get the current user's role
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  // Only admins can change roles
  if (currentUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Update the user's role
  const { error } = await supabase
    .from('users')
    .update({ role })
    .eq('id', userId)
    .eq('organization_id', currentUser.organization_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Role updated successfully' })
}
