'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { technicianService, type Technician } from '@/lib/database'
import Sidebar from '@/components/Sidebar'
import DateFilter from '@/components/DateFilter'
import { LogOut, Search, Filter, Download, RefreshCw } from 'lucide-react'

interface PartsRequest {
  id: number
  sd_invoice_number: string
  request_id: number
  requested_qty: number
  requested_date: string
  requesting_tech: string
  customer_name: string
  machine_type: string
  machine_make: string
  machine_model: string
  machine_serial: string
  part_description: string
  request_instructions: string
  request_notes: string
  part_number: string
  vendor: string
  vendor_inquiry_date: string
  contact_person: string
  contact_method: string
  quoted_wholesale: number
  quoted_retail: number
  availability: string
  order_instructions: string
  po_number: string
  date_order_confirmed: string
  date_shipment_expected: string
  date_received: string
  invoice_cost: number
  purchase_invoice_number: string
  sell_for_price: number
  hold_location: string
  purchase_notes: string
  created_at: string
  updated_at: string
}

export default function PartsInventory() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Technician | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [parts, setParts] = useState<PartsRequest[]>([])
  const [filteredParts, setFilteredParts] = useState<PartsRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      testDatabaseConnection()
      loadPartsData()
    }
  }, [currentUser, selectedPeriod])

  const testDatabaseConnection = async () => {
    try {
      console.log('🔍 Testing database connection for parts...')
      console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
      console.log('🔍 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')
      
      // Test basic connection
      const { data, error } = await supabase
        .from('parts_requests')
        .select('count')
        .limit(1)
      
      if (error) {
        console.error('❌ Database connection test failed:', error)
        return
      }
      
      console.log('✅ Database connection successful')
    } catch (error) {
      console.error('❌ Database connection test error:', error)
    }
  }

  useEffect(() => {
    filterParts()
  }, [parts, searchTerm, statusFilter])

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const technician = await technicianService.getCurrentTechnician()
      if (!technician) {
        router.push('/login')
        return
      }

      setCurrentUser(technician)
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    }
  }

  const loadPartsData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading parts data...')
      console.log('🔍 Current user:', currentUser)
      console.log('🔍 Selected period:', selectedPeriod)
      
      const dateFilters = getDateFilters()
      console.log('🔍 Date filters:', dateFilters)
      
      let query = supabase
        .from('parts_requests')
        .select('*')
        .order('requested_date', { ascending: false })

      if (dateFilters.startDate) {
        query = query.gte('requested_date', dateFilters.startDate)
        console.log('🔍 Added start date filter:', dateFilters.startDate)
      }
      if (dateFilters.endDate) {
        query = query.lte('requested_date', dateFilters.endDate)
        console.log('🔍 Added end date filter:', dateFilters.endDate)
      }

      // Filter by technician if not admin
      if (currentUser?.role !== 'admin') {
        query = query.eq('requesting_tech', currentUser?.technician_code)
        console.log('🔍 Added technician filter:', currentUser?.technician_code)
      }

      console.log('🔍 Executing database query...')
      const { data, error } = await query
      
      if (error) {
        console.error('❌ Database error:', error)
        console.error('❌ Error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // Check for specific error types
        if (error.code === 'PGRST116') {
          console.error('❌ This might be a Row Level Security (RLS) issue')
          console.error('❌ Check if the user has proper permissions')
        }
        
        if (error.code === '42P01') {
          console.error('❌ Table "parts_requests" does not exist')
          console.error('❌ Check if the database schema is properly set up')
        }
        
        throw error
      }

      console.log('📊 Parts data loaded successfully')
      console.log('📊 Number of parts returned:', data?.length || 0)
      
      if (data && data.length > 0) {
        console.log('📊 Sample parts data:', data.slice(0, 2).map((part: PartsRequest) => ({
          id: part.id,
          sd_invoice_number: part.sd_invoice_number,
          machine_make: part.machine_make,
          part_description: part.part_description,
          requesting_tech: part.requesting_tech
        })))
      } else {
        console.log('📊 No parts data found')
      }

      setParts(data || [])
      setError(null) // Clear any previous errors
    } catch (error) {
      console.error('❌ Error loading parts data:', error)
      setError('Failed to load parts data. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getDateFilters = () => {
    const now = new Date()
    let startDate, endDate

    switch (selectedPeriod) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        return {}
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const filterParts = () => {
    let filtered = [...parts]

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(part => 
        part.customer_name?.toLowerCase().includes(term) ||
        part.part_description?.toLowerCase().includes(term) ||
        part.part_number?.toLowerCase().includes(term) ||
        part.vendor?.toLowerCase().includes(term) ||
        part.requesting_tech?.toLowerCase().includes(term)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'pending':
          filtered = filtered.filter(part => !part.date_received)
          break
        case 'ordered':
          filtered = filtered.filter(part => part.date_order_confirmed && !part.date_received)
          break
        case 'received':
          filtered = filtered.filter(part => part.date_received)
          break
        case 'quoted':
          filtered = filtered.filter(part => part.quoted_wholesale || part.quoted_retail)
          break
      }
    }

    setFilteredParts(filtered)
  }

  const getStatusColor = (part: PartsRequest) => {
    if (part.date_received) return 'bg-green-100 text-green-800'
    if (part.date_order_confirmed) return 'bg-blue-100 text-blue-800'
    if (part.quoted_wholesale || part.quoted_retail) return 'bg-yellow-100 text-yellow-800'
    return 'bg-gray-100 text-gray-800'
  }

  const getStatusText = (part: PartsRequest) => {
    if (part.date_received) return 'Received'
    if (part.date_order_confirmed) return 'Ordered'
    if (part.quoted_wholesale || part.quoted_retail) return 'Quoted'
    return 'Pending'
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading parts inventory...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Parts Inventory</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Welcome, {currentUser?.name} ({currentUser?.role === 'admin' ? 'Administrator' : 'Technician'})
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

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Filters */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <DateFilter
              onFilterChange={() => loadPartsData()}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
            />
            
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search parts, customers, vendors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="quoted">Quoted</option>
                <option value="ordered">Ordered</option>
                <option value="received">Received</option>
              </select>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
                <div className="ml-auto pl-3">
                  <button
                    onClick={() => setError(null)}
                    className="text-red-400 hover:text-red-600"
                  >
                    <span className="sr-only">Dismiss</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Parts List */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-4 py-3 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                  Parts Requests ({filteredParts.length})
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadPartsData}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => {/* TODO: Export functionality */}}
                    className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </button>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SD-Invoice Number
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Machine Make
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Part Description
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Technician
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Requested Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredParts.map((part) => (
                    <tr key={part.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {part.sd_invoice_number || '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {part.machine_make || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{part.part_description}</div>
                          {part.part_number && (
                            <div className="text-xs text-gray-500">Part #: {part.part_number}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {part.requesting_tech}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(part)}`}>
                          {getStatusText(part)}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {part.requested_date ? new Date(part.requested_date).toLocaleDateString() : '-'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {part.invoice_cost ? `$${part.invoice_cost.toFixed(2)}` : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredParts.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">No parts requests found.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 