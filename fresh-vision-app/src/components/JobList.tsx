'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Search, Edit } from 'lucide-react'
import JobEditModal from './JobEditModal'
import { type Job } from '@/lib/database'

interface JobListProps {
  jobs: Job[]
  onJobUpdated?: () => void
}

export default function JobList({ jobs, onJobUpdated }: JobListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortField, setSortField] = useState<keyof Job>('date_recorded')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Debug logging
  console.log('🔍 JobList received jobs:', jobs)
  console.log('🔍 Sample job invoice numbers in JobList:', jobs.slice(0, 3).map(job => ({
    invoice_number: job.invoice_number,
    customer_name: job.customer_name
  })))

  const filteredJobs = jobs
    .filter(job => 
      job.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.type_serviced?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.make_serviced?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const aValue = a[sortField]
      const bValue = b[sortField]
      
      if (sortDirection === 'asc') {
        return (aValue || '') > (bValue || '') ? 1 : -1
      } else {
        return (aValue || '') < (bValue || '') ? 1 : -1
      }
    })

  const handleSort = (field: keyof Job) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const handleEditJob = (job: Job) => {
    setSelectedJob(job)
    setIsEditModalOpen(true)
  }

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false)
    setSelectedJob(null)
  }

  const handleJobUpdated = () => {
    if (onJobUpdated) {
      onJobUpdated()
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Recent Jobs
            <span className="text-sm text-gray-500 font-normal">
              {filteredJobs.length} of {jobs.length} jobs
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="mb-4 flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
              />
            </div>
          </div>

          {/* Mobile-friendly table */}
          <div className="space-y-4 md:space-y-0">
            {/* Desktop table header */}
            <div className="hidden md:grid md:grid-cols-7 gap-4 pb-3 border-b border-gray-200 text-xs font-medium text-gray-700">
              <button onClick={() => handleSort('date_recorded')} className="text-left hover:text-blue-600">
                Date {sortField === 'date_recorded' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('invoice_number')} className="text-left hover:text-blue-600">
                Invoice {sortField === 'invoice_number' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('customer_name')} className="text-left hover:text-blue-600">
                Customer {sortField === 'customer_name' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('type_serviced')} className="text-left hover:text-blue-600">
                Type {sortField === 'type_serviced' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('make_serviced')} className="text-left hover:text-blue-600">
                Brand {sortField === 'make_serviced' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <button onClick={() => handleSort('total_amount')} className="text-left hover:text-blue-600">
                Amount {sortField === 'total_amount' && (sortDirection === 'asc' ? '↑' : '↓')}
              </button>
              <span>Actions</span>
            </div>

            {/* Job rows */}
            {filteredJobs.slice(0, 50).map((job, index) => (
              <div key={`${job.invoice_number}-${job.technician}-${job.date_recorded}-${index}`} className="md:grid md:grid-cols-7 gap-4 py-3 border-b border-gray-100 last:border-b-0">
                <div className="md:hidden bg-gray-50 rounded-lg p-4 mb-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-900">{job.customer_name}</p>
                      <p className="text-sm text-gray-600">
                        #{job.invoice_number || 'No Invoice'}
                        {!job.invoice_number && <span className="text-red-500 ml-1">(Missing)</span>}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">
                        ${(job.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(job.date_recorded).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{job.type_serviced}</span>
                    <span>{job.make_serviced}</span>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button 
                      onClick={() => handleEditJob(job)}
                      className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      <Edit className="h-3 w-3" />
                      Edit Job
                    </button>
                  </div>
                </div>

                {/* Desktop table cells - directly in the grid */}
                <div className="hidden md:block text-xs text-gray-900">
                  {new Date(job.date_recorded).toLocaleDateString()}
                </div>
                <div className="hidden md:block text-xs text-gray-900 font-medium">
                  {job.invoice_number || (
                    <span className="text-red-500 italic">No Invoice</span>
                  )}
                </div>
                <div className="hidden md:block text-xs text-gray-900 truncate">
                  {job.customer_name}
                </div>
                <div className="hidden md:block text-xs text-gray-600 truncate">
                  {job.type_serviced}
                </div>
                <div className="hidden md:block text-xs text-gray-600 truncate">
                  {job.make_serviced}
                </div>
                <div className="hidden md:block text-xs font-bold text-green-600">
                  ${(job.total_amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="hidden md:block">
                  <button 
                    onClick={() => handleEditJob(job)}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No jobs found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <JobEditModal
        job={selectedJob}
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        onJobUpdated={handleJobUpdated}
      />
    </>
  )
} 