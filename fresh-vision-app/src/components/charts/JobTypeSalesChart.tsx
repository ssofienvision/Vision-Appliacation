'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface JobTypeData {
  type: string
  totalSales: number
  count: number
}

interface JobTypeSalesChartProps {
  data: JobTypeData[]
}

export default function JobTypeSalesChart({ data }: JobTypeSalesChartProps) {
  const formatTooltip = (value: number, name: string) => {
    if (name === 'totalSales') {
      return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Total Sales']
    }
    if (name === 'count') {
      return [`${value} jobs`, 'Job Count']
    }
    return [value, name]
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Sales by Job Type (Top 10)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="type" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                fontSize={10}
                tick={{ fontSize: 9 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                formatter={formatTooltip}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="totalSales" fill="#2563eb" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 