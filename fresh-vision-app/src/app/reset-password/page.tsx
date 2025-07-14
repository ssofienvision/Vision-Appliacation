'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Lock, Mail, Eye, EyeOff, ArrowLeft, CheckCircle, AlertCircle } from 'lucide-react'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [step, setStep] = useState<'email' | 'reset'>('email')
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  // If we have a token, we're in reset mode
  useEffect(() => {
    if (token) {
      setStep('reset')
    }
  }, [token])

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    if (!email) {
      setMessage({ type: 'error', text: 'Please enter your email address' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Password reset email sent! Check your inbox (and spam folder) and click the link to reset your password.' 
        })
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    // Validation
    if (!password || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' })
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters long' })
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setMessage({ type: 'error', text: error.message })
      } else {
        setMessage({ 
          type: 'success', 
          text: 'Password updated successfully! Redirecting to dashboard...' 
        })
        setTimeout(async () => {
          // Get user role and redirect accordingly
          const { data: { user } } = await supabase.auth.getUser()
          if (user?.email) {
            try {
              const { data: technicianData } = await supabase
                .from('technicians')
                .select('role')
                .eq('email', user.email)
                .single()

              if (technicianData?.role === 'admin') {
                router.push('/dashboard')
              } else {
                router.push('/tech-dashboard')
              }
            } catch (error) {
              // Default to tech dashboard if role check fails
              router.push('/tech-dashboard')
            }
          } else {
            router.push('/login')
          }
        }, 2000)
      }
    } catch (error) {
      setMessage({ 
        type: 'error', 
        text: 'An unexpected error occurred. Please try again.' 
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Lock className="h-8 w-8 text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-900">Reset Password</h1>
          </div>
          <p className="text-gray-600">
            {step === 'email' 
              ? 'Enter your email to receive a password reset link'
              : 'Enter your new password'
            }
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              {step === 'email' ? 'Send Reset Email' : 'Set New Password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {step === 'email' ? (
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mt-4 p-3 rounded-lg border ${
                message.type === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-start">
                  {message.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                  )}
                  <p className={`text-sm ${
                    message.type === 'success' ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {message.text}
                  </p>
                </div>
              </div>
            )}

            {/* Back to Login */}
            <div className="mt-6 text-center">
              <Link 
                href="/login" 
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back to Login
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Help Text */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            {step === 'email' 
              ? "Don't have an account? "
              : "Need help? "
            }
            <Link href="/login" className="text-blue-600 hover:text-blue-800">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
} 