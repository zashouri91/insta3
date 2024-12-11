import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { surveyId, groupId, locationId, userId } = await request.json()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and organization
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Only admin and manager can assign surveys
  if (!['admin', 'manager'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Verify survey belongs to user's organization
  const { data: survey } = await supabase
    .from('surveys')
    .select('organization_id')
    .eq('id', surveyId)
    .single()

  if (!survey || survey.organization_id !== currentUser.organization_id) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  // Create assignment
  const { data: assignment, error } = await supabase
    .from('survey_assignments')
    .insert({
      survey_id: surveyId,
      group_id: groupId,
      location_id: locationId,
      user_id: userId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(assignment)
}

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization
  const { data: user } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  let query = supabase
    .from('survey_assignments')
    .select(`
      *,
      survey:surveys (
        title,
        description
      ),
      group:groups (
        name
      ),
      location:locations (
        name
      ),
      user:users (
        name,
        email
      )
    `)
    .eq('surveys.organization_id', user.organization_id)

  if (surveyId) {
    query = query.eq('survey_id', surveyId)
  }

  const { data: assignments, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(assignments)
}

export async function DELETE(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(request.url)
  const assignmentId = searchParams.get('id')

  if (!assignmentId) {
    return NextResponse.json({ error: 'Assignment ID required' }, { status: 400 })
  }

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and organization
  const { data: currentUser } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!currentUser) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Only admin and manager can delete assignments
  if (!['admin', 'manager'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { error } = await supabase
    .from('survey_assignments')
    .delete()
    .eq('id', assignmentId)
    .eq('surveys.organization_id', currentUser.organization_id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Assignment deleted successfully' })
}
