'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { jobsService, technicianService, type Technician, type DashboardMetrics, type SalesData, type JobTypeData } from '@/lib/database'
import KPIDashboard from '@/components/KPIDashboard'
import DateFilter from '@/components/DateFilter'
import TechnicianFilter from '@/components/TechnicianFilter'
import SalesOverTimeChart from '@/components/charts/SalesOverTimeChart'
import ServiceCallPieChart from '@/components/charts/ServiceCallPieChart'
import JobTypeSalesChart from '@/components/charts/JobTypeSalesChart'
import Sidebar from '@/components/Sidebar'
import { LogOut, Upload, X, FileText, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportModalProps {
  isOpen: boolean
  onClose: () => void
  onImport: (file: File, importType: 'jobs' | 'parts') => Promise<void>
  isImporting: boolean
  importStatus: { success?: string; error?: string }
  importProgress?: { current: number; total: number; batch: number; totalBatches: number }
}

function ImportModal({ isOpen, onClose, onImport, isImporting, importStatus, importProgress }: ImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [importType, setImportType] = useState<'jobs' | 'parts'>('jobs')

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }

  const handleImport = async () => {
    if (selectedFile) {
      await onImport(selectedFile, importType)
      setSelectedFile(null)
    }
  }

  const getInstructions = () => {
    if (importType === 'jobs') {
      return {
        title: 'Jobs CSV Format Requirements:',
        items: [
          'customer_name, total_amount, date_recorded, technician, type_serviced, make_serviced, invoice_number, parts_cost, is_oem_client',
          'date_recorded format: YYYY-MM-DD',
          'is_oem_client: true/false'
        ]
      }
    } else {
      return {
        title: 'Parts CSV Format Requirements:',
        items: [
          'Tab-separated values (TSV) format',
          'Columns: sd_invoice_number, request_id, requested_qty, requested_date, requesting_tech, customer_name, machine_type, machine_make, machine_model, machine_serial, part_description, request_instructions, request_notes, part_number, vendor, vendor_inquiry_date, contact_person, contact_method, quoted_wholesale, quoted_retail, availability, order_instructions, po_number, date_order_confirmed, date_shipment_expected, date_received, invoice_cost, purchase_invoice_number, sell_for_price, hold_location, purchase_notes',
          'date format: M/D/YY or YYYY-MM-DD',
          'currency format: $1,234.56 or 1234.56'
        ]
      }
    }
  }

  const instructions = getInstructions()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Import Data</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={isImporting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Import Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setImportType('jobs')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                importType === 'jobs'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isImporting}
            >
              Jobs Data
            </button>
            <button
              onClick={() => setImportType('parts')}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                importType === 'parts'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              disabled={isImporting}
            >
              Parts Inventory
            </button>
          </div>

          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop a {importType === 'jobs' ? 'CSV' : 'TSV'} file here, or click to select
            </p>
            <input
              type="file"
              accept={importType === 'jobs' ? '.csv' : '.tsv,.txt'}
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isImporting}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              Choose file
            </label>
          </div>

          {/* Selected File */}
          {selectedFile && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{selectedFile.name}</span>
              <span className="text-xs text-gray-500">
                ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {/* Import Progress */}
          {isImporting && importProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Importing batch {importProgress.batch} of {importProgress.totalBatches}</span>
                <span>{importProgress.current} of {importProgress.total} rows</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {Math.round((importProgress.current / importProgress.total) * 100)}% complete
              </div>
            </div>
          )}

          {/* Import Status */}
          {importStatus.success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm text-green-700">{importStatus.success}</span>
            </div>
          )}

          {importStatus.error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm text-red-700">{importStatus.error}</span>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
            <p className="font-medium mb-1">{instructions.title}</p>
            <ul className="space-y-1">
              {instructions.items.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
              <li>• Maximum file size: 50MB (~100,000 rows)</li>
              <li>• Large imports are processed in batches of 1,000 rows</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isImporting}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isImporting ? 'Importing...' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<Technician | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth')
  const [selectedTechnician, setSelectedTechnician] = useState<string>('')
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalJobs: 0,
    totalSales: 0,
    totalTechnicians: 0,
    avgSalePerJob: 0,
    serviceCallPercentage: 0,
    totalLabor: 0,
    totalParts: 0,
    jobsThisMonth: 0,
    salesThisMonth: 0
  })
  const [salesOverTime, setSalesOverTime] = useState<SalesData[]>([])
  const [jobTypeSummary, setJobTypeSummary] = useState<JobTypeData[]>([])

  // Import modal state
  const [importModalOpen, setImportModalOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<{ success?: string; error?: string }>({})
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; batch: number; totalBatches: number } | undefined>(undefined)

  useEffect(() => {
    initializeUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      loadDashboardData()
    }
  }, [currentUser, selectedPeriod, selectedTechnician])

  const initializeUser = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const technician = await technicianService.getCurrentTechnician()
      setCurrentUser(technician)
      
      // Redirect technicians to tech-dashboard
      if (technician?.role !== 'admin') {
        router.push('/tech-dashboard')
        return
      }
      
      const allTechnicians = await technicianService.getTechnicians()
      setTechnicians(allTechnicians)
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      
      const dateFilters = getDateFilters()
      const filters: any = { ...dateFilters }
      
      if (selectedTechnician) {
        filters.technician = selectedTechnician
      } else if (currentUser?.role !== 'admin') {
        filters.technician = currentUser?.technician_code
      }
      filters.userRole = currentUser?.role

      // Load all dashboard data
      const [metricsData, salesData, jobTypeData] = await Promise.all([
        jobsService.getDashboardMetrics(filters),
        jobsService.getSalesOverTime(filters),
        jobsService.getJobTypeSummary(filters)
      ])

      setMetrics(metricsData)
      setSalesOverTime(salesData)
      setJobTypeSummary(jobTypeData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateFilters = () => {
    const now = new Date()
    let startDate, endDate

    switch (selectedPeriod) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1)
        endDate = new Date(now.getFullYear() - 1, 11, 31)
        break
      default:
        return {}
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  const handleImport = async (file: File, importType: 'jobs' | 'parts') => {
    setIsImporting(true)
    setImportStatus({})
    setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 })

    try {
      // File size validation (50MB limit)
      const maxSize = 50 * 1024 * 1024 // 50MB
      if (file.size > maxSize) {
        throw new Error('File size exceeds 50MB limit. Please split your data into smaller files.')
      }

      const text = await file.text()
      
      if (importType === 'jobs') {
        await importJobsData(text)
      } else {
        await importPartsData(text)
      }

    } catch (error) {
      console.error('Import error:', error)
      setImportStatus({ error: error instanceof Error ? error.message : 'Import failed' })
      setImportProgress(undefined)
    } finally {
      setIsImporting(false)
    }
  }

  const importJobsData = async (text: string) => {
    const lines = text.split('\n')
    const headers = lines[0].split(',').map(h => h.trim())
    
    // Validate headers for jobs
    const requiredHeaders = [
      'customer_name', 'total_amount', 'date_recorded', 'technician', 
      'type_serviced', 'make_serviced', 'invoice_number', 'parts_cost', 'is_oem_client'
    ]
    
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h))
    if (missingHeaders.length > 0) {
      throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`)
    }

    // Parse all jobs
    const jobs = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim())
        const job = {
          customer_name: values[headers.indexOf('customer_name')],
          total_amount: parseFloat(values[headers.indexOf('total_amount')]) || 0,
          date_recorded: values[headers.indexOf('date_recorded')],
          technician: values[headers.indexOf('technician')],
          type_serviced: values[headers.indexOf('type_serviced')],
          make_serviced: values[headers.indexOf('make_serviced')],
          invoice_number: values[headers.indexOf('invoice_number')],
          parts_cost: parseFloat(values[headers.indexOf('parts_cost')]) || 0,
          is_oem_client: values[headers.indexOf('is_oem_client')].toLowerCase() === 'true'
        }
        jobs.push(job)
      }
    }

    await processBatchImport(jobs, 'jobs')
  }

  const importPartsData = async (text: string) => {
    const lines = text.split('\n')
    const headers = lines[0].split('\t').map(h => h.trim())
    
    // Parse all parts
    const parts = []
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split('\t').map(v => v.trim())
        
        // Parse date helper function
        const parseDate = (dateStr: string) => {
          if (!dateStr || dateStr.trim() === '') return null
          try {
            // Handle M/D/YY format
            const parts = dateStr.split('/')
            if (parts.length === 3) {
              const month = parts[0].padStart(2, '0')
              const day = parts[1].padStart(2, '0')
              let year = parts[2]
              
              // Convert 2-digit year to 4-digit
              if (year.length === 2) {
                year = '20' + year
              }
              
              return `${year}-${month}-${day}`
            }
            return dateStr
          } catch (error) {
            console.warn(`Could not parse date: ${dateStr}`)
            return null
          }
        }
        
        // Parse currency helper function
        const parseCurrency = (value: string) => {
          if (!value || value.trim() === '') return null
          // Remove $, commas, and convert to float
          const cleaned = value.toString().replace(/[\$,]/g, '')
          const parsed = parseFloat(cleaned)
          return isNaN(parsed) ? null : parsed
        }
        
        const part = {
          sd_invoice_number: values[0]?.trim(),
          request_id: parseInt(values[1]) || null,
          requested_qty: parseInt(values[2]) || 1,
          requested_date: parseDate(values[3]),
          requesting_tech: values[4]?.trim(),
          customer_name: values[5]?.trim(),
          machine_type: values[6]?.trim(),
          machine_make: values[7]?.trim(),
          machine_model: values[8]?.trim(),
          machine_serial: values[9]?.trim(),
          part_description: values[10]?.trim(),
          request_instructions: values[11]?.trim(),
          request_notes: values[12]?.trim(),
          part_number: values[13]?.trim(),
          vendor: values[14]?.trim(),
          vendor_inquiry_date: parseDate(values[15]),
          contact_person: values[16]?.trim(),
          contact_method: values[17]?.trim(),
          quoted_wholesale: parseCurrency(values[18]),
          quoted_retail: parseCurrency(values[19]),
          availability: values[20]?.trim(),
          order_instructions: values[21]?.trim(),
          po_number: values[22]?.trim(),
          date_order_confirmed: parseDate(values[23]),
          date_shipment_expected: parseDate(values[24]),
          date_received: parseDate(values[25]),
          invoice_cost: parseCurrency(values[26]),
          purchase_invoice_number: values[27]?.trim(),
          sell_for_price: parseCurrency(values[28]),
          hold_location: values[29]?.trim(),
          purchase_notes: values[30]?.trim()
        }
        parts.push(part)
      }
    }

    await processBatchImport(parts, 'parts')
  }

  const processBatchImport = async (data: any[], type: 'jobs' | 'parts') => {
    const totalItems = data.length
    const batchSize = 1000 // Process 1000 rows per batch
    const totalBatches = Math.ceil(totalItems / batchSize)
    let importedCount = 0

    // Update progress for initial state
    setImportProgress({ current: 0, total: totalItems, batch: 0, totalBatches })

    // Process items in batches
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
      const startIndex = batchIndex * batchSize
      const endIndex = Math.min(startIndex + batchSize, totalItems)
      const batchData = data.slice(startIndex, endIndex)

      // Update progress
      setImportProgress({ 
        current: importedCount, 
        total: totalItems, 
        batch: batchIndex + 1, 
        totalBatches 
      })

      // Insert batch into Supabase
      const tableName = type === 'jobs' ? 'jobs' : 'parts_requests'
      const { error } = await supabase
        .from(tableName)
        .insert(batchData)

      if (error) {
        throw new Error(`Database error in batch ${batchIndex + 1}: ${error.message}`)
      }

      importedCount += batchData.length

      // Small delay to prevent overwhelming the database
      if (batchIndex < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Final progress update
    setImportProgress({ 
      current: totalItems, 
      total: totalItems, 
      batch: totalBatches, 
      totalBatches 
    })

    setImportStatus({ success: `Successfully imported ${totalItems} ${type} in ${totalBatches} batches!` })
    
    // Reload dashboard data
    setTimeout(() => {
      loadDashboardData()
      setImportModalOpen(false)
      setImportProgress(undefined)
    }, 2000)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={currentUser?.role} />
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Welcome, {currentUser?.name} (Administrator)
                </p>
              </div>
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => setImportModalOpen(true)}
                  className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-xs sm:text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Import Data</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
                >
                  <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Filters */}
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6">
            <DateFilter
              onFilterChange={(filters) => {
                // Handle custom date filters if needed
                loadDashboardData()
              }}
              selectedPeriod={selectedPeriod}
              setSelectedPeriod={setSelectedPeriod}
            />
            
            <TechnicianFilter
              technicians={technicians}
              selectedTechnician={selectedTechnician}
              onTechnicianChange={setSelectedTechnician}
              isAdmin={currentUser?.role === 'admin'}
            />
          </div>

          {/* Dashboard Overview */}
          <div className="space-y-4 sm:space-y-6">
            <KPIDashboard metrics={metrics} />
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <SalesOverTimeChart data={salesOverTime} />
              <ServiceCallPieChart serviceCallPercentage={metrics.serviceCallPercentage || 0} />
            </div>
            
            <JobTypeSalesChart data={jobTypeSummary} />
          </div>
        </main>

        {/* Import Modal */}
        <ImportModal
          isOpen={importModalOpen}
          onClose={() => setImportModalOpen(false)}
          onImport={handleImport}
          isImporting={isImporting}
          importStatus={importStatus}
          importProgress={importProgress}
        />
      </div>
    </div>
  )
} 