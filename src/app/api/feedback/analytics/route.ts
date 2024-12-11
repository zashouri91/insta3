import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { searchParams } = new URL(request.url)
  const surveyId = searchParams.get('surveyId')
  const groupBy = searchParams.get('groupBy') // Optional: group, location
  const timeRange = searchParams.get('timeRange') // Optional: day, week, month, year

  if (!surveyId) {
    return NextResponse.json({ error: 'Survey ID required' }, { status: 400 })
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

  // Only admin and manager can view analytics
  if (!['admin', 'manager'].includes(currentUser.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Get survey questions
  const { data: questions } = await supabase
    .from('survey_questions')
    .select('*')
    .eq('survey_id', surveyId)
    .order('order_index')

  // Get all responses and answers
  let query = supabase
    .from('survey_responses')
    .select(`
      id,
      created_at,
      respondent:users (
        id,
        name,
        email,
        group_id,
        location_id
      ),
      answers:survey_answers (
        question_id,
        answer_value
      )
    `)
    .eq('survey_id', surveyId)

  // Apply time range filter if specified
  if (timeRange) {
    const now = new Date()
    let startDate = new Date()
    
    switch (timeRange) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1)
        break
    }

    query = query.gte('created_at', startDate.toISOString())
  }

  const { data: responses, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  // Process analytics for each question
  const analytics = questions?.map(question => {
    const questionAnswers = responses?.flatMap(response => 
      response.answers?.filter(a => a.question_id === question.id) || []
    )

    let analyticsData: any = {
      question: question.question_text,
      type: question.question_type,
      totalResponses: questionAnswers.length,
    }

    // Process analytics based on question type
    switch (question.question_type) {
      case 'rating':
        analyticsData.analytics = {
          average: questionAnswers.reduce((sum, a) => sum + (a.answer_value as number), 0) / questionAnswers.length,
          distribution: questionAnswers.reduce((dist: Record<number, number>, a) => {
            dist[a.answer_value as number] = (dist[a.answer_value as number] || 0) + 1
            return dist
          }, {}),
        }
        break

      case 'multiple_choice':
        analyticsData.analytics = questionAnswers.reduce((dist: Record<string, number>, a) => {
          dist[a.answer_value as string] = (dist[a.answer_value as string] || 0) + 1
          return dist
        }, {})
        break

      case 'text':
        // For text responses, we might want to do sentiment analysis or keyword extraction
        // For now, just return the count
        analyticsData.analytics = {
          responseCount: questionAnswers.length,
        }
        break
    }

    // Add group/location breakdown if requested
    if (groupBy) {
      const breakdown = responses?.reduce((acc: Record<string, number>, response) => {
        const key = response.respondent?.[groupBy === 'group' ? 'group_id' : 'location_id']
        if (key) {
          acc[key] = (acc[key] || 0) + 1
        }
        return acc
      }, {})
      analyticsData.breakdown = breakdown
    }

    return analyticsData
  })

  return NextResponse.json(analytics)
}

// Helper function to calculate percentages
function calculatePercentages(counts: Record<string | number, number>): Record<string | number, number> {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0)
  return Object.entries(counts).reduce((acc, [key, count]) => {
    acc[key] = (count / total) * 100
    return acc
  }, {} as Record<string | number, number>)
}
