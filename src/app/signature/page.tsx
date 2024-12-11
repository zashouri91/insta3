'use client'

import { useEffect } from 'react'
import DashboardLayout from '@/components/layout/DashboardLayout'
import SignatureGenerator from '@/components/signatures/SignatureGenerator'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useUser } from '@supabase/auth-helpers-react'

export default function SignaturePage() {
  const user = useUser()
  const queryClient = useQueryClient()

  const { data: signature, isLoading } = useQuery({
    queryKey: ['signature'],
    queryFn: async () => {
      const response = await fetch('/api/signatures')
      if (!response.ok) throw new Error('Failed to fetch signature')
      return response.json()
    },
  })

  const { data: userData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['user-details'],
    queryFn: async () => {
      const response = await fetch('/api/users/me')
      if (!response.ok) throw new Error('Failed to fetch user details')
      return response.json()
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (htmlContent: string) => {
      const response = await fetch('/api/signatures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ htmlContent }),
      })
      if (!response.ok) throw new Error('Failed to save signature')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['signature'] })
    },
  })

  if (isLoading || isLoadingUser) {
    return (
      <DashboardLayout>
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Signature</h1>
          <p className="mt-1 text-sm text-gray-500">
            Create your professional email signature with tracking capabilities.
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <SignatureGenerator
            onSave={async (htmlContent) => {
              await saveMutation.mutateAsync(htmlContent)
            }}
            initialData={{
              name: userData?.name || '',
              title: userData?.title || '',
              email: user?.email || '',
              phone: userData?.phone || '',
              company: userData?.organization?.name || '',
            }}
          />
        </div>

        {signature && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium mb-4">Current Signature</h2>
            <div
              dangerouslySetInnerHTML={{ __html: signature.html_content }}
              className="border rounded-md p-4"
            />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
