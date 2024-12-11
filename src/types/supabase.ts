export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      groups: {
        Row: {
          id: string
          name: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          name: string
          organization_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'user'
          organization_id: string
          group_id: string | null
          location_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role?: 'admin' | 'manager' | 'user'
          organization_id: string
          group_id?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'user'
          organization_id?: string
          group_id?: string | null
          location_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      signatures: {
        Row: {
          id: string
          user_id: string
          html_content: string
          tracking_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          html_content: string
          tracking_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          html_content?: string
          tracking_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      surveys: {
        Row: {
          id: string
          name: string
          organization_id: string
          is_template: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          organization_id: string
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          organization_id?: string
          is_template?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          survey_id: string
          text: string
          type: string
          options: string[]
          required: boolean
          order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          survey_id: string
          text: string
          type: string
          options?: string[]
          required?: boolean
          order: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          survey_id?: string
          text?: string
          type?: string
          options?: string[]
          required?: boolean
          order?: number
          created_at?: string
          updated_at?: string
        }
      }
      feedback: {
        Row: {
          id: string
          signature_id: string
          survey_id: string
          user_id: string
          initial_rating: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          signature_id: string
          survey_id: string
          user_id: string
          initial_rating: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          signature_id?: string
          survey_id?: string
          user_id?: string
          initial_rating?: number
          created_at?: string
          updated_at?: string
        }
      }
      answers: {
        Row: {
          id: string
          feedback_id: string
          question_id: string
          value: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          feedback_id: string
          question_id: string
          value: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          feedback_id?: string
          question_id?: string
          value?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'user'
    }
  }
}
