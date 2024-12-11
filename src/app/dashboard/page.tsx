'use client'

import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import { useEffect, useState } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  ChartBarIcon,
  DocumentTextIcon,
  UserGroupIcon,
  EnvelopeIcon,
} from '@heroicons/react/24/outline'

interface Stats {
  totalSurveys: number
  totalFeedback: number
  activeUsers: number
  emailsSent: number
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalSurveys: 0,
    totalFeedback: 0,
    activeUsers: 0,
    emailsSent: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    async function fetchStats() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return

        // Get user's organization
        const { data: userData } = await supabase
          .from('users')
          .select('organization_id')
          .eq('id', user.id)
          .single()
        
        if (!userData) return

        // Fetch total surveys for the organization
        const { count: surveysCount } = await supabase
          .from('surveys')
          .select('*', { count: 'exact' })
          .eq('organization_id', userData.organization_id)

        // Fetch total feedback for the organization
        const { count: feedbackCount } = await supabase
          .from('feedback')
          .select('feedback.id', { count: 'exact' })
          .eq('surveys.organization_id', userData.organization_id)
          .join('surveys', 'feedback.survey_id', 'surveys.id')

        // Fetch active users in the organization
        const { count: usersCount } = await supabase
          .from('users')
          .select('*', { count: 'exact' })
          .eq('organization_id', userData.organization_id)

        // Fetch total signatures (as a proxy for emails sent)
        const { count: signaturesCount } = await supabase
          .from('signatures')
          .select('signatures.id', { count: 'exact' })
          .eq('users.organization_id', userData.organization_id)
          .join('users', 'signatures.user_id', 'users.id')

        setStats({
          totalSurveys: surveysCount || 0,
          totalFeedback: feedbackCount || 0,
          activeUsers: usersCount || 0,
          emailsSent: signaturesCount || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [supabase])

  const stats_items = [
    {
      name: 'Total Surveys',
      value: stats.totalSurveys,
      icon: DocumentTextIcon,
      change: '+4.75%',
      changeType: 'positive',
    },
    {
      name: 'Total Responses',
      value: stats.totalFeedback,
      icon: ChartBarIcon,
      change: '+54.02%',
      changeType: 'positive',
    },
    {
      name: 'Active Users',
      value: stats.activeUsers,
      icon: UserGroupIcon,
      change: '+12.05%',
      changeType: 'positive',
    },
    {
      name: 'Emails Sent',
      value: stats.emailsSent,
      icon: EnvelopeIcon,
      change: '+54.02%',
      changeType: 'positive',
    },
  ]

  return (
    <ProtectedRoute>
      <AppLayout>
        <div className="space-y-6">
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
          
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {stats_items.map((item) => (
              <div
                key={item.name}
                className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
              >
                <dt>
                  <div className="absolute rounded-md bg-blue-500 p-3">
                    <item.icon
                      className="h-6 w-6 text-white"
                      aria-hidden="true"
                    />
                  </div>
                  <p className="ml-16 truncate text-sm font-medium text-gray-500">
                    {item.name}
                  </p>
                </dt>
                <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                  <p className="text-2xl font-semibold text-gray-900">
                    {item.value}
                  </p>
                  <p
                    className={`ml-2 flex items-baseline text-sm font-semibold ${
                      item.changeType === 'positive'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {item.change}
                  </p>
                </dd>
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
            <div className="mt-4 rounded-lg bg-white shadow">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading...</div>
              ) : stats.totalFeedback === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No recent activity
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </AppLayout>
    </ProtectedRoute>
  )
}
