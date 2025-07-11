'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Calendar, ChevronDown } from 'lucide-react'

interface DateFilterProps {
  selectedPeriod: string
  setSelectedPeriod: (period: string) => void
  onFilterChange?: (filters: any) => void
}

export default function DateFilter({ selectedPeriod, setSelectedPeriod, onFilterChange }: DateFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const periods = [
    { value: 'allTime', label: 'All Time' },
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'thisYear', label: 'This Year' },
    { value: 'lastYear', label: 'Last Year' },
    { value: 'last30Days', label: 'Last 30 Days' },
    { value: 'last90Days', label: 'Last 90 Days' },
    { value: 'custom', label: 'Custom Range' }
  ]

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    setIsOpen(false)
    
    if (onFilterChange) {
      const filters = getDateFilters(period)
      onFilterChange(filters)
    }
  }

  const getDateFilters = (period: string) => {
    const now = new Date()
    let startDate, endDate

    switch (period) {
      case 'allTime':
        // Return empty object to get all data without date filters
        return {}
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
      case 'last30Days':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      case 'last90Days':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
        endDate = now
        break
      default:
        return {}
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const getCurrentPeriodLabel = () => {
    const period = periods.find(p => p.value === selectedPeriod)
    return period ? period.label : 'Select Period'
  }

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Time Period:</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto"
            >
              <span className="flex-1 sm:flex-none">{getCurrentPeriodLabel()}</span>
              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-full sm:w-48 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <div className="py-1">
                  {periods.map((period) => (
                    <button
                      key={period.value}
                      onClick={() => handlePeriodChange(period.value)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        selectedPeriod === period.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {period.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 