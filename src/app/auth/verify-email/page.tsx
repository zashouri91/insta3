'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

export default function VerifyEmail() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.push('/dashboard')
    }
  }, [user, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Check your email
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We sent you an email verification link. Please check your email and click the link to verify your account.
          </p>
          <p className="mt-4 text-center text-sm text-gray-500">
            Once verified, you&apos;ll be automatically redirected to your dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}
