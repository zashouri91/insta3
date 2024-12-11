import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user details including organization info
  const { data: user, error } = await supabase
    .from('users')
    .select(`
      *,
      organization:organizations (
        name,
        id
      )
    `)
    .eq('id', session.user.id)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(user)
}

export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const updates = await request.json()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Update user profile
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', session.user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(data)
}
