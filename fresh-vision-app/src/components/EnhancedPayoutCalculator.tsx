'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Calculator, Package, Building2, User } from 'lucide-react'
import { Job } from '@/lib/database'

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
}

interface PayoutData {
  // Commission data
  totalCommission: number
  oemCommission: number
  nonOemCommission: number
  
  // Parts data
  techPartsTotal: number    // Parts bought by technician (no PO)
  officePartsTotal: number  // Parts bought by office (has PO)
  totalPartsValue: number   // All parts combined
  
  // Final payout
  totalPayout: number       // Commission + Tech Parts
  
  // Breakdown for display
  jobsCount: number
  oemJobsCount: number
  nonOemJobsCount: number
  techPartsCount: number
  officePartsCount: number
}

interface EnhancedPayoutCalculatorProps {
  jobs: Job[]
  partsRequests: PartCostRequest[]
  technicianCode: string
}

export default function EnhancedPayoutCalculator({ 
  jobs, 
  partsRequests, 
  technicianCode 
}: EnhancedPayoutCalculatorProps) {
  const [payoutData, setPayoutData] = useState<PayoutData>({
    totalCommission: 0,
    oemCommission: 0,
    nonOemCommission: 0,
    techPartsTotal: 0,
    officePartsTotal: 0,
    totalPartsValue: 0,
    totalPayout: 0,
    jobsCount: 0,
    oemJobsCount: 0,
    nonOemJobsCount: 0,
    techPartsCount: 0,
    officePartsCount: 0
  })

  useEffect(() => {
    if (!jobs || jobs.length === 0) {
      setPayoutData({
        totalCommission: 0,
        oemCommission: 0,
        nonOemCommission: 0,
        techPartsTotal: 0,
        officePartsTotal: 0,
        totalPartsValue: 0,
        totalPayout: 0,
        jobsCount: 0,
        oemJobsCount: 0,
        nonOemJobsCount: 0,
        techPartsCount: 0,
        officePartsCount: 0
      })
      return
    }

    // Calculate commission from jobs (65% for OEM, 50% for non-OEM)
    const oemJobs = jobs.filter(job => job.is_oem_client)
    const nonOemJobs = jobs.filter(job => !job.is_oem_client)
    
    const oemCommission = oemJobs.reduce((sum, job) => {
      const labor = (job.total_amount || 0) - (job.parts_cost || 0)
      return sum + (labor * 0.65) // 65% commission for OEM
    }, 0)
    
    const nonOemCommission = nonOemJobs.reduce((sum, job) => {
      const labor = (job.total_amount || 0) - (job.parts_cost || 0)
      return sum + (labor * 0.50) // 50% commission for non-OEM
    }, 0)
    
    const totalCommission = oemCommission + nonOemCommission

    // Filter parts requests for this technician
    const techPartsRequests = partsRequests?.filter(
      part => part.technician_id === technicianCode
    ) || []

    // Separate tech-bought vs office-bought parts based on parts_ordered_by
    const techBoughtParts = techPartsRequests.filter(
      part => part.parts_ordered_by === 'technician'
    )
    
    const officeBoughtParts = techPartsRequests.filter(
      part => part.parts_ordered_by === 'office'
    )

    // Calculate parts totals using requested_parts_cost
    const techPartsTotal = techBoughtParts.reduce((sum, part) => 
      sum + (part.requested_parts_cost || 0), 0
    )
    
    const officePartsTotal = officeBoughtParts.reduce((sum, part) => 
      sum + (part.requested_parts_cost || 0), 0
    )

    const totalPartsValue = techPartsTotal + officePartsTotal

    // Final payout = Commission + Tech Parts (office parts are not reimbursed)
    const totalPayout = totalCommission + techPartsTotal

    setPayoutData({
      totalCommission,
      oemCommission,
      nonOemCommission,
      techPartsTotal,
      officePartsTotal,
      totalPartsValue,
      totalPayout,
      jobsCount: jobs.length,
      oemJobsCount: oemJobs.length,
      nonOemJobsCount: nonOemJobs.length,
      techPartsCount: techBoughtParts.length,
      officePartsCount: officeBoughtParts.length
    })
  }, [jobs, partsRequests, technicianCode])

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
          <Calculator className="h-4 w-4 sm:h-5 sm:w-5" />
          Enhanced Payout Calculation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          
          {/* Commission Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Commission Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              
              {/* OEM Commission */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-blue-800 mb-1">OEM Jobs</h4>
                    <p className="text-xl font-bold text-blue-900">
                      ${payoutData.oemCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-blue-600">{payoutData.oemJobsCount} jobs @ 65%</p>
                  </div>
                  <Calculator className="h-6 w-6 text-blue-600" />
                </div>
              </div>

              {/* Non-OEM Commission */}
              <div className="bg-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-indigo-800 mb-1">Non-OEM Jobs</h4>
                    <p className="text-xl font-bold text-indigo-900">
                      ${payoutData.nonOemCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-indigo-600">{payoutData.nonOemJobsCount} jobs @ 50%</p>
                  </div>
                  <Calculator className="h-6 w-6 text-indigo-600" />
                </div>
              </div>
            </div>

            {/* Total Commission */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium text-purple-800 mb-1">Total Commission</h4>
                  <p className="text-2xl font-bold text-purple-900">
                    ${payoutData.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-sm text-purple-600">Combined from all jobs</p>
                </div>
                <Calculator className="h-8 w-8 text-purple-600" />
              </div>
            </div>
          </div>

          {/* Parts Section */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Parts Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Tech Parts (Reimbursed) */}
              <div className="bg-green-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <User className="h-6 w-6 text-green-600" />
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    REIMBURSED
                  </span>
                </div>
                <h4 className="text-sm font-medium text-green-800 mb-1">Tech-Bought Parts</h4>
                <p className="text-xl font-bold text-green-900">
                  ${payoutData.techPartsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-green-600">
                  {payoutData.techPartsCount} parts (ordered by technician)
                </p>
              </div>

              {/* Office Parts (Not Reimbursed) */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="h-6 w-6 text-gray-600" />
                  <span className="text-xs bg-gray-200 text-gray-800 px-2 py-1 rounded-full">
                    NOT REIMBURSED
                  </span>
                </div>
                <h4 className="text-sm font-medium text-gray-800 mb-1">Office-Bought Parts</h4>
                <p className="text-xl font-bold text-gray-900">
                  ${payoutData.officePartsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-600">
                  {payoutData.officePartsCount} parts (ordered by office)
                </p>
              </div>
            </div>
          </div>

          {/* Total Payout Section */}
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-emerald-800 mb-1">Total Payout</h4>
                <p className="text-3xl font-bold text-emerald-900">
                  ${payoutData.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-emerald-700 mt-2">
                  Commission + Tech Parts Reimbursement
                </p>
              </div>
              <Package className="h-10 w-10 text-emerald-600" />
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="bg-yellow-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-yellow-800 mb-3">Calculation Breakdown</h4>
            <div className="space-y-2 text-sm text-yellow-700">
              <div className="flex justify-between">
                <span>OEM Commission (65%):</span>
                <span className="font-medium">
                  ${payoutData.oemCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Non-OEM Commission (50%):</span>
                <span className="font-medium">
                  ${payoutData.nonOemCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between border-t border-yellow-200 pt-1">
                <span>Total Commission:</span>
                <span className="font-medium">
                  ${payoutData.totalCommission.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>+ Tech Parts Reimbursement:</span>
                <span className="font-medium">
                  ${payoutData.techPartsTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="border-t border-yellow-200 pt-2 flex justify-between font-bold">
                <span>Total Payout:</span>
                <span>
                  ${payoutData.totalPayout.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>

          {/* Formula Explanation */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-800 mb-2">Payout Formula</h4>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Commission Rates:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>OEM Jobs:</strong> (Total Job Amount - Parts Cost) × 65%</li>
                <li>• <strong>Non-OEM Jobs:</strong> (Total Job Amount - Parts Cost) × 50%</li>
              </ul>
              <p><strong>Parts Logic:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• <strong>Ordered by Technician:</strong> Part bought by technician → Reimbursed</li>
                <li>• <strong>Ordered by Office:</strong> Part bought by office → Not reimbursed</li>
              </ul>
              <p><strong>Final Payout:</strong> Total Commission + Tech-Bought Parts</p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            <div className="text-center">
              <p className="text-lg font-bold text-gray-900">{payoutData.jobsCount}</p>
              <p className="text-sm text-gray-600">Total Jobs</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{payoutData.techPartsCount}</p>
              <p className="text-sm text-gray-600">Reimbursed Parts</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-gray-600">{payoutData.officePartsCount}</p>
              <p className="text-sm text-gray-600">Office Parts</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 