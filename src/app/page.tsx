'use client'

import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { user } = useAuth()

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="fixed w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">Feedback</span>
          </div>
          <div>
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/auth/signin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                Get Started
              </Link>
            )}
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <main>
        <div className="relative">
          <div className="max-w-7xl mx-auto pt-32 pb-24 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                <span className="block">Collect Customer Feedback</span>
                <span className="block text-primary-600">Through Email Signatures</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                Transform every email into an opportunity for valuable customer feedback. Simple, seamless, and powerful.
              </p>
              <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                <div className="rounded-md shadow">
                  <Link
                    href="/auth/signin"
                    className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 md:py-4 md:text-lg md:px-10"
                  >
                    Start Collecting Feedback
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Section */}
        <div className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
              {/* Feature 1 */}
              <div className="relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">Interactive Signatures</h3>
                <p className="mt-2 text-base text-gray-500">
                  Embed feedback collection directly in your email signatures with just one click.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">Real-time Analytics</h3>
                <p className="mt-2 text-base text-gray-500">
                  Track and analyze feedback in real-time with comprehensive dashboards.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="relative p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <h3 className="text-lg font-medium text-gray-900">Team Management</h3>
                <p className="mt-2 text-base text-gray-500">
                  Organize feedback collection by teams, locations, and departments.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-primary-700">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to get started?</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-primary-200">
              Start collecting valuable customer feedback today.
            </p>
            <Link
              href="/auth/signin"
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 sm:w-auto"
            >
              Sign up for free
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0">
            <p className="text-center text-base text-gray-400">
              &copy; {new Date().getFullYear()} Feedback System. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
