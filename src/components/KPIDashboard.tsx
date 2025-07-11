import { Card, CardContent } from '@/components/ui/Card'
import { 
  BarChart3, 
  DollarSign, 
  Users, 
  TrendingUp, 
  Wrench, 
  Clock,
  Package,
  Calculator,
  Percent,
  PieChart,
  Banknote,
  Target,
  FileText
} from 'lucide-react'

interface Metrics {
  // Original metrics
  totalJobs?: number
  totalSales?: number
  totalTechnicians?: number
  avgSalePerJob?: number
  serviceCallPercentage?: number
  jobsThisMonth?: number
  
  // Enhanced/missing metrics
  totalLabor?: number
  totalParts?: number
  salesThisMonth?: number
  avgLaborPerJob?: number
  partsSalesRatio?: number
  laborSalesRatio?: number
  totalPayout?: number
  oemJobsCount?: number
  nonOemJobsCount?: number
  oemSales?: number
  nonOemSales?: number
  serviceCallCount?: number
  
  // New KPIs
  invoiceCount?: number
  salesByState?: { state: string; sales: number; count: number }[]
  returnCustomerCount?: number
  returnCustomerPercentage?: number
  totalPartProfit?: number
  avgPartProfit?: number
  totalServiceCallSales?: number
  serviceCallToTotalSalesRatio?: number
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

  const formatPercent = (num: number = 0) => {
    return `${num.toFixed(1)}%`
  }

  const kpiCards = [
    // Primary Business Metrics
    {
      title: 'Total Jobs',
      value: formatNumber(metrics.totalJobs || 0),
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      category: 'primary'
    },
    {
      title: 'Total Sales',
      value: formatCurrency(metrics.totalSales || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      category: 'primary'
    },
    {
      title: 'Total Labor',
      value: formatCurrency(metrics.totalLabor || 0),
      icon: Wrench,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
      category: 'primary'
    },
    {
      title: 'Total Parts',
      value: formatCurrency(metrics.totalParts || 0),
      icon: Package,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      category: 'primary'
    },
    {
      title: 'Invoice Count',
      value: formatNumber(metrics.invoiceCount || 0),
      icon: FileText,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      category: 'primary'
    },

    // Performance Metrics
    {
      title: 'Avg Sale/Job',
      value: formatCurrency(metrics.avgSalePerJob || 0),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-100',
      category: 'performance'
    },
    {
      title: 'Avg Labor/Job',
      value: formatCurrency(metrics.avgLaborPerJob || 0),
      icon: Calculator,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-100',
      category: 'performance'
    },
    {
      title: 'Parts/Sales Ratio',
      value: formatPercent(metrics.partsSalesRatio || 0),
      icon: PieChart,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100',
      category: 'performance'
    },
    {
      title: 'Labor/Sales Ratio',
      value: formatPercent(metrics.laborSalesRatio || 0),
      icon: Percent,
      color: 'text-rose-600',
      bgColor: 'bg-rose-100',
      category: 'performance'
    },
    {
      title: 'Total Part Profit',
      value: formatCurrency(metrics.totalPartProfit || 0),
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      category: 'performance'
    },
    {
      title: 'Avg Part Profit',
      value: formatCurrency(metrics.avgPartProfit || 0),
      icon: Calculator,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      category: 'performance'
    },

    // Service & Activity Metrics
    {
      title: 'Service Calls',
      value: `${formatNumber(metrics.serviceCallCount || 0)} (${formatPercent(metrics.serviceCallPercentage || 0)})`,
      icon: Wrench,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      category: 'service'
    },
    {
      title: 'Service Call Sales',
      value: formatCurrency(metrics.totalServiceCallSales || 0),
      subtitle: `${formatPercent(metrics.serviceCallToTotalSalesRatio || 0)} of total sales`,
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-100',
      category: 'service'
    },
    {
      title: 'Active Technicians',
      value: formatNumber(metrics.totalTechnicians || 0),
      icon: Users,
      color: 'text-violet-600',
      bgColor: 'bg-violet-100',
      category: 'service'
    },
    {
      title: 'Jobs This Month',
      value: formatNumber(metrics.jobsThisMonth || 0),
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      category: 'service'
    },
    {
      title: 'Sales This Month',
      value: formatCurrency(metrics.salesThisMonth || 0),
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      category: 'service'
    },

    // Customer Metrics
    {
      title: 'Return Customers',
      value: `${formatNumber(metrics.returnCustomerCount || 0)} (${formatPercent(metrics.returnCustomerPercentage || 0)})`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      category: 'customers'
    },

    // OEM vs Non-OEM Analysis
    {
      title: 'OEM Jobs',
      value: `${formatNumber(metrics.oemJobsCount || 0)} jobs`,
      subtitle: formatCurrency(metrics.oemSales || 0),
      icon: Target,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      category: 'oem'
    },
    {
      title: 'Non-OEM Jobs',
      value: `${formatNumber(metrics.nonOemJobsCount || 0)} jobs`,
      subtitle: formatCurrency(metrics.nonOemSales || 0),
      icon: Target,
      color: 'text-teal-600',
      bgColor: 'bg-teal-100',
      category: 'oem'
    },

    // Payout Information
    {
      title: 'Total Payout',
      value: formatCurrency(metrics.totalPayout || 0),
      icon: Banknote,
      color: 'text-emerald-700',
      bgColor: 'bg-emerald-100',
      category: 'payout'
    }
  ]

  // Group cards by category for better organization
  const primaryCards = kpiCards.filter(card => card.category === 'primary')
  const performanceCards = kpiCards.filter(card => card.category === 'performance')
  const serviceCards = kpiCards.filter(card => card.category === 'service')
  const customerCards = kpiCards.filter(card => card.category === 'customers')
  const oemCards = kpiCards.filter(card => card.category === 'oem')
  const payoutCards = kpiCards.filter(card => card.category === 'payout')

  const renderKPISection = (title: string, cards: typeof kpiCards) => (
    <div className="mb-8">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card key={`${card.category}-${index}`} className="hover:shadow-lg transition-shadow border-0 bg-white rounded-xl">
            <CardContent className="p-5 sm:p-7 flex items-center min-h-[110px]">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                  <card.icon className={`h-7 w-7 sm:h-8 sm:w-8 ${card.color}`} />
                </div>
              </div>
              <div className="ml-5 min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-gray-500 truncate mb-1">{card.title}</p>
                <p className="text-xl sm:text-2xl lg:text-xl font-extrabold text-gray-900 leading-tight mb-1">{card.value}</p>
                {card.subtitle && (
                  <p className="text-sm text-gray-600 mt-1">{card.subtitle}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )

  return (
    <div className="space-y-8">
      {/* Primary Business Metrics */}
      {renderKPISection('Business Overview', primaryCards)}

      {/* Performance Metrics */}
      {renderKPISection('Performance Analytics', performanceCards)}

      {/* Service & Activity */}
      {renderKPISection('Service Activity', serviceCards)}

      {/* Customer Metrics */}
      {renderKPISection('Customer Analytics', customerCards)}

      {/* OEM Analysis */}
      {renderKPISection('OEM vs Non-OEM Analysis', oemCards)}

      {/* Payout Information */}
      {renderKPISection('Payout Summary', payoutCards)}

      {/* Quick Summary Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {formatPercent(((metrics.totalLabor || 0) / (metrics.totalSales || 1)) * 100)}
              </p>
              <p className="text-sm text-gray-600">Labor Margin</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency((metrics.totalSales || 0) / (metrics.totalTechnicians || 1))}
              </p>
              <p className="text-sm text-gray-600">Sales/Technician</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">
                {formatNumber(Math.round((metrics.totalJobs || 0) / (metrics.totalTechnicians || 1)))}
              </p>
              <p className="text-sm text-gray-600">Jobs/Technician</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-600">
                {formatPercent(((metrics.oemJobsCount || 0) / (metrics.totalJobs || 1)) * 100)}
              </p>
              <p className="text-sm text-gray-600">OEM Job Rate</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}