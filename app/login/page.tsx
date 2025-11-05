'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      // TODO: Replace with actual API call
      const response = await fetch('http://127.0.0.1:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (response.ok) {
        const data = await response.json()
        // Store token if provided
        if (data.token) {
          localStorage.setItem('token', data.token)
        }
        router.push('/dashboard')
      } else {
        const data = await response.json()
        setError(data.message || 'Invalid email or password')
      }
    } catch (err) {
      setError('Unable to connect to server. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <svg className="w-8 h-8 text-primary mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2l-2 18 2-2 2 2-2-18z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v18" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 7l3 3 3-3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l3 3 3-3" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l-1.5-1.5h3L12 20z" />
          </svg>
          <span className="text-2xl font-semibold text-gray-dark">
            WorldBuilder<span className="text-primary"></span>
          </span>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-gray-dark mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-dark mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-light"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-dark mb-2">
                Password
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-gray-light"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input type="checkbox" className="rounded border-gray-300 text-primary focus:ring-primary" />
                <span className="ml-2 text-sm text-gray">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-primary hover:text-primary-dark">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              className="w-full bg-primary text-white py-2 rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:text-primary-dark font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray hover:text-primary transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}

