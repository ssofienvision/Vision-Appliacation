'use client'

import { useState, useEffect } from 'react'
import { jobsService, type ClientData } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { MonthlySalesChart } from '@/components/charts'
import TopClientsTable from '@/components/TopClientsTable'
import { TrendingUp, DollarSign, Wrench, Calendar, Users, Target } from 'lucide-react'

interface ClientTrackerProps {
  userRole?: string
  technicianCode?: string
}

interface MonthlyData {
  month: string
  totalSales: number
  totalJobs: number
  avgJobValue: number
  yearToDateSales: number
}

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  color: string
}

function KPICard({ title, value, subtitle, icon, color }: KPICardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center">
          <div className={`flex-shrink-0 p-3 rounded-lg ${color}`}>
            {icon}
          </div>
          <div className="ml-4">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ClientTracker({ userRole, technicianCode }: ClientTrackerProps) {
  const [loading, setLoading] = useState(true)
  const [clients, setClients] = useState<ClientData[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [kpiData, setKpiData] = useState({
    totalJobs: 0,
    avgJobValue: 0,
    yearToDateSales: 0
  })

  useEffect(() => {
    loadClientData()
  }, [technicianCode])

  const loadClientData = async () => {
    try {
      setLoading(true)
      console.log('🔍 Loading client data...')
      
      // Load top 25 clients
      const topClients = await jobsService.getTopClients({
        limit: 25,
        sortBy: 'totalSales',
        sortOrder: 'desc'
        // Temporarily removed technician filter to test
        // technician: technicianCode
      })
      
      console.log('📊 Top clients data:', topClients)
      console.log('📊 Number of clients returned:', topClients?.length || 0)
      
      setClients(topClients || [])

      // Calculate monthly data from client data
      const monthly = calculateMonthlyData(topClients || [])
      setMonthlyData(monthly)

      // Calculate KPIs
      const totalJobs = (topClients || []).reduce((sum, client) => sum + client.totalJobs, 0)
      const totalSales = (topClients || []).reduce((sum, client) => sum + client.totalSales, 0)
      const avgJobValue = totalJobs > 0 ? totalSales / totalJobs : 0
      
      // Calculate year-to-date sales (sum of current year monthly data)
      const currentYear = new Date().getFullYear()
      const ytdSales = monthly
        .filter(m => new Date(m.month + '-01').getFullYear() === currentYear)
        .reduce((sum, m) => sum + m.totalSales, 0)

      setKpiData({
        totalJobs,
        avgJobValue,
        yearToDateSales: ytdSales
      })

    } catch (error) {
      console.error('❌ Error loading client data:', error)
      setClients([])
      setMonthlyData([])
      setKpiData({
        totalJobs: 0,
        avgJobValue: 0,
        yearToDateSales: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateMonthlyData = (clientData: ClientData[]): MonthlyData[] => {
    const monthlyMap = new Map<string, { sales: number; jobs: number }>()

    // Aggregate data by month from all clients
    clientData.forEach(client => {
      client.monthlyData?.forEach(monthData => {
        const existing = monthlyMap.get(monthData.month) || { sales: 0, jobs: 0 }
        monthlyMap.set(monthData.month, {
          sales: existing.sales + monthData.sales,
          jobs: existing.jobs + monthData.jobs
        })
      })
    })

    // Convert to array and sort by date
    const monthlyArray = Array.from(monthlyMap.entries()).map(([month, data]) => ({
      month,
      totalSales: data.sales,
      totalJobs: data.jobs,
      avgJobValue: data.jobs > 0 ? data.sales / data.jobs : 0,
      yearToDateSales: 0 // Will be calculated separately
    }))

    // Sort by month (newest first)
    monthlyArray.sort((a, b) => new Date(b.month + '-01').getTime() - new Date(a.month + '-01').getTime())

    // Calculate cumulative YTD sales
    const currentYear = new Date().getFullYear()
    let cumulativeYTD = 0
    
    monthlyArray.forEach(item => {
      const itemYear = new Date(item.month + '-01').getFullYear()
      if (itemYear === currentYear) {
        cumulativeYTD += item.totalSales
      }
      item.yearToDateSales = cumulativeYTD
    })

    return monthlyArray.slice(0, 12) // Return last 12 months
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading client data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Debug Info */}
      {clients.length === 0 && !loading && (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">No client data available</p>
              <p className="text-sm text-gray-500">This could mean:</p>
              <ul className="text-sm text-gray-500 mt-2 space-y-1">
                <li>• No jobs data in the database</li>
                <li>• Database connection issue</li>
                <li>• Filter applied (technician code: {technicianCode || 'none'})</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total Jobs"
          value={kpiData.totalJobs.toLocaleString()}
          subtitle="Across top 25 clients"
          icon={<Wrench className="h-6 w-6 text-white" />}
          color="bg-blue-500"
        />
        <KPICard
          title="Average Job Value"
          value={formatCurrency(kpiData.avgJobValue)}
          subtitle="Per job average"
          icon={<TrendingUp className="h-6 w-6 text-white" />}
          color="bg-green-500"
        />
        <KPICard
          title="Year-to-Date Sales"
          value={formatCurrency(kpiData.yearToDateSales)}
          subtitle="Current year total"
          icon={<DollarSign className="h-6 w-6 text-white" />}
          color="bg-purple-500"
        />
      </div>

      {/* Monthly Sales Chart */}
      <MonthlySalesChart data={monthlyData} />

      {/* Top 25 Clients Table */}
      <TopClientsTable clients={clients.map(client => ({
        ...client,
        lastJobDate: client.lastJobDate || client.firstJobDate
      }))} loading={loading} />
    </div>
  )
}