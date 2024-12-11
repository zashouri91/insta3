import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

// POST /api/feedback - Submit survey response
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { surveyId, answers, signatureId } = await request.json()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create survey response
  const { data: response, error: responseError } = await supabase
    .from('survey_responses')
    .insert({
      survey_id: surveyId,
      respondent_id: session.user.id,
      signature_id: signatureId,
      completed: true,
    })
    .select()
    .single()

  if (responseError) {
    return NextResponse.json({ error: responseError.message }, { status: 400 })
  }

  // Create answers
  const answersToInsert = Object.entries(answers).map(([questionId, value]) => ({
    response_id: response.id,
    question_id: questionId,
    answer_value: value,
  }))

  const { error: answersError } = await supabase
    .from('survey_answers')
    .insert(answersToInsert)

  if (answersError) {
    return NextResponse.json({ error: answersError.message }, { status: 400 })
  }

  return NextResponse.json(response)
}

// GET /api/feedback - Get feedback results
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and organization
  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Verify survey belongs to user's organization
  const { data: survey } = await supabase
    .from('surveys')
    .select('organization_id')
    .eq('id', surveyId)
    .single()

  if (!survey || survey.organization_id !== user.organization_id) {
    return NextResponse.json({ error: 'Survey not found' }, { status: 404 })
  }

  // Get all responses and answers
  const { data: responses, error } = await supabase
    .from('survey_responses')
    .select(`
      *,
      survey_answers (
        question_id,
        answer_value
      ),
      respondent:users (
        name,
        email
      )
    `)
    .eq('survey_id', surveyId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(responses)
}

// GET /api/feedback/analytics - Get feedback analytics
export async function GET_ANALYTICS(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's role and organization
  const { data: user } = await supabase
    .from('users')
    .select('role, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Only admin and manager can view analytics
  if (!['admin', 'manager'].includes(user.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get survey questions
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('order_index')

  // Get all answers for analysis
  const { data: answers } = await supabase
    .from('survey_answers')
    .select(`
      answer_value,
      question_id,
      response:survey_responses (
        created_at,
        respondent:users (
          group_id,
          location_id
        )
      )
    `)
    .eq('survey_responses.survey_id', surveyId)

  // Process analytics
  const analytics = questions?.map(question => {
    const questionAnswers = answers?.filter(a => a.question_id === question.id) || []
    
    return {
      question: question.question_text,
      type: question.question_type,
      totalResponses: questionAnswers.length,
      // Add specific analytics based on question type
      // e.g., average for numeric, distribution for multiple choice, etc.
      analytics: processQuestionAnalytics(question, questionAnswers),
    }
  })

  return NextResponse.json(analytics)
}

function processQuestionAnalytics(question: any, answers: any[]) {
  switch (question.question_type) {
    case 'rating':
      return {
        average: answers.reduce((sum, a) => sum + (a.answer_value as number), 0) / answers.length,
        distribution: answers.reduce((dist: Record<number, number>, a) => {
          dist[a.answer_value as number] = (dist[a.answer_value as number] || 0) + 1
          return dist
        }, {})
      }
    case 'multiple_choice':
      return answers.reduce((dist: Record<string, number>, a) => {
        dist[a.answer_value as string] = (dist[a.answer_value as string] || 0) + 1
        return dist
      }, {})
    // Add more types as needed
    default:
      return {}
  }
}
