'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { X, Save, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Job } from '@/lib/database'

interface JobEditModalProps {
  job: Job | null
  isOpen: boolean
  onClose: () => void
  onJobUpdated: () => void
}

interface PartCostRequest {
  job_invoice_number: string
  technician_id: string
  current_parts_cost: number
  requested_parts_cost: number
  notes: string
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

export default function JobEditModal({ job, isOpen, onClose, onJobUpdated }: JobEditModalProps) {
  const [partsCost, setPartsCost] = useState<number>(job?.parts_cost || 0)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  // Reset form when job changes
  useState(() => {
    if (job) {
      setPartsCost(job.parts_cost || 0)
      setNotes('')
      setSubmissionStatus('idle')
      setErrorMessage('')
    }
  })

  const handleSubmit = async () => {
    if (!job) return
    
    // Validate required fields
    if (!notes.trim()) {
      setErrorMessage('Notes are required')
      return
    }

    if (partsCost < 0) {
      setErrorMessage('Parts cost cannot be negative')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        throw new Error('User not authenticated')
      }

      // Get technician details
      const { data: technicianData } = await supabase
        .from('technicians')
        .select('*')
        .eq('email', user.email)
        .single()

      if (!technicianData) {
        throw new Error('Technician not found')
      }

      // Create part cost request
      const partCostRequest: Omit<PartCostRequest, 'created_at' | 'updated_at'> = {
        job_invoice_number: job.invoice_number,
        technician_id: technicianData.id.toString(),
        current_parts_cost: job.parts_cost || 0,
        requested_parts_cost: partsCost,
        notes: notes.trim(),
        status: 'pending'
      }

      // Insert the request into the database
      const { error } = await supabase
        .from('part_cost_requests')
        .insert([partCostRequest])

      if (error) {
        throw new Error(error.message)
      }

      setSubmissionStatus('success')
      
      // Close modal after 2 seconds
      setTimeout(() => {
        onClose()
        onJobUpdated()
      }, 2000)

    } catch (error) {
      console.error('Error submitting part cost request:', error)
      setSubmissionStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'Failed to submit request')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    if (!isSubmitting) {
      onClose()
    }
  }

  if (!isOpen || !job) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-lg font-semibold">Edit Job Details</CardTitle>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Job Info Display */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Customer:</span>
                <span className="text-sm text-gray-900">{job.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Invoice:</span>
                <span className="text-sm text-gray-900">{job.invoice_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Service Type:</span>
                <span className="text-sm text-gray-900">{job.type_serviced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Brand:</span>
                <span className="text-sm text-gray-900">{job.make_serviced}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Date:</span>
                <span className="text-sm text-gray-900">
                  {new Date(job.date_recorded).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Parts Cost Input */}
            <div className="space-y-2">
              <label htmlFor="partsCost" className="text-sm font-medium text-gray-700">
                Parts Cost ($)
              </label>
              <Input
                id="partsCost"
                type="number"
                step="0.01"
                min="0"
                value={partsCost}
                onChange={(e) => setPartsCost(parseFloat(e.target.value) || 0)}
                placeholder="Enter parts cost"
                className="w-full"
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500">
                Current: ${(job.parts_cost || 0).toFixed(2)} | 
                New Total: ${((job.total_amount - (job.parts_cost || 0)) + partsCost).toFixed(2)}
              </p>
            </div>

            {/* Notes Input */}
            <div className="space-y-2">
              <label htmlFor="notes" className="text-sm font-medium text-gray-700">
                Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explain why the parts cost needs to be changed..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900"
                rows={4}
                disabled={isSubmitting}
                required
              />
              <p className="text-xs text-gray-500">
                Required: Explain the reason for the parts cost change
              </p>
            </div>

            {/* Error Message */}
            {errorMessage && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-md">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Success Message */}
            {submissionStatus === 'success' && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-md">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-700">
                  Request submitted successfully! Admins will review and approve the changes.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !notes.trim()}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Submit Request
                  </div>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 