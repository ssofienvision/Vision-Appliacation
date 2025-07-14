'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Job, type Technician } from '@/lib/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Sidebar from '@/components/Sidebar'
import DateFilter from '@/components/DateFilter'
import TechnicianFilter from '@/components/TechnicianFilter'
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
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [selectedTechnician, setSelectedTechnician] = useState('')
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const router = useRouter()

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadData()
    }
  }, [currentUser, selectedPeriod, selectedTechnician])

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

        // Load technicians list for admin
        if (technicianData.role === 'admin') {
          const { data: techData } = await supabase
            .from('technicians')
            .select('*')
            .order('name')
          setTechnicians(techData || [])
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    }
  }

  const loadData = async () => {
    try {
      setLoading(true)
      
      // Prepare filters
      const filters: any = {}
      
      // Add technician filter for admin
      if (currentUser?.role === 'admin' && selectedTechnician) {
        filters.technician = selectedTechnician
      } else if (currentUser?.role === 'technician' && currentUser?.technician_code) {
        filters.technician = currentUser.technician_code
      }
      
      // Add date filters based on selected period
      if (selectedPeriod) {
        const now = new Date()
        let startDate: Date
        let endDate: Date = now
        
        switch (selectedPeriod) {
          case 'thisWeek':
            startDate = new Date(now.setDate(now.getDate() - now.getDay()))
            break
          case 'thisMonth':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          case 'lastMonth':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
            endDate = new Date(now.getFullYear(), now.getMonth(), 0)
            break
          case 'thisYear':
            startDate = new Date(now.getFullYear(), 0, 1)
            break
          case 'lastYear':
            startDate = new Date(now.getFullYear() - 1, 0, 1)
            endDate = new Date(now.getFullYear() - 1, 11, 31)
            break
          default:
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }
        
        filters.startDate = startDate.toISOString().split('T')[0]
        filters.endDate = endDate.toISOString().split('T')[0]
      }

      // Load jobs with filters
      let jobsQuery = supabase
        .from('jobs')
        .select('*')
        .order('date_recorded', { ascending: false })

      if (filters.technician) {
        jobsQuery = jobsQuery.eq('technician', filters.technician)
      }
      if (filters.startDate) {
        jobsQuery = jobsQuery.gte('date_recorded', filters.startDate)
      }
      if (filters.endDate) {
        jobsQuery = jobsQuery.lte('date_recorded', filters.endDate)
      }

      const { data: jobsData, error: jobsError } = await jobsQuery

      if (jobsError) {
        console.error('Error loading jobs:', jobsError)
      }

      // Load part cost requests with filters
      let requestsQuery = supabase
        .from('part_cost_requests')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })

      if (filters.technician) {
        requestsQuery = requestsQuery.eq('technician_id', filters.technician)
      }
      if (filters.startDate) {
        requestsQuery = requestsQuery.gte('created_at', filters.startDate)
      }
      if (filters.endDate) {
        requestsQuery = requestsQuery.lte('created_at', filters.endDate)
      }

      const { data: requestsData, error: requestsError } = await requestsQuery

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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleFilterChange = (filters: any) => {
    // Handle date filter changes if needed
    console.log('Date filters changed:', filters)
  }

  const handleTechnicianChange = (technician: string) => {
    setSelectedTechnician(technician)
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
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={currentUser?.role} />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payout</h1>
            <p className="text-gray-600 mt-1">
              Calculate and manage technician payouts
              {currentUser?.name && ` - Welcome, ${currentUser.name}`}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Filters Section */}
        <div className="mb-8 space-y-4">
          <div className={`grid grid-cols-1 ${currentUser?.role === 'admin' ? 'lg:grid-cols-2' : ''} gap-4`}>
            {/* Date Filter */}
            <div>
              <DateFilter
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
                onFilterChange={handleFilterChange}
              />
            </div>
            
            {/* Technician Filter - Only for admins */}
            {currentUser?.role === 'admin' && (
              <div>
                <TechnicianFilter
                  technicians={technicians}
                  selectedTechnician={selectedTechnician}
                  onTechnicianChange={handleTechnicianChange}
                  isAdmin={true}
                />
              </div>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Jobs</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{jobs.length}</p>
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
                    {jobs.filter(job => job.is_oem_client).length}
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
                    {jobs.filter(job => !job.is_oem_client).length}
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
                    {partCostRequests.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Payout Calculator */}
        {currentUser?.technician_code && (
          <div className="mb-8">
            <EnhancedPayoutCalculator 
              jobs={jobs} 
              partsRequests={partCostRequests}
              technicianCode={currentUser.technician_code}
            />
          </div>
        )}

        {/* Payout Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
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
                    {jobs.filter(job => job.is_oem_client).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">OEM Payout Rate</span>
                  <span className="text-lg font-bold text-green-900">6.5%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="text-sm font-medium text-green-800">Total OEM Payout</span>
                  <span className="text-lg font-bold text-green-900">
                    ${jobs
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
                    {jobs.filter(job => !job.is_oem_client).length}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">Non-OEM Payout Rate</span>
                  <span className="text-lg font-bold text-orange-900">50%</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <span className="text-sm font-medium text-orange-800">Total Non-OEM Payout</span>
                  <span className="text-lg font-bold text-orange-900">
                    ${jobs
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
        <div className="mb-8">
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
      </div>
    </div>
  )
} 