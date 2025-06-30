'use client'

import { Card, CardContent } from '@/components/ui/Card'
import { BarChart3, DollarSign, Users, TrendingUp, Wrench, Clock } from 'lucide-react'

interface Metrics {
  totalJobs?: number
  totalSales?: number
  totalTechnicians?: number
  avgSalePerJob?: number
  serviceCallPercentage?: number
  totalLabor?: number
  totalParts?: number
  jobsThisMonth?: number
  salesThisMonth?: number
}

interface KPIDashboardProps {
  metrics: Metrics
}

export default function KPIDashboard({ metrics }: KPIDashboardProps) {
  const formatCurrency = (amount: number = 0) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount)
  }

  const formatNumber = (num: number = 0) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const kpiCards = [
    {
      title: 'Total Jobs',
      value: formatNumber(metrics.totalJobs || 0),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Total Sales',
      value: formatCurrency(metrics.totalSales || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Technicians',
      value: formatNumber(metrics.totalTechnicians || 0),
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Avg Sale/Job',
      value: formatCurrency(metrics.avgSalePerJob || 0),
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      title: 'Service Calls',
      value: `${(metrics.serviceCallPercentage || 0).toFixed(1)}%`,
      icon: Wrench,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      title: 'This Month',
      value: formatNumber(metrics.jobsThisMonth || 0),
      icon: Clock,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {kpiCards.map((card, index) => (
        <Card key={index}>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 sm:h-6 sm:w-6 ${card.color}`} />
                </div>
              </div>
              <div className="ml-3 sm:ml-4 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">{card.title}</p>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 truncate">{card.value}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 