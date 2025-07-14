'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface ServiceCallPieChartProps {
  serviceCallPercentage?: number
}

export default function ServiceCallPieChart({ serviceCallPercentage = 75 }: ServiceCallPieChartProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Service Call Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80 flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">
              {serviceCallPercentage}%
            </div>
            <div className="text-sm text-gray-600">Service Calls</div>
            <div className="text-sm text-gray-600">
              {100 - serviceCallPercentage}% Other Jobs
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}