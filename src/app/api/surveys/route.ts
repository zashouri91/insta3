import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

// GET /api/surveys - List surveys for organization
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(request.url)
  const isTemplate = searchParams.get('isTemplate') === 'true'

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

  // Fetch surveys for the organization
  const { data: surveys, error } = await supabase
    .from('surveys')
    .select(`
      *,
      survey_questions (
        id,
        question_text,
        question_type,
        options,
        required,
        order_index
      )
    `)
    .eq('organization_id', user.organization_id)
    .eq('is_template', isTemplate)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(surveys)
}

// POST /api/surveys - Create new survey
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { title, description, questions, isTemplate } = await request.json()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's organization
  const { data: user } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Only admin and manager can create surveys
  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Create survey
  const { data: survey, error: surveyError } = await supabase
    .from('surveys')
    .insert({
      title,
      description,
      organization_id: user.organization_id,
      created_by: session.user.id,
      is_template: isTemplate || false,
    })
    .select()
    .single()

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 400 })
  }

  // Create questions
  const questionsToInsert = questions.map((q: any, index: number) => ({
    survey_id: survey.id,
    question_text: q.text,
    question_type: q.type,
    options: q.options,
    required: q.required,
    order_index: index,
  }))

  const { error: questionsError } = await supabase
    .from('survey_questions')
    .insert(questionsToInsert)

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 400 })
  }

  return NextResponse.json(survey)
}

// PUT /api/surveys - Update survey
export async function PUT(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { id, title, description, questions } = await request.json()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify user has access to this survey
  const { data: survey } = await supabase
    .from('surveys')
    .select('organization_id, created_by')
    .eq('id', id)
    .single()

  if (!survey) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  // Get user's role
  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user has permission to edit
  if (user.organization_id !== survey.organization_id ||
      (!['admin', 'manager'].includes(user.role) && survey.created_by !== session.user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Update survey
  const { error: surveyError } = await supabase
    .from('surveys')
    .update({ title, description })
    .eq('id', id)

  if (surveyError) {
    return NextResponse.json({ error: surveyError.message }, { status: 400 })
  }

  // Delete existing questions
  await supabase
    .from('survey_questions')
    .delete()
    .eq('survey_id', id)

  // Create new questions
  const questionsToInsert = questions.map((q: any, index: number) => ({
    survey_id: id,
    question_text: q.text,
    question_type: q.type,
    options: q.options,
    required: q.required,
    order_index: index,
  }))

  const { error: questionsError } = await supabase
    .from('survey_questions')
    .insert(questionsToInsert)

  if (questionsError) {
    return NextResponse.json({ error: questionsError.message }, { status: 400 })
  }

  return NextResponse.json({ message: 'Survey updated successfully' })
}
