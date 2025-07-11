'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Sidebar from '@/components/Sidebar'
import { CheckCircle, XCircle, Clock, AlertCircle, LogOut } from 'lucide-react'

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
  job?: {
    customer_name: string
    invoice_number: string
    type_serviced: string
    make_serviced: string
    date_recorded: string
    total_amount: number
  }
  technician?: {
    name: string
    technician_code: string
  }
}

interface User {
  id: string
  email: string
  role: string
  name?: string
}

export default function PartRequestsPage() {
  const [requests, setRequests] = useState<PartCostRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedRequest, setSelectedRequest] = useState<PartCostRequest | null>(null)
  const [adminNotes, setAdminNotes] = useState('')
  const [partsOrderedBy, setPartsOrderedBy] = useState<'technician' | 'office'>('technician')
  const [isProcessing, setIsProcessing] = useState(false)
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
          name: technicianData.name
        })

        // Only load requests if user is admin
        if (technicianData.role === 'admin') {
          loadPartCostRequests()
        } else {
          router.push('/dashboard')
        }
      } else {
        router.push('/login')
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    }
  }

  const loadPartCostRequests = async () => {
    try {
      setLoading(true)
      
      // Fetch part cost requests with job and technician details
      const { data, error } = await supabase
        .from('part_cost_requests')
        .select(`
          *,
          job:jobs(customer_name, invoice_number, type_serviced, make_serviced, date_recorded, total_amount),
          technician:technicians(name, technician_code)
        `)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading part cost requests:', error)
      } else {
        setRequests(data || [])
      }
    } catch (error) {
      console.error('Error loading part cost requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (request: PartCostRequest) => {
    if (!currentUser) return
    
    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from('part_cost_requests')
        .update({
          status: 'approved',
          admin_notes: adminNotes.trim() || null,
          approved_by: currentUser.name || currentUser.email,
          approved_at: new Date().toISOString(),
          parts_ordered_by: partsOrderedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (error) {
        console.error('Error approving request:', error)
        alert('Failed to approve request')
      } else {
        // Refresh the requests list
        await loadPartCostRequests()
        setSelectedRequest(null)
        setAdminNotes('')
        setPartsOrderedBy('technician')
      }
    } catch (error) {
      console.error('Error approving request:', error)
      alert('Failed to approve request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleReject = async (request: PartCostRequest) => {
    if (!currentUser) return
    
    setIsProcessing(true)
    try {
      const { error } = await supabase
        .from('part_cost_requests')
        .update({
          status: 'rejected',
          admin_notes: adminNotes.trim() || null,
          approved_by: currentUser.name || currentUser.email,
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', request.id)

      if (error) {
        console.error('Error rejecting request:', error)
        alert('Failed to reject request')
      } else {
        // Refresh the requests list
        await loadPartCostRequests()
        setSelectedRequest(null)
        setAdminNotes('')
        setPartsOrderedBy('technician')
      }
    } catch (error) {
      console.error('Error rejecting request:', error)
      alert('Failed to reject request')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredRequests = requests.filter(request => {
    if (filterStatus === 'all') return true
    return request.status === filterStatus
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading part cost requests...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Part Cost Requests</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Review and approve technician part cost change requests
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
          {/* Statistics */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Total Requests</p>
                  <p className="text-lg sm:text-2xl font-bold text-gray-900">{requests.length}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Pending</p>
                  <p className="text-lg sm:text-2xl font-bold text-yellow-600">
                    {requests.filter(r => r.status === 'pending').length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Approved</p>
                  <p className="text-lg sm:text-2xl font-bold text-green-600">
                    {requests.filter(r => r.status === 'approved').length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="text-center">
                  <p className="text-xs sm:text-sm font-medium text-gray-500">Rejected</p>
                  <p className="text-lg sm:text-2xl font-bold text-red-600">
                    {requests.filter(r => r.status === 'rejected').length}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                    filterStatus === status
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Requests List */}
          <Card>
            <CardHeader>
              <CardTitle>Part Cost Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {request.job?.customer_name} - {request.job?.invoice_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {request.job?.type_serviced} • {request.job?.make_serviced}
                        </p>
                        <p className="text-sm text-gray-500">
                          Technician: {request.technician?.name} ({request.technician?.technician_code})
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          {request.status}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Current Parts Cost</p>
                        <p className="text-lg font-bold text-gray-900">
                          ${request.current_parts_cost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Requested Parts Cost</p>
                        <p className="text-lg font-bold text-blue-600">
                          ${request.requested_parts_cost.toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Difference</p>
                        <p className={`text-lg font-bold ${
                          request.requested_parts_cost > request.current_parts_cost 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          ${(request.requested_parts_cost - request.current_parts_cost).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Technician Notes</p>
                      <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                        {request.notes}
                      </p>
                    </div>

                    {request.status !== 'pending' && (
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Parts Ordered By</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.parts_ordered_by === 'technician' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.parts_ordered_by === 'technician' ? 'Technician' : 'Office'}
                        </span>
                      </div>
                    )}

                    {request.status === 'pending' && (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => setSelectedRequest(request)}
                          variant="secondary"
                          size="sm"
                        >
                          Review
                        </Button>
                      </div>
                    )}

                    {request.status !== 'pending' && request.admin_notes && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-1">Admin Notes</p>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-md">
                          {request.admin_notes}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {request.approved_by} • {new Date(request.approved_at || '').toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                ))}

                {filteredRequests.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No part cost requests found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Review Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Review Part Cost Request</h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="partsOrderedBy" className="block text-sm font-medium text-gray-700 mb-2">
                    Parts Ordered By
                  </label>
                  <select
                    id="partsOrderedBy"
                    value={partsOrderedBy}
                    onChange={(e) => setPartsOrderedBy(e.target.value as 'technician' | 'office')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="technician">Technician</option>
                    <option value="office">Office</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    This affects payout calculation - technician parts are reimbursed, office parts are not.
                  </p>
                </div>

                <div>
                  <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    id="adminNotes"
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about your decision..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => handleReject(selectedRequest)}
                    disabled={isProcessing}
                    variant="secondary"
                    className="flex-1"
                  >
                    {isProcessing ? 'Rejecting...' : 'Reject'}
                  </Button>
                  <Button
                    onClick={() => handleApprove(selectedRequest)}
                    disabled={isProcessing}
                    className="flex-1"
                  >
                    {isProcessing ? 'Approving...' : 'Approve'}
                  </Button>
                </div>

                <Button
                  onClick={() => {
                    setSelectedRequest(null)
                    setAdminNotes('')
                    setPartsOrderedBy('technician')
                  }}
                  variant="secondary"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 