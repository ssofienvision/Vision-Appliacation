'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import SalesOverTimeChart from '@/components/charts/SalesOverTimeChart'
import ServiceCallPieChart from '@/components/charts/ServiceCallPieChart'
import JobTypeSalesChart from '@/components/charts/JobTypeSalesChart'
import JobList from '@/components/JobList'
import PayoutCalculator from '@/components/PayoutCalculator'
import Sidebar from '@/components/Sidebar'
import { BarChart3, TrendingUp, DollarSign, Users, LogOut } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface SalesData {
  month: string
  sales: number
}

interface JobTypeData {
  type: string
  totalSales: number
  count: number
}

interface Job {
  id: number
  customer_name: string
  total_amount: number
  date_recorded: string
  technician: string
  type_serviced: string
  make_serviced: string
  invoice_number: string
  parts_cost: number
  is_oem_client: boolean
}

interface AnalyticsData {
  salesOverTime: SalesData[]
  serviceCallPercentage: number
  jobTypeSales: JobTypeData[]
  jobs: Job[]
  summary: {
    totalSales: number
    totalJobs: number
    avgSalePerJob: number
    totalTechnicians: number
  }
}

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    salesOverTime: [],
    serviceCallPercentage: 0,
    jobTypeSales: [],
    jobs: [],
    summary: {
      totalSales: 0,
      totalJobs: 0,
      avgSalePerJob: 0,
      totalTechnicians: 0
    }
  })
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
        
        // Redirect non-admin users
        if (technicianData.role !== 'admin') {
          router.push('/tech-dashboard')
          return
        }
      } else {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          role: 'technician'
        })
        router.push('/tech-dashboard')
        return
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    }
  }

  useEffect(() => {
    // Simulate loading analytics data
    setTimeout(() => {
      setAnalyticsData({
        salesOverTime: [
          { month: '2024-01', sales: 45230 },
          { month: '2024-02', sales: 38920 },
          { month: '2024-03', sales: 52450 },
          { month: '2024-04', sales: 47890 },
          { month: '2024-05', sales: 61230 },
          { month: '2024-06', sales: 55670 }
        ],
        serviceCallPercentage: 35.2,
        jobTypeSales: [
          { type: 'HVAC Repair', totalSales: 45230, count: 156 },
          { type: 'Plumbing', totalSales: 38920, count: 134 },
          { type: 'Electrical', totalSales: 32450, count: 112 },
          { type: 'Appliance Repair', totalSales: 28760, count: 98 },
          { type: 'Heating System', totalSales: 24560, count: 87 },
          { type: 'Cooling System', totalSales: 22340, count: 76 },
          { type: 'Water Heater', totalSales: 19870, count: 65 },
          { type: 'Ductwork', totalSales: 17650, count: 54 },
          { type: 'Thermostat', totalSales: 15430, count: 43 },
          { type: 'Other', totalSales: 12340, count: 32 }
        ],
        jobs: [
          {
            id: 1,
            customer_name: 'John Smith',
            total_amount: 245.50,
            date_recorded: '2024-01-15',
            technician: 'TECH001',
            type_serviced: 'HVAC Repair',
            make_serviced: 'Carrier',
            invoice_number: 'INV-001',
            parts_cost: 45.00,
            is_oem_client: false
          },
          {
            id: 2,
            customer_name: 'Sarah Johnson',
            total_amount: 189.75,
            date_recorded: '2024-01-14',
            technician: 'TECH002',
            type_serviced: 'Plumbing',
            make_serviced: 'Rheem',
            invoice_number: 'INV-002',
            parts_cost: 25.50,
            is_oem_client: true
          },
          {
            id: 3,
            customer_name: 'Mike Wilson',
            total_amount: 320.00,
            date_recorded: '2024-01-13',
            technician: 'TECH001',
            type_serviced: 'Electrical',
            make_serviced: 'GE',
            invoice_number: 'INV-003',
            parts_cost: 80.00,
            is_oem_client: false
          },
          {
            id: 4,
            customer_name: 'Lisa Brown',
            total_amount: 156.25,
            date_recorded: '2024-01-12',
            technician: 'TECH003',
            type_serviced: 'Appliance Repair',
            make_serviced: 'Whirlpool',
            invoice_number: 'INV-004',
            parts_cost: 35.00,
            is_oem_client: true
          },
          {
            id: 5,
            customer_name: 'David Lee',
            total_amount: 298.50,
            date_recorded: '2024-01-11',
            technician: 'TECH002',
            type_serviced: 'Heating System',
            make_serviced: 'Trane',
            invoice_number: 'INV-005',
            parts_cost: 120.00,
            is_oem_client: false
          }
        ],
        summary: {
          totalSales: 308960,
          totalJobs: 803,
          avgSalePerJob: 384.76,
          totalTechnicians: 8
        }
      })
      setLoading(false)
    }, 1000)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Analytics</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Comprehensive business insights and performance metrics
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
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Sales</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.summary.totalSales)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{analyticsData.summary.totalJobs.toLocaleString()}</p>
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
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Sale/Job</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{formatCurrency(analyticsData.summary.avgSalePerJob)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Technicians</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{analyticsData.summary.totalTechnicians}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <SalesOverTimeChart data={analyticsData.salesOverTime} />
            <ServiceCallPieChart serviceCallPercentage={analyticsData.serviceCallPercentage} />
          </div>

          {/* Job Type Sales Chart */}
          <div className="mb-6 sm:mb-8">
            <JobTypeSalesChart data={analyticsData.jobTypeSales} />
          </div>

          {/* Payout Calculator */}
          <div className="mb-6 sm:mb-8">
            <PayoutCalculator jobs={analyticsData.jobs} />
          </div>

          {/* Job List */}
          <div className="mb-6 sm:mb-8">
            <JobList jobs={analyticsData.jobs} />
          </div>
        </main>
      </div>
    </div>
  )
} 