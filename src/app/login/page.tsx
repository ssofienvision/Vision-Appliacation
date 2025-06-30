'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Wrench } from 'lucide-react'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Get user role and redirect accordingly
        await redirectBasedOnRole(user.email)
      }
    }
    checkUser()
  }, [router])

  const redirectBasedOnRole = async (email: string | undefined) => {
    console.log('🔍 Redirecting based on role for email:', email)
    
    if (!email) {
      console.log('⚠️  No email provided, redirecting to dashboard')
      router.push('/dashboard')
      return
    }

    try {
      console.log('🔍 Checking user role in technicians table...')
      // Get user details from technicians table
      const { data: technicianData, error: techError } = await supabase
        .from('technicians')
        .select('role')
        .eq('email', email)
        .single()

      if (techError) {
        console.error('❌ Error fetching technician data:', techError)
        console.log('⚠️  Defaulting to tech-dashboard')
        router.push('/tech-dashboard')
        return
      }

      console.log('📊 Technician data:', technicianData)
      console.log('📊 User role:', technicianData?.role)

      if (technicianData?.role === 'admin') {
        console.log('✅ Redirecting admin to /dashboard')
        router.push('/dashboard')
      } else {
        console.log('✅ Redirecting technician to /tech-dashboard')
        router.push('/tech-dashboard')
      }
    } catch (error) {
      console.error('❌ Error checking user role:', error)
      // Default to tech dashboard if role check fails
      console.log('⚠️  Error occurred, defaulting to tech-dashboard')
      router.push('/tech-dashboard')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('🔍 Attempting login with email:', formData.email)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })

      if (error) {
        console.error('❌ Login error:', error)
        setError(error.message)
      } else {
        console.log('✅ Login successful:', data)
        console.log('✅ User data:', data.user)
        
        // Test immediate redirect first
        console.log('🔍 Testing immediate redirect to /dashboard...')
        router.push('/dashboard')
        
        // Then try role-based redirect
        setTimeout(async () => {
          console.log('🔍 Attempting role-based redirect...')
          await redirectBasedOnRole(formData.email)
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Unexpected login error:', error)
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="bg-blue-600 p-3 rounded-full">
            <Wrench className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          Service Dashboard
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Sign in to access your dashboard
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <div className="mt-2 text-right">
                <Link 
                  href="/reset-password" 
                  className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
                >
                  Forgot your password?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Available Users</span>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
              <p className="font-medium mb-2">For testing purposes:</p>
              <p><strong>Test Admin:</strong> test@vision-app.com</p>
              <p><strong>Password:</strong> TestPassword123!</p>
              <p className="text-xs text-gray-500 mt-2">This test user has admin privileges and is ready to use.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 