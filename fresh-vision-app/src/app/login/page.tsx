'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Wrench } from 'lucide-react'

export default function Login() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [debugInfo, setDebugInfo] = useState('')

  useEffect(() => {
    console.log('🔍 Login page loaded - checking Supabase connection')
    checkSupabaseConnection()
  }, [])

  const checkSupabaseConnection = async () => {
    try {
      console.log('🔍 Testing Supabase connection...')
      console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
      console.log('🔍 Anon Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
      
      // Try to get the Supabase client info first
      const { data, error } = await supabase.from('technicians').select('count').limit(1)
      
      console.log('🔍 Connection test result:', { data, error })
      
      if (error) {
        console.error('❌ Supabase connection failed:', error)
        setDebugInfo(`Connection failed: ${error.message}`)
      } else {
        console.log('✅ Supabase connection successful')
        setDebugInfo('Supabase connection successful')
      }
    } catch (error) {
      console.error('❌ Supabase connection error:', error)
      setDebugInfo(`Connection error: ${error}`)
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
  
    console.log('🔍 Attempting SUPABASE login with email:', formData.email)
  
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      })
  
      console.log('🔍 Supabase login result:', { data, error })
  
      if (error) {
        console.error('❌ Supabase login error:', error)
        setError(error.message)
        setDebugInfo(`Login failed: ${error.message}`)
      } else {
        console.log('✅ Supabase login successful:', data)
        setDebugInfo(`Login successful for: ${data.user?.email}`)
        
        // Force redirect to dashboard
        console.log('🔍 Redirecting to dashboard...')
        router.push('/dashboard')
        
        // Also try window.location as backup
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error) {
      console.error('❌ Unexpected login error:', error)
      setError('An unexpected error occurred')
      setDebugInfo(`Unexpected error: ${error}`)
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
          Sign in with Supabase Authentication
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Debug Info */}
          {debugInfo && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="text-sm text-blue-800">🔍 {debugInfo}</div>
            </div>
          )}

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
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  className="appearance-none block w-full px-3 py-2 pr-10 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900"
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
                  'Sign in with Supabase'
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 text-sm text-gray-600 bg-gray-50 p-4 rounded-md">
            <p className="font-medium mb-2">🔗 Using Supabase Authentication</p>
            <p className="text-xs">This will connect to your Supabase database.</p>
          </div>
        </div>
      </div>
    </div>
  )
}