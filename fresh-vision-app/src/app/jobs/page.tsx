'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { jobsService, technicianService, type Job, type Technician } from '@/lib/database'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import JobList from '@/components/JobList'
import Sidebar from '@/components/Sidebar'
import MobileNav from '@/components/MobileNav'
import DateFilter from '@/components/DateFilter'
import TechnicianFilter from '@/components/TechnicianFilter'
import { Plus, Download, Filter, LogOut, RefreshCw, Briefcase, TrendingUp, DollarSign, Wrench, Package, Users, BarChart3, Calendar } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [filters, setFilters] = useState<any>({})
  const router = useRouter()

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadJobs()
      loadTechnicians()
    }
  }, [currentUser, filters])

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

  const loadJobs = async () => {
    try {
      setLoading(true)
      console.log('🔍 Starting to load jobs...')
      const jobsData = await jobsService.getJobs(filters)
      console.log('📊 Jobs loaded successfully:', jobsData.length, 'jobs')
      setJobs(jobsData)
    } catch (error) {
      console.error('❌ Error loading jobs:', error)
      
      // Show more specific error message
      let errorMessage = 'Failed to load jobs'
      if (error instanceof Error) {
        if (error.message.includes('PGRST116')) {
          errorMessage = 'Access denied. Please check your permissions.'
        } else if (error.message.includes('42P01')) {
          errorMessage = 'Database table not found. Please check database setup.'
        } else if (error.message.includes('network')) {
          errorMessage = 'Network error. Please check your connection.'
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }
      
      // You could add a toast notification here
      console.error('❌ User-friendly error:', errorMessage)
      
      // Set empty jobs array to prevent crashes
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const loadTechnicians = async () => {
    try {
      const techniciansData = await technicianService.getTechnicians()
      setTechnicians(techniciansData)
    } catch (error) {
      console.error('Error loading technicians:', error)
    }
  }

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters)
  }

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    const dateFilters = getDateFilters(period)
    setFilters((prev: any) => ({ ...prev, ...dateFilters }))
  }

  const handleTechnicianChange = (technicianCode: string) => {
    setSelectedTechnician(technicianCode)
    setFilters((prev: any) => ({ 
      ...prev, 
      technician: technicianCode || undefined 
    }))
  }

  const getDateFilters = (period: string) => {
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'lastWeek':
        // Get last week (Monday to Sunday)
        const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        const dayOfWeek = lastWeek.getDay()
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        startDate = new Date(lastWeek.getTime() - daysToMonday * 24 * 60 * 60 * 1000)
        endDate = new Date(startDate.getTime() + 6 * 24 * 60 * 60 * 1000)
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      case 'last30Days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'last90Days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      default:
        return {}
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadJobs()
    setRefreshing(false)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const handleJobUpdated = () => {
    // Refresh the jobs data when a job is updated
    loadJobs()
  }

  const calculateStats = () => {
    const totalJobs = jobs.length
    const totalRevenue = jobs.reduce((sum, job) => sum + (job.total_amount || 0), 0)
    const avgJobValue = totalJobs > 0 ? totalRevenue / totalJobs : 0
    
    const thisMonth = new Date().getMonth()
    const thisMonthJobs = jobs.filter(job => 
      new Date(job.date_recorded).getMonth() === thisMonth
    ).length

    return {
      totalJobs,
      totalRevenue,
      avgJobValue,
      thisMonthJobs
    }
  }

  const stats = calculateStats()

  // Mobile navigation tabs
  const mobileTabs = [
    { id: 'dashboard', label: 'Dashboard', icon: TrendingUp },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'parts', label: 'Parts', icon: Package },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'payout', label: 'Payout', icon: DollarSign },
  ]

  const handleMobileTabChange = (tabId: string) => {
    switch (tabId) {
      case 'dashboard':
        router.push('/dashboard')
        break
      case 'jobs':
        router.push('/jobs')
        break
      case 'parts':
        router.push('/parts')
        break
      case 'analytics':
        router.push('/analytics')
        break
      case 'payout':
        router.push('/payout')
        break
      default:
        break
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={currentUser?.role} />
      <div className="flex-1 lg:ml-64">
        {/* Mobile Navigation */}
        <div className="lg:hidden">
          <MobileNav 
            tabs={mobileTabs} 
            activeTab="jobs" 
            onTabChange={handleMobileTabChange} 
          />
        </div>

        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Jobs</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage and track all technician jobs
                  {currentUser?.name && ` - Welcome, ${currentUser.name}`}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </Button>
                <Button variant="secondary" size="sm">
                  <Download className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button size="sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Job</span>
                </Button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateFilter
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={handlePeriodChange}
                onFilterChange={handleFilterChange}
              />
              <TechnicianFilter
                technicians={technicians}
                selectedTechnician={selectedTechnician}
                onTechnicianChange={handleTechnicianChange}
                isAdmin={currentUser?.role === 'admin'}
              />
            </div>
          </div>

          {/* Job Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Jobs</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{stats.totalJobs}</p>
                  </div>
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ${stats.totalRevenue.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-2 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Job Value</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ${stats.avgJobValue.toFixed(2)}
                    </p>
                  </div>
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-gray-500">This Month</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      {stats.thisMonthJobs}
                    </p>
                  </div>
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Job List */}
          <JobList jobs={jobs} onJobUpdated={handleJobUpdated} />
        </main>
      </div>
    </div>
  )
} 