'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Job } from '@/lib/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Sidebar from '@/components/Sidebar'
import PayoutCalculator from '@/components/PayoutCalculator'
import { DollarSign, Calculator, LogOut, TrendingUp, Users } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

export default function PayoutPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
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
      } else {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          role: 'technician'
        })
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    }
  }

  useEffect(() => {
    // Simulate loading jobs data
    setTimeout(() => {
      setJobs([
        {
          invoice_number: 'INV-001',
          customer_name: 'John Smith',
          total_amount: 245.50,
          date_recorded: '2024-01-15',
          technician: 'TECH001',
          type_serviced: 'HVAC Repair',
          make_serviced: 'Carrier',
          parts_cost: 45.00,
          is_oem_client: false,
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z'
        },
        {
          invoice_number: 'INV-002',
          customer_name: 'Sarah Johnson',
          total_amount: 189.75,
          date_recorded: '2024-01-14',
          technician: 'TECH002',
          type_serviced: 'Plumbing',
          make_serviced: 'Rheem',
          parts_cost: 25.50,
          is_oem_client: true,
          created_at: '2024-01-14T14:30:00Z',
          updated_at: '2024-01-14T14:30:00Z'
        },
        {
          invoice_number: 'INV-003',
          customer_name: 'Mike Wilson',
          total_amount: 320.00,
          date_recorded: '2024-01-13',
          technician: 'TECH001',
          type_serviced: 'Electrical',
          make_serviced: 'GE',
          parts_cost: 80.00,
          is_oem_client: false,
          created_at: '2024-01-13T09:15:00Z',
          updated_at: '2024-01-13T09:15:00Z'
        },
        {
          invoice_number: 'INV-004',
          customer_name: 'Lisa Brown',
          total_amount: 156.25,
          date_recorded: '2024-01-12',
          technician: 'TECH003',
          type_serviced: 'Appliance Repair',
          make_serviced: 'Whirlpool',
          parts_cost: 35.00,
          is_oem_client: true,
          created_at: '2024-01-12T11:45:00Z',
          updated_at: '2024-01-12T11:45:00Z'
        },
        {
          invoice_number: 'INV-005',
          customer_name: 'David Lee',
          total_amount: 298.50,
          date_recorded: '2024-01-11',
          technician: 'TECH002',
          type_serviced: 'Heating System',
          make_serviced: 'Trane',
          parts_cost: 120.00,
          is_oem_client: false,
          created_at: '2024-01-11T16:20:00Z',
          updated_at: '2024-01-11T16:20:00Z'
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

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
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{payoutSummary.oemJobs}</p>
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
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{payoutSummary.nonOemJobs}</p>
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
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Payout</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ${payoutSummary.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payout Calculator */}
          <div className="mb-6 sm:mb-8">
            <PayoutCalculator jobs={jobs} />
          </div>

          {/* Payout Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
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
                    <span className="text-lg font-bold text-green-900">{payoutSummary.oemJobs}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">OEM Payout Rate</span>
                    <span className="text-lg font-bold text-green-900">6.5%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                    <span className="text-sm font-medium text-green-800">Total OEM Payout</span>
                    <span className="text-lg font-bold text-green-900">
                      ${payoutSummary.totalOemPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
                    <span className="text-lg font-bold text-orange-900">{payoutSummary.nonOemJobs}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Non-OEM Payout Rate</span>
                    <span className="text-lg font-bold text-orange-900">50%</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <span className="text-sm font-medium text-orange-800">Total Non-OEM Payout</span>
                    <span className="text-lg font-bold text-orange-900">
                      ${payoutSummary.totalNonOemPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Payout Formula Explanation */}
          <div className="mt-6 sm:mt-8">
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