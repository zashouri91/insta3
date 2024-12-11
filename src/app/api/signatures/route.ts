import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { Database } from '@/types/supabase'

// GET /api/signatures - Get user's signature
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: signature, error } = await supabase
    .from('signatures')
    .select('*')
    .eq('user_id', session.user.id)
    .single()

  if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json(signature || null)
}

// POST /api/signatures - Create/Update signature
export async function POST(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const { htmlContent } = await request.json()

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user details
  const { data: user } = await supabase
    .from('users')
    .select('name, organization_id')
    .eq('id', session.user.id)
    .single()

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  // Check if user already has a signature
  const { data: existingSignature } = await supabase
    .from('signatures')
    .select('id')
    .eq('user_id', session.user.id)
    .single()

  let result
  if (existingSignature) {
    // Update existing signature
    result = await supabase
      .from('signatures')
      .update({
        html_content: htmlContent,
        tracking_id: crypto.randomUUID(), // Generate new tracking ID for updated signature
      })
      .eq('id', existingSignature.id)
      .select()
      .single()
  } else {
    // Create new signature
    result = await supabase
      .from('signatures')
      .insert({
        user_id: session.user.id,
        html_content: htmlContent,
        tracking_id: crypto.randomUUID(),
      })
      .select()
      .single()
  }

  if (result.error) {
    return NextResponse.json({ error: result.error.message }, { status: 400 })
  }

  return NextResponse.json(result.data)
}

// GET /api/signatures/[tracking_id] - Track signature view
export async function GET_TRACKING(request: Request) {
  const supabase = createRouteHandlerClient<Database>({ cookies })
  const trackingId = request.url.split('/').pop()

  if (!trackingId) {
    return NextResponse.json({ error: 'Tracking ID required' }, { status: 400 })
  }

  const { data: signature } = await supabase
    .from('signatures')
    .select('user_id')
    .eq('tracking_id', trackingId)
    .single()

  if (!signature) {
    return NextResponse.json({ error: 'Signature not found' }, { status: 404 })
  }

  // Here you could add tracking logic, such as:
  // - Recording the view in a tracking table
  // - Updating view count
  // - Recording timestamp of view

  return NextResponse.json({ success: true })
}
