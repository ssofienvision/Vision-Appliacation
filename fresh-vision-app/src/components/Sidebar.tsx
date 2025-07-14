import React from 'react'
import { 
  BarChart3, 
  Home, 
  Briefcase, 
  Users, 
  Settings, 
  DollarSign, 
  Wrench,
  TrendingUp
} from 'lucide-react'

interface SidebarProps {
  userRole?: string
}

export default function Sidebar({ userRole }: SidebarProps) {
  const isAdmin = userRole === 'admin'
  const isTechnician = userRole === 'technician'

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gray-800 text-white p-4 z-10">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">Navigation</h2>
        <p className="text-gray-300 text-sm">Role: {userRole || 'User'}</p>
      </div>
      
      <nav className="space-y-2">
        {/* Dashboard - Different for admin vs technician */}
        {isAdmin ? (
          <a 
            href="/dashboard" 
            className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
          >
            <Home className="h-5 w-5" />
            Dashboard
          </a>
        ) : (
          <a 
            href="/tech-dashboard" 
            className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
          >
            <Home className="h-5 w-5" />
            Tech Dashboard
          </a>
        )}

        {/* Jobs - Available to all */}
        <a 
          href="/jobs" 
          className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
        >
          <Briefcase className="h-5 w-5" />
          Jobs
        </a>

        {/* Parts - Available to all */}
        <a 
          href="/parts" 
          className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
        >
          <Wrench className="h-5 w-5" />
          Parts
        </a>

        {/* Payout - Available to technicians and admins */}
        {(isTechnician || isAdmin) && (
          <a 
            href="/payout" 
            className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
          >
            <DollarSign className="h-5 w-5" />
            Payout
          </a>
        )}

        {/* Admin-only pages */}
        {isAdmin && (
          <>
            {/* Clients - Admin only */}
            <a 
              href="/clients" 
              className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
            >
              <Users className="h-5 w-5" />
              Clients
            </a>

            {/* Appliances - Admin only */}
            <a 
              href="/appliances" 
              className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
            >
              <Wrench className="h-5 w-5" />
              Appliances
            </a>

            {/* Analytics - Admin only */}
            <a 
              href="/analytics" 
              className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
            >
              <TrendingUp className="h-5 w-5" />
              Analytics
            </a>

            {/* Admin Section Separator */}
            <div className="border-t border-gray-600 my-4"></div>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-4 mb-2">
              Admin
            </div>
            
            {/* Admin Dashboard */}
            <a 
              href="/admin" 
              className="flex items-center gap-3 py-2 px-4 rounded hover:bg-gray-700 text-white transition-colors"
            >
              <Settings className="h-5 w-5" />
              Admin Dashboard
            </a>
          </>
        )}
      </nav>
    </div>
  )
}