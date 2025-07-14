'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { ChevronUp, ChevronDown, TrendingUp, DollarSign, Wrench, Users } from 'lucide-react'

interface ClientData {
  customer_name: string
  totalSales: number
  totalJobs: number
  avgSalePerJob: number
  totalLabor: number
  totalParts: number
  lastJobDate: string
  state: string
  city: string
}

interface TopClientsTableProps {
  clients: ClientData[]
  loading?: boolean
}

export default function TopClientsTable({ clients, loading = false }: TopClientsTableProps) {
  const [sortField, setSortField] = useState<keyof ClientData>('totalSales')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  const handleSort = (field: keyof ClientData) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const sortedClients = [...clients].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    }
    
    return 0
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const SortIcon = ({ field }: { field: keyof ClientData }) => {
    if (sortField !== field) {
      return <ChevronUp className="h-4 w-4 text-gray-400" />
    }
    return sortOrder === 'asc' 
      ? <ChevronUp className="h-4 w-4 text-blue-600" />
      : <ChevronDown className="h-4 w-4 text-blue-600" />
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top 25 Clients by Sales Volume
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading clients...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Top 25 Clients by Sales Volume
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 font-medium text-gray-900">Rank</th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">Client Name</th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalJobs')}
                >
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    Job Count
                    <SortIcon field="totalJobs" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalSales')}
                >
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-4 w-4" />
                    Total Sales
                    <SortIcon field="totalSales" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('totalLabor')}
                >
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    Total Labor
                    <SortIcon field="totalLabor" />
                  </div>
                </th>
                <th 
                  className="text-left py-3 px-2 font-medium text-gray-900 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleSort('avgSalePerJob')}
                >
                  <div className="flex items-center gap-1">
                    <TrendingUp className="h-4 w-4" />
                    Avg Sale
                    <SortIcon field="avgSalePerJob" />
                  </div>
                </th>
                <th className="text-left py-3 px-2 font-medium text-gray-900">
                  <div className="flex items-center gap-1">
                    <Wrench className="h-4 w-4" />
                    Avg Labor
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedClients.map((client, index) => (
                <tr key={client.customer_name} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2 font-medium text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="py-3 px-2 font-medium text-gray-900">
                    {client.customer_name}
                  </td>
                  <td className="py-3 px-2 text-gray-700">
                    {client.totalJobs.toLocaleString()}
                  </td>
                  <td className="py-3 px-2 font-medium text-green-600">
                    {formatCurrency(client.totalSales)}
                  </td>
                  <td className="py-3 px-2 text-gray-700">
                    {formatCurrency(client.totalLabor)}
                  </td>
                  <td className="py-3 px-2 text-gray-700">
                    {formatCurrency(client.avgSalePerJob)}
                  </td>
                  <td className="py-3 px-2 text-gray-700">
                    {formatCurrency(client.totalLabor / client.totalJobs)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {sortedClients.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No client data available
          </div>
        )}
      </CardContent>
    </Card>
  )
} 