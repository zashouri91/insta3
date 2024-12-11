'use client'

import { useState } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import FeedbackAnalytics from '@/components/feedback/FeedbackAnalytics'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Button from '@/components/ui/Button'

export default function AnalyticsPage() {
  const queryClient = useQueryClient()
  const [selectedSurvey, setSelectedSurvey] = useState<string | null>(null)

  const { data: surveys, isLoading: isLoadingSurveys } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await fetch('/api/surveys')
      if (!response.ok) throw new Error('Failed to fetch surveys')
      return response.json()
    },
  })

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery({
    queryKey: ['analytics', selectedSurvey],
    queryFn: async () => {
      if (!selectedSurvey) return null
      const response = await fetch(`/api/feedback/analytics?surveyId=${selectedSurvey}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      return response.json()
    },
    enabled: !!selectedSurvey,
  })

  if (isLoadingSurveys) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500">
            View feedback analytics and insights across your surveys.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700">
              Select Survey
              <select
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedSurvey || ''}
                onChange={(e) => setSelectedSurvey(e.target.value || null)}
              >
                <option value="">Choose a survey...</option>
                {surveys?.map((survey: any) => (
                  <option key={survey.id} value={survey.id}>
                    {survey.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedSurvey ? (
            isLoadingAnalytics ? (
              <div className="animate-pulse space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-48 bg-gray-200 rounded"></div>
                ))}
              </div>
            ) : (
              <FeedbackAnalytics
                surveyId={selectedSurvey}
                data={analytics || []}
                onRefresh={async () => {
                  await queryClient.invalidateQueries({
                    queryKey: ['analytics', selectedSurvey],
                  })
                }}
              />
            )
          ) : (
            <div className="text-center py-12">
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No survey selected
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Choose a survey from the dropdown above to view its analytics.
              </p>
            </div>
          )}
        </div>

        {selectedSurvey && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Export Options</h2>
            <div className="flex space-x-4">
              <Button
                variant="secondary"
                onClick={() => {
                  // Implement CSV export
                  console.log('Export CSV')
                }}
              >
                Export as CSV
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  // Implement PDF export
                  console.log('Export PDF')
                }}
              >
                Export as PDF
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
