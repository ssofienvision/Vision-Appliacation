'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { jobsService, technicianService, testDatabaseConnection, type Technician, type DashboardMetrics } from '@/lib/database'
import KPIDashboard from '@/components/KPIDashboard'
import DateFilter from '@/components/DateFilter'
import Sidebar from '@/components/Sidebar'
import { LogOut, Upload, FileText, Users, Settings, BarChart3, Database, AlertTriangle, CheckCircle, Clock, RefreshCw } from 'lucide-react'

interface AdminMetrics extends DashboardMetrics {
  totalTechnicians: number
  pendingPartRequests: number
  recentImports: number
  systemHealth: 'good' | 'warning' | 'error'
}

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [generatingInvoices, setGeneratingInvoices] = useState(false)
  const [invoiceMessage, setInvoiceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)
  const [connectionMessage, setConnectionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadAdminData()
    }
  }, [user, selectedPeriod])

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      // Check if user has admin privileges
      const { data: profile } = await supabase
        .from('technicians')
        .select('*')
        .eq('email', user.email)
        .single()

      console.log('🔍 Admin check - User profile:', profile)
      console.log('🔍 Admin check - User role:', profile?.role)

      if (!profile || profile.role !== 'admin') {
        console.log('❌ User is not admin, redirecting to dashboard')
        router.push('/dashboard')
        return
      }

      console.log('✅ User is admin, proceeding to admin dashboard')
      setUser(user)
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadAdminData = async () => {
    try {
      const [dashboardMetrics, technicians, partRequests] = await Promise.all([
        jobsService.getDashboardMetrics({}),
        technicianService.getTechnicians(),
        supabase.from('part_cost_requests').select('*').eq('status', 'pending').then((res: any) => res.data || [])
      ])

      setMetrics({
        ...dashboardMetrics,
        totalTechnicians: technicians.length,
        pendingPartRequests: partRequests.length,
        recentImports: 0, // TODO: Track recent imports
        systemHealth: 'good' // TODO: Implement system health check
      })
    } catch (error) {
      console.error('Error loading admin data:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navigateToAdminSection = (section: string) => {
    router.push(`/admin/${section}`)
  }

  const handleGenerateInvoices = async () => {
    setGeneratingInvoices(true)
    setInvoiceMessage(null)
    
    try {
      const result = await jobsService.generateMissingInvoiceNumbers()
      
      if (result.success) {
        setInvoiceMessage({ type: 'success', text: result.message })
        // Refresh admin data to show updated metrics
        await loadAdminData()
      } else {
        setInvoiceMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      console.error('Error generating invoices:', error)
      setInvoiceMessage({ type: 'error', text: 'Failed to generate invoice numbers' })
    } finally {
      setGeneratingInvoices(false)
    }
  }

  const handleTestConnection = async () => {
    setTestingConnection(true)
    setConnectionMessage(null)
    
    try {
      const result = await testDatabaseConnection()
      
      if (result.success) {
        setConnectionMessage({ type: 'success', text: result.message })
      } else {
        setConnectionMessage({ type: 'error', text: result.message })
      }
    } catch (error) {
      console.error('Error testing connection:', error)
      setConnectionMessage({ type: 'error', text: 'Failed to test database connection' })
    } finally {
      setTestingConnection(false)
    }
  }

  const handleFilterChange = (filters: any) => {
    // Handle date filter changes if needed
    console.log('Date filters changed:', filters)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {user.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <DateFilter
            selectedPeriod={selectedPeriod}
            setSelectedPeriod={setSelectedPeriod}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Admin Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <button
            onClick={() => navigateToAdminSection('import')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <Upload className="h-6 w-6 text-blue-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Import Data</h3>
                <p className="text-sm text-gray-600">Import jobs and parts</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => navigateToAdminSection('part-requests')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Part Requests</h3>
                <p className="text-sm text-gray-600">Manage part requests</p>
                {metrics?.pendingPartRequests && metrics.pendingPartRequests > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 mt-1">
                    {metrics.pendingPartRequests} pending
                  </span>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={handleGenerateInvoices}
            disabled={generatingInvoices}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <RefreshCw className={`h-6 w-6 text-purple-600 ${generatingInvoices ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Generate Invoices</h3>
                <p className="text-sm text-gray-600">Fix missing invoice numbers</p>
                {generatingInvoices && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    Processing...
                  </span>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testingConnection}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <Database className={`h-6 w-6 text-yellow-600 ${testingConnection ? 'animate-spin' : ''}`} />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Test Connection</h3>
                <p className="text-sm text-gray-600">Check database connectivity</p>
                {testingConnection && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mt-1">
                    Testing...
                  </span>
                )}
              </div>
            </div>
          </button>

          <button
            onClick={() => router.push('/analytics')}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600">Detailed reports</p>
              </div>
            </div>
          </button>
        </div>

        {/* Invoice Generation Message */}
        {invoiceMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            invoiceMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {invoiceMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                invoiceMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {invoiceMessage.text}
              </span>
            </div>
          </div>
        )}

        {/* Connection Test Message */}
        {connectionMessage && (
          <div className={`mb-6 p-4 rounded-lg ${
            connectionMessage.type === 'success' 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2">
              {connectionMessage.type === 'success' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                connectionMessage.type === 'success' ? 'text-green-800' : 'text-red-800'
              }`}>
                {connectionMessage.text}
              </span>
            </div>
          </div>
        )}

        {/* System Status */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${
                metrics?.systemHealth === 'good' ? 'bg-green-100' : 
                metrics?.systemHealth === 'warning' ? 'bg-yellow-100' : 'bg-red-100'
              }`}>
                {metrics?.systemHealth === 'good' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : metrics?.systemHealth === 'warning' ? (
                  <Clock className="h-5 w-5 text-yellow-600" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">System Health</p>
                <p className="text-sm text-gray-600 capitalize">{metrics?.systemHealth || 'Unknown'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Active Technicians</p>
                <p className="text-sm text-gray-600">{metrics?.totalTechnicians || 0} technicians</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <FileText className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Pending Requests</p>
                <p className="text-sm text-gray-600">{metrics?.pendingPartRequests || 0} requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* KPI Dashboard */}
        {metrics && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Business Metrics</h2>
            <KPIDashboard metrics={metrics} />
          </div>
        )}

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">System running normally</p>
                <p className="text-xs text-gray-600">Last updated: {new Date().toLocaleString()}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Data import available</p>
                <p className="text-xs text-gray-600">Ready to import jobs and parts data</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">Technician management</p>
                <p className="text-xs text-gray-600">Manage technician accounts and permissions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 