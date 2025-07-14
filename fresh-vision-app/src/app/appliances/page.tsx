'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Job } from '@/lib/database'
import { jobsService } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Search, Filter, TrendingUp, Wrench } from 'lucide-react'
import Sidebar from '@/components/Sidebar'
import { Button } from '@/components/ui/Button'
import { BarChart3, DollarSign, LogOut } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface ApplianceStats {
  types: Array<{
    type: string
    count: number
    totalSales: number
    totalLabor: number
    avgSale: number
    avgLabor: number
  }>
  brands: Array<{
    brand: string
    count: number
    totalSales: number
    totalLabor: number
    avgSale: number
    avgLabor: number
  }>
  topCombinations: Array<{
    combination: string
    count: number
    totalSales: number
    type: string
    brand: string
  }>
}

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

export default function AppliancesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [jobs, setJobs] = useState<Job[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [selectedBrand, setSelectedBrand] = useState('')
  
  const [applianceStats, setApplianceStats] = useState<ApplianceStats>({
    types: [],
    brands: [],
    topCombinations: []
  })
  const [currentUser, setCurrentUser] = useState<User | null>(null)

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
    loadApplianceData()
  }, [])

  const loadApplianceData = async () => {
    try {
      setLoading(true)
      const jobsData = await jobsService.getJobs({})
      setJobs(jobsData)
      
      // Process appliance statistics
      const typeStats = processTypeStats(jobsData)
      const brandStats = processBrandStats(jobsData)
      const combinations = processTypeBrandCombinations(jobsData)
      
      setApplianceStats({
        types: typeStats,
        brands: brandStats,
        topCombinations: combinations
      })
    } catch (error) {
      console.error('Error loading appliance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processTypeStats = (jobs: Job[]) => {
    const typeMap = jobs.reduce((acc, job) => {
      const type = job.type_serviced || 'Unknown'
      if (!acc[type]) {
        acc[type] = { count: 0, totalSales: 0, totalLabor: 0 }
      }
      acc[type].count++
      acc[type].totalSales += job.total_amount || 0
      acc[type].totalLabor += (job.total_amount || 0) - (job.parts_cost || 0)
      return acc
    }, {} as Record<string, { count: number; totalSales: number; totalLabor: number }>)

    return Object.entries(typeMap)
      .map(([type, stats]) => ({
        type,
        ...stats,
        avgSale: stats.count > 0 ? stats.totalSales / stats.count : 0,
        avgLabor: stats.count > 0 ? stats.totalLabor / stats.count : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
  }

  const processBrandStats = (jobs: Job[]) => {
    const brandMap = jobs.reduce((acc, job) => {
      const brand = job.make_serviced || 'Unknown'
      if (!acc[brand]) {
        acc[brand] = { count: 0, totalSales: 0, totalLabor: 0 }
      }
      acc[brand].count++
      acc[brand].totalSales += job.total_amount || 0
      acc[brand].totalLabor += (job.total_amount || 0) - (job.parts_cost || 0)
      return acc
    }, {} as Record<string, { count: number; totalSales: number; totalLabor: number }>)

    return Object.entries(brandMap)
      .map(([brand, stats]) => ({
        brand,
        ...stats,
        avgSale: stats.count > 0 ? stats.totalSales / stats.count : 0,
        avgLabor: stats.count > 0 ? stats.totalLabor / stats.count : 0
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
  }

  const processTypeBrandCombinations = (jobs: Job[]) => {
    const combinationMap = jobs.reduce((acc, job) => {
      const key = `${job.type_serviced || 'Unknown'} - ${job.make_serviced || 'Unknown'}`
      if (!acc[key]) {
        acc[key] = { count: 0, totalSales: 0, type: job.type_serviced, brand: job.make_serviced }
      }
      acc[key].count++
      acc[key].totalSales += job.total_amount || 0
      return acc
    }, {} as Record<string, { count: number; totalSales: number; type: string; brand: string }>)

    return Object.entries(combinationMap)
      .map(([key, stats]) => ({ combination: key, ...stats }))
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 20)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredData = applianceStats.types.filter(item => {
    const matchesSearch = !searchTerm || 
      item.type.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = !selectedType || item.type === selectedType
    return matchesSearch && matchesType
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading appliance data...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Appliances</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Appliance repair statistics and performance metrics
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
                    <Wrench className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Repairs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {applianceStats.types.reduce((sum, type) => sum + type.count, 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(applianceStats.types.reduce((sum, type) => sum + type.totalSales, 0))}
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
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Repair Value</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {formatCurrency(
                        applianceStats.types.reduce((sum, type) => sum + type.totalSales, 0) /
                        applianceStats.types.reduce((sum, type) => sum + type.count, 0)
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <BarChart3 className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Brands Serviced</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{applianceStats.brands.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Appliance Types */}
          <div className="mb-6 sm:mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Appliance Types Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sale</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Labor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applianceStats.types.map((type, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{type.type}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{type.count}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(type.totalSales)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(type.avgSale)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(type.avgLabor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Brand Performance */}
          <div className="mb-6 sm:mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Brand Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Brand</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Sale</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Labor</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applianceStats.brands.map((brand, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{brand.brand}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{brand.count}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(brand.totalSales)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(brand.avgSale)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(brand.avgLabor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Combinations */}
          <div className="mb-6 sm:mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Top Type-Brand Combinations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Combination</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Sales</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applianceStats.topCombinations.map((combo, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">{combo.combination}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{combo.count}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{formatCurrency(combo.totalSales)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
} 