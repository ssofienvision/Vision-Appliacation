'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Users, ChevronDown } from 'lucide-react'

interface Technician {
  technician_code: string
  name: string
  email: string
  role: string
}

interface TechnicianFilterProps {
  technicians: Technician[]
  selectedTechnician: string
  onTechnicianChange: (technician: string) => void
  isAdmin: boolean
}

export default function TechnicianFilter({ 
  technicians, 
  selectedTechnician, 
  onTechnicianChange, 
  isAdmin 
}: TechnicianFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  const handleTechnicianChange = (technicianCode: string) => {
    onTechnicianChange(technicianCode)
    setIsOpen(false)
  }

  const getCurrentTechnicianName = () => {
    if (!selectedTechnician) return 'All Technicians'
    const tech = technicians.find(t => t.technician_code === selectedTechnician)
    return tech ? tech.name : 'All Technicians'
  }

  // Only show filter if user is admin
  if (!isAdmin) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-2">
            <Users className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Technician:</span>
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-auto bg-white text-gray-900"
            >
              <span className="flex-1 sm:flex-none">{getCurrentTechnicianName()}</span>
              <ChevronDown className="h-4 w-4 text-gray-500 flex-shrink-0" />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-full sm:w-64 bg-white border border-gray-300 rounded-md shadow-lg z-10">
                <div className="py-1">
                  <button
                    onClick={() => handleTechnicianChange('')}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                      selectedTechnician === '' ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    All Technicians
                  </button>
                  {technicians.map((technician) => (
                    <button
                      key={technician.technician_code}
                      onClick={() => handleTechnicianChange(technician.technician_code)}
                      className={`block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 ${
                        selectedTechnician === technician.technician_code ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium">{technician.name}</div>
                        <div className="text-xs text-gray-500">{technician.technician_code}</div>
                      </div>
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