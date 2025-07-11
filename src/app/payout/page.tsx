'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Job } from '@/lib/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Sidebar from '@/components/Sidebar'
import EnhancedPayoutCalculator from '@/components/EnhancedPayoutCalculator'
import { DollarSign, Calculator, LogOut, TrendingUp, Users } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

interface PartCostRequest {
  id: number
  job_id: number
  technician_id: string
  current_parts_cost: number
  requested_parts_cost: number
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  admin_notes?: string
  approved_by?: string
  approved_at?: string
  parts_ordered_by: 'technician' | 'office'
  created_at: string
  updated_at: string
}

export default function PayoutPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [partCostRequests, setPartCostRequests] = useState<PartCostRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedMonth, setSelectedMonth] = useState<string>('')
  const router = useRouter()

  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Get user details from technicians table
      const { data: technicianData } = await supabase
        .from('technicians')
        .select('*')
        .eq('email', user.email)
        .single()

      if (technicianData) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          role: technicianData.role || 'technician',
          technician_code: technicianData.technician_code,
          name: technicianData.name
        })

        // Load data based on user role
        if (technicianData.role === 'admin') {
          await loadAllData()
        } else {
          await loadTechnicianData(technicianData.technician_code)
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      
      // Load all jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .order('date_recorded', { ascending: false })

      if (jobsError) {
        console.error('Error loading jobs:', jobsError)
      }

      // Load all approved part cost requests
      const { data: requestsData, error: requestsError } = await supabase
        .from('part_cost_requests')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error loading part cost requests:', requestsError)
      }

      setJobs(jobsData || [])
      setPartCostRequests(requestsData || [])
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicianData = async (technicianCode: string) => {
    try {
      setLoading(true)
      
      // Load jobs for this technician
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('technician', technicianCode)
        .order('date_recorded', { ascending: false })

      if (jobsError) {
        console.error('Error loading jobs:', jobsError)
      }

      // Load approved part cost requests for this technician
      const { data: requestsData, error: requestsError } = await supabase
        .from('part_cost_requests')
        .select('*')
        .eq('status', 'approved')
        .eq('technician_id', technicianCode)
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error loading part cost requests:', requestsError)
      }

      setJobs(jobsData || [])
      setPartCostRequests(requestsData || [])
    } catch (error) {
      console.error('Error loading technician data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const calculatePayoutSummary = () => {
    const oemJobs = jobs.filter(job => job.is_oem_client)
    const nonOemJobs = jobs.filter(job => !job.is_oem_client)
    
    const calculatePayout = (totalSales: number, partsCost: number, isOem: boolean) => {
      const labor = totalSales - partsCost
      return isOem ? labor * 0.065 + partsCost : labor * 0.5 + partsCost
    }

    const totalOemPayout = oemJobs.reduce((sum, job) => 
      sum + calculatePayout(job.total_amount || 0, job.parts_cost || 0, true), 0
    )

    const totalNonOemPayout = nonOemJobs.reduce((sum, job) => 
      sum + calculatePayout(job.total_amount || 0, job.parts_cost || 0, false), 0
    )

    return {
      oemJobs: oemJobs.length,
      nonOemJobs: nonOemJobs.length,
      totalOemPayout,
      totalNonOemPayout,
      totalPayout: totalOemPayout + totalNonOemPayout
    }
  }

  const payoutSummary = calculatePayoutSummary()

  // Filter jobs by selected month if specified
  const filteredJobs = selectedMonth 
    ? jobs.filter(job => {
        const jobMonth = new Date(job.date_recorded).toISOString().slice(0, 7)
        return jobMonth === selectedMonth
      })
    : jobs

  // Filter part cost requests by selected month if specified
  const filteredPartCostRequests = selectedMonth
    ? partCostRequests.filter(request => {
        const requestMonth = new Date(request.created_at).toISOString().slice(0, 7)
        return requestMonth === selectedMonth
      })
    : partCostRequests

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payout data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={currentUser?.role} />
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Payout</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Calculate and manage technician payouts
                  {currentUser?.name && ` - Welcome, ${currentUser.name}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Month Filter */}
          <div className="mb-6">
            <label htmlFor="monthFilter" className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Month
            </label>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Months</option>
              {Array.from(new Set(jobs.map(job => new Date(job.date_recorded).toISOString().slice(0, 7)))).sort().reverse().map(month => (
                <option key={month} value={month}>
                  {new Date(month + '-01').toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </option>
              ))}
            </select>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{filteredJobs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">OEM Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {filteredJobs.filter(job => job.is_oem_client).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Non-OEM Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {filteredJobs.filter(job => !job.is_oem_client).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Part Requests</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {filteredPartCostRequests.length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Payout Calculator */}
          {currentUser?.technician_code && (
            <div className="mb-6 sm:mb-8">
              <EnhancedPayoutCalculator 
                jobs={filteredJobs} 
                partsRequests={filteredPartCostRequests}
                technicianCode={currentUser.technician_code}
              />
            </div>
          )}

          {/* Payout Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:mb-8">
            {/* OEM Jobs Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  OEM Jobs Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Total OEM Jobs</span>
                    <span className="text-lg font-bold text-green-900">
                      {filteredJobs.filter(job => job.is_oem_client).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">OEM Payout Rate</span>
                    <span className="text-lg font-bold text-green-900">6.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Total OEM Payout</span>
                    <span className="text-lg font-bold text-green-900">
                      ${filteredJobs
                        .filter(job => job.is_oem_client)
                        .reduce((sum, job) => {
                          const labor = (job.total_amount || 0) - (job.parts_cost || 0)
                          return sum + (labor * 0.065) + (job.parts_cost || 0)
                        }, 0)
                        .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Non-OEM Jobs Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                  Non-OEM Jobs Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Total Non-OEM Jobs</span>
                    <span className="text-lg font-bold text-orange-900">
                      {filteredJobs.filter(job => !job.is_oem_client).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Non-OEM Payout Rate</span>
                    <span className="text-lg font-bold text-orange-900">50%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Total Non-OEM Payout</span>
                    <span className="text-lg font-bold text-orange-900">
                      ${filteredJobs
                        .filter(job => !job.is_oem_client)
                        .reduce((sum, job) => {
                          const labor = (job.total_amount || 0) - (job.parts_cost || 0)
                          return sum + (labor * 0.5) + (job.parts_cost || 0)
                        }, 0)
                        .toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payout Formula Explanation */}
          <div className="mb-6 sm:mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Payout Formula Explanation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-semibold text-green-700">OEM Jobs Formula</h4>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-green-800 mb-2">
                        <strong>Payout = (Total Sales - Parts Cost) × 6.5% + Parts Cost</strong>
                      </p>
                      <p className="text-xs text-green-600">
                        For OEM clients, technicians receive 6.5% of labor plus full parts cost.
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-semibold text-orange-700">Non-OEM Jobs Formula</h4>
                    <div className="bg-orange-50 p-4 rounded-lg">
                      <p className="text-sm text-orange-800 mb-2">
                        <strong>Payout = (Total Sales - Parts Cost) × 50% + Parts Cost</strong>
                      </p>
                      <p className="text-xs text-orange-600">
                        For non-OEM clients, technicians receive 50% of labor plus full parts cost.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 