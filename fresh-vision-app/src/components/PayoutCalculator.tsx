'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Calculator } from 'lucide-react'
import { Job } from '@/lib/database'

interface PayoutData {
  oemJobs: Job[]
  nonOemJobs: Job[]
  totalOemPayout: number
  totalNonOemPayout: number
  totalPayout: number
}

interface PayoutCalculatorProps {
  jobs: Job[]
}

export default function PayoutCalculator({ jobs }: PayoutCalculatorProps) {
  const [payoutData, setPayoutData] = useState<PayoutData>({
    oemJobs: [],
    nonOemJobs: [],
    totalOemPayout: 0,
    totalNonOemPayout: 0,
    totalPayout: 0
  })

  useEffect(() => {
    if (!jobs || jobs.length === 0) return

    const oemJobs = jobs.filter(job => job.is_oem_client)
    const nonOemJobs = jobs.filter(job => !job.is_oem_client)

    const calculatePayout = (totalSales: number, partsCost: number, isOem: boolean) => {
      const labor = totalSales - partsCost
      return isOem ? labor * 0.065 + partsCost : labor * 0.5 + partsCost
    }

    const totalOemPayout = oemJobs.reduce((sum, job) => 
      sum + calculatePayout(job.total_amount || 0, job.parts_cost || 0, true), 0
    )

    const totalNonOemPayout = nonOemJobs.reduce((sum, job) => 
      sum + calculatePayout(job.total_amount || 0, job.parts_cost || 0, false), 0
    )

    setPayoutData({
      oemJobs,
      nonOemJobs,
      totalOemPayout,
      totalNonOemPayout,
      totalPayout: totalOemPayout + totalNonOemPayout
    })
  }, [jobs])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          Payout Calculation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            <div className="bg-blue-50 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-blue-800 mb-1">OEM Jobs</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-900">
                ${payoutData.totalOemPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs sm:text-sm text-blue-600">{payoutData.oemJobs.length} jobs @ 6.5%</p>
            </div>
            
            <div className="bg-green-50 rounded-lg p-3 sm:p-4">
              <h4 className="text-xs sm:text-sm font-medium text-green-800 mb-1">Non-OEM Jobs</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-900">
                ${payoutData.totalNonOemPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs sm:text-sm text-green-600">{payoutData.nonOemJobs.length} jobs @ 50%</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 sm:col-span-2 lg:col-span-1">
              <h4 className="text-xs sm:text-sm font-medium text-gray-800 mb-1">Total Payout</h4>
              <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
                ${payoutData.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-xs sm:text-sm text-gray-600">All jobs combined</p>
            </div>
          </div>

          {/* Calculation Formula */}
          <div className="bg-yellow-50 rounded-lg p-3 sm:p-4">
            <h4 className="text-xs sm:text-sm font-medium text-yellow-800 mb-2">Payout Formula</h4>
            <div className="text-xs sm:text-sm text-yellow-700 space-y-1">
              <p><strong>OEM Jobs:</strong> (Total Sales - Parts Cost) × 6.5% + Parts Cost</p>
              <p><strong>Non-OEM Jobs:</strong> (Total Sales - Parts Cost) × 50% + Parts Cost</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 