import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'

type UserResponse = {
  data: Database['public']['Tables']['users']['Row'] | null
  error: Error | null
}

export const authService = {
  async signUp(email: string, password: string, name: string, organizationId: string) {
    const supabase = createClientComponentClient<Database>()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      throw authError
    }

    if (authData.user) {
      // Create user profile in users table
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          name,
          organization_id: organizationId,
          role: 'user',
        })

      if (profileError) {
        throw profileError
      }
    }

    return authData
  },

  async signIn(email: string, password: string) {
    const supabase = createClientComponentClient<Database>()
    console.log('🔑 Attempting sign in for:', email)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ Sign in error:', error)
      throw error
    }

    console.log('✅ Sign in successful:', data)
    return data
  },

  async signOut() {
    const supabase = createClientComponentClient<Database>()
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },

  async getCurrentUser(): Promise<UserResponse> {
    const supabase = createClientComponentClient<Database>()
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) throw sessionError
      if (!session?.user) return { data: null, error: new Error('No user session') }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error('Unknown error') }
    }
  },

  async resetPassword(email: string) {
    const supabase = createClientComponentClient<Database>()
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    if (error) throw error
  },

  async updatePassword(password: string) {
    const supabase = createClientComponentClient<Database>()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) throw error
  }
}
