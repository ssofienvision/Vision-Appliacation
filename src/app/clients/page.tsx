'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Sidebar from '@/components/Sidebar'
import { Users, Plus, Search, Filter, LogOut, User, Mail, Phone } from 'lucide-react'

interface Client {
  id: number
  name: string
  email: string
  phone: string
  address: string
  total_jobs: number
  total_spent: number
  last_service: string
  is_oem_client: boolean
}

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterOem, setFilterOem] = useState<'all' | 'oem' | 'non-oem'>('all')
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
    // Simulate loading clients data
    setTimeout(() => {
      setClients([
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '(555) 123-4567',
          address: '123 Main St, Anytown, ST 12345',
          total_jobs: 15,
          total_spent: 3245.50,
          last_service: '2024-01-15',
          is_oem_client: false
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.johnson@email.com',
          phone: '(555) 234-5678',
          address: '456 Oak Ave, Somewhere, ST 67890',
          total_jobs: 8,
          total_spent: 1890.75,
          last_service: '2024-01-14',
          is_oem_client: true
        },
        {
          id: 3,
          name: 'Mike Wilson',
          email: 'mike.wilson@email.com',
          phone: '(555) 345-6789',
          address: '789 Pine Rd, Elsewhere, ST 11111',
          total_jobs: 22,
          total_spent: 5678.90,
          last_service: '2024-01-13',
          is_oem_client: false
        },
        {
          id: 4,
          name: 'Lisa Brown',
          email: 'lisa.brown@email.com',
          phone: '(555) 456-7890',
          address: '321 Elm St, Nowhere, ST 22222',
          total_jobs: 12,
          total_spent: 2345.60,
          last_service: '2024-01-12',
          is_oem_client: true
        },
        {
          id: 5,
          name: 'David Lee',
          email: 'david.lee@email.com',
          phone: '(555) 567-8901',
          address: '654 Maple Dr, Anywhere, ST 33333',
          total_jobs: 18,
          total_spent: 4123.45,
          last_service: '2024-01-11',
          is_oem_client: false
        }
      ])
      setLoading(false)
    }, 1000)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filterOem === 'all' ||
                         (filterOem === 'oem' && client.is_oem_client) ||
                         (filterOem === 'non-oem' && !client.is_oem_client)
    
    return matchesSearch && matchesFilter
  })

  const totalClients = clients.length
  const oemClients = clients.filter(client => client.is_oem_client).length
  const totalRevenue = clients.reduce((sum, client) => sum + client.total_spent, 0)
  const avgRevenuePerClient = totalClients > 0 ? totalRevenue / totalClients : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Clients</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Manage and track client information
                  {currentUser?.name && ` - Welcome, ${currentUser.name}`}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <Button size="sm">
                  <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Add Client</span>
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
          {/* Summary Stats */}
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-4 mb-6 sm:mb-8">
            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Clients</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <User className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">OEM Clients</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">{oemClients}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Mail className="h-6 w-6 sm:h-8 sm:w-8 text-orange-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Total Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Phone className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                  </div>
                  <div className="ml-3 sm:ml-4">
                    <p className="text-xs sm:text-sm font-medium text-gray-500">Avg Revenue/Client</p>
                    <p className="text-lg sm:text-2xl font-bold text-gray-900">
                      ${avgRevenuePerClient.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <select
                value={filterOem}
                onChange={(e) => setFilterOem(e.target.value as 'all' | 'oem' | 'non-oem')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Clients</option>
                <option value="oem">OEM Clients</option>
                <option value="non-oem">Non-OEM Clients</option>
              </select>
            </div>
          </div>

          {/* Clients List */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jobs</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Spent</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClients.map((client) => (
                    <tr key={client.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.name}</div>
                          <div className="text-sm text-gray-500">{client.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-gray-900">{client.email}</div>
                          <div className="text-sm text-gray-500">{client.phone}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.total_jobs}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${client.total_spent.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.last_service}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          client.is_oem_client 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {client.is_oem_client ? 'OEM' : 'Standard'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        <button className="text-green-600 hover:text-green-900">Edit</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 