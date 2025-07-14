'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'

interface SalesData {
  month: string
  sales: number
}

interface SalesOverTimeChartProps {
  data: SalesData[]
}

export default function SalesOverTimeChart({ data }: SalesOverTimeChartProps) {
  const formatTooltip = (value: number, name: string) => {
    if (name === 'sales') {
      return [`$${value.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 'Sales']
    }
    return [value, name]
  }

  const formatXAxisLabel = (tickItem: string) => {
    const date = new Date(tickItem + '-01')
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg sm:text-xl">Sales Over Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tickFormatter={formatXAxisLabel}
                fontSize={12}
                tick={{ fontSize: 10 }}
              />
              <YAxis 
                tickFormatter={(value) => `$${value.toLocaleString()}`}
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
              <Line 
                type="monotone" 
                dataKey="sales" 
                stroke="#2563eb" 
                strokeWidth={2}
                dot={{ fill: '#2563eb', strokeWidth: 2, r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
} 