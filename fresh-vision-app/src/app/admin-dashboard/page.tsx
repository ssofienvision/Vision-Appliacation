'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { 
  LogOut, 
  DollarSign, 
  Wrench, 
  TrendingUp, 
  Briefcase, 
  Users, 
  Settings,
  BarChart3,
  Home
} from 'lucide-react'

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    // Redirect technicians to tech-dashboard
    if (currentUser && currentUser.role === 'technician') {
      router.push('/tech-dashboard')
    }
  }, [currentUser, router])

  const initializeUser = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: technicianData, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) {
        console.warn('Could not fetch technician data:', error)
        setCurrentUser({ email: user.email, name: user.email, role: 'user' })
      } else {
        setCurrentUser(technicianData)
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const navigateTo = (path: string) => {
    router.push(path)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const isAdmin = currentUser?.role === 'admin'
  const isTechnician = currentUser?.role === 'technician'

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar userRole={currentUser?.role} />
      
      <div className="ml-64 p-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back, {currentUser?.name || currentUser?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>

        {/* Quick Access Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Tech Dashboard - Only for technicians */}
            {isTechnician && (
              <button
                onClick={() => navigateTo('/tech-dashboard')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                    <Home className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Tech Dashboard</h3>
                    <p className="text-sm text-gray-600">Your technician dashboard</p>
                  </div>
                </div>
              </button>
            )}

            {/* Jobs */}
            <button
              onClick={() => navigateTo('/jobs')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Jobs</h3>
                  <p className="text-sm text-gray-600">Manage job records</p>
                </div>
              </div>
            </button>

            {/* Parts */}
            <button
              onClick={() => navigateTo('/parts')}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                  <Wrench className="h-6 w-6 text-purple-600" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-gray-900">Parts</h3>
                  <p className="text-sm text-gray-600">Manage parts inventory</p>
                </div>
              </div>
            </button>

            {/* Payout - Only for technicians and admins */}
            {(isTechnician || isAdmin) && (
              <button
                onClick={() => navigateTo('/payout')}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                    <DollarSign className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Payout</h3>
                    <p className="text-sm text-gray-600">Calculate earnings</p>
                  </div>
                </div>
              </button>
            )}

            {/* Admin-only cards */}
            {isAdmin && (
              <>
                {/* Clients - Admin only */}
                <button
                  onClick={() => navigateTo('/clients')}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Users className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Clients</h3>
                      <p className="text-sm text-gray-600">View client information</p>
                    </div>
                  </div>
                </button>

                {/* Appliances - Admin only */}
                <button
                  onClick={() => navigateTo('/appliances')}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg group-hover:bg-orange-200 transition-colors">
                      <Wrench className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Appliances</h3>
                      <p className="text-sm text-gray-600">Appliance management</p>
                    </div>
                  </div>
                </button>

                {/* Analytics - Admin only */}
                <button
                  onClick={() => navigateTo('/analytics')}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                      <TrendingUp className="h-6 w-6 text-indigo-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Analytics</h3>
                      <p className="text-sm text-gray-600">View detailed reports</p>
                    </div>
                  </div>
                </button>

                {/* Admin Dashboard - Admin only */}
                <button
                  onClick={() => navigateTo('/admin')}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-200 transition-colors">
                      <Settings className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900">Admin</h3>
                      <p className="text-sm text-gray-600">Admin dashboard</p>
                    </div>
                  </div>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Basic Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { title: 'Total Jobs', value: '--', color: 'blue' },
            { title: 'Active Jobs', value: '--', color: 'green' },
            { title: 'Total Revenue', value: '$--', color: 'purple' }
          ].map((item, index) => (
            <div key={`metric-${index}`} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-2">{item.title}</h2>
              <p className={`text-3xl font-bold text-${item.color}-600`}>{item.value}</p>
              <p className="text-sm text-gray-600">Ready for real data</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}