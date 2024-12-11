'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SurveyBuilder from '@/components/surveys/SurveyBuilder'
import Button from '@/components/ui/Button'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'

export default function SurveysPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [isCreating, setIsCreating] = useState(false)

  const { data: surveys, isLoading } = useQuery({
    queryKey: ['surveys'],
    queryFn: async () => {
      const response = await fetch('/api/surveys')
      if (!response.ok) throw new Error('Failed to fetch surveys')
      return response.json()
    },
  })

  const createSurveyMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch('/api/surveys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to create survey')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surveys'] })
      setIsCreating(false)
      toast.success('Survey created successfully')
    },
    onError: (error) => {
      toast.error('Failed to create survey')
      console.error(error)
    },
  })

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Surveys</h1>
          <Button onClick={() => setIsCreating(true)}>
            Create New Survey
          </Button>
        </div>

        {isCreating ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-medium">Create New Survey</h2>
              <Button
                variant="ghost"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
            </div>
            <SurveyBuilder
              onSubmit={async (data) => {
                await createSurveyMutation.mutateAsync(data)
              }}
            />
          </div>
        ) : (
          <div className="grid gap-6">
            {surveys?.map((survey: any) => (
              <div
                key={survey.id}
                className="bg-white shadow rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {survey.title}
                    </h3>
                    {survey.description && (
                      <p className="mt-1 text-sm text-gray-500">
                        {survey.description}
                      </p>
                    )}
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                        {survey.questions?.length || 0} questions
                      </span>
                      {survey.is_template && (
                        <span className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-800">
                          Template
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/surveys/${survey.id}`)}
                    >
                      View Results
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push(`/surveys/${survey.id}/edit`)}
                    >
                      Edit
                    </Button>
                  </div>
                </div>
              </div>
            ))}

            {surveys?.length === 0 && (
              <div className="text-center py-12">
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No surveys yet
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new survey.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
