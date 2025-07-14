import React from 'react'

interface SalesByStateChartProps {
  data?: { state: string; sales: number; count: number }[]
}

export default function SalesByStateChart({ data }: SalesByStateChartProps) {
    return (
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Sales by State</h3>
        <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
          {data && data.length > 0 ? (
            <div className="text-center">
              <p className="text-gray-600 mb-2">Data available for {data.length} states</p>
              <p className="text-sm text-gray-500">Chart visualization coming soon</p>
            </div>
          ) : (
            <p className="text-gray-600">Chart will be displayed here once data is available.</p>
          )}
        </div>
      </div>
    )
  }