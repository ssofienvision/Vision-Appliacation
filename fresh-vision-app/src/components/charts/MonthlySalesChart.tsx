'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface MonthlyData {
  month: string
  totalSales: number
  totalJobs: number
  avgJobValue: number
  yearToDateSales: number
}

interface MonthlySalesChartProps {
  data: MonthlyData[]
}

export default function MonthlySalesChart({ data }: MonthlySalesChartProps) {
  const formatTooltip = (value: number, name: string) => {
    if (name === 'totalSales' || name === 'avgJobValue' || name === 'yearToDateSales') {
      return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, name === 'totalSales' ? 'Total Sales' : name === 'avgJobValue' ? 'Avg Job Value' : 'YTD Sales']
    }
    return [value, name === 'totalJobs' ? 'Total Jobs' : name]
  }

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem + '-01')
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Monthly Sales Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatXAxisLabel}
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `$${value.toLocaleString()}`}
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => value.toLocaleString()}
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <Tooltip 
                formatter={formatTooltip}
                labelFormatter={(label) => formatXAxisLabel(label)}
                contentStyle={{
                  backgroundColor: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '12px'
                }}
              />
              <Legend />
              <Bar 
                yAxisId="left"
                dataKey="totalSales" 
                fill="#2563eb" 
                name="Total Sales"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                yAxisId="right"
                dataKey="totalJobs" 
                fill="#10b981" 
                name="Total Jobs"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 