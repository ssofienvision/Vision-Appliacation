'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'

interface ImportStatus {
  success?: string
  error?: string
}

interface ImportProgress {
  current: number
  total: number
  batch: number
  totalBatches: number
}

export default function ImportPage() {
  const router = useRouter()
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [importStatus, setImportStatus] = useState<ImportStatus>({})
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)
  const [previewData, setPreviewData] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)

  const cleanCSVHeaders = (csvText: string): string => {
    const lines = csvText.split('\n')
    if (lines.length === 0) return csvText

    const correctHeaders = [
      'zip_code_for_job', 'city', 'state', 'date_recorded', 'technician', 
      'customer_name', 'consumer_name_if_not_customer', 'invoice_number',
      'merchandise_sold', 'parts_sold', 'service_call_amount', 'other_labor',
      'sales_tax', 'total_amount', 'paycode', 'dept', 'parts_cost',
      'type_serviced', 'make_serviced', 'tp_money_rcvd', 'is_oem_client',
      'dt_of_prior_py_cd2_entry'
    ]

    lines[0] = correctHeaders.join(',')
    return lines.join('\n')
  }

  const formatDate = (dateStr: string): string | null => {
    try {
      let date: Date
      
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const month = parseInt(parts[0])
          const day = parseInt(parts[1])
          const year = parseInt(parts[2])
          date = new Date(year, month - 1, day)
        } else {
          date = new Date(dateStr)
        }
      } else {
        date = new Date(dateStr)
      }
      
      return date.toISOString().split('T')[0]
    } catch {
      return null
    }
  }

  // Proper CSV parser that handles quoted fields and commas within fields
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0
    
    while (i < line.length) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim())
        current = ''
        i++
      } else {
        current += char
        i++
      }
    }
    
    // Add the last field
    result.push(current.trim())
    return result
  }

  const parseCSVRow = (row: string, headers: string[], rowIndex: number): any => {
    const values = parseCSVLine(row)
    
    if (rowIndex <= 3) {
      console.log(`Row ${rowIndex} raw:`, row.substring(0, 150))
      console.log(`Row ${rowIndex} parsed into ${values.length} values`)
      console.log(`Headers (${headers.length}):`, headers)
      console.log(`Values sample:`, values.slice(0, 10))
    }
    
    const job: any = {}
    
    headers.forEach((header, index) => {
      const value = values[index]?.trim()
      
      if (rowIndex <= 2) {
        console.log(`  ${header} (index ${index}): "${value}"`)
      }
      
      switch (header) {
        case 'zip_code_for_job':
        case 'city':
        case 'state':
        case 'technician':
        case 'customer_name':
        case 'consumer_name_if_not_customer':
        case 'invoice_number':
        case 'dept':
        case 'type_serviced':
        case 'make_serviced':
        case 'tp_money_rcvd':
        case 'dt_of_prior_py_cd2_entry':
          job[header] = value && value !== 'NULL' && value !== '' ? value : null
          break
          
        case 'total_amount':
        case 'parts_sold':
        case 'service_call_amount':
        case 'other_labor':
        case 'sales_tax':
        case 'merchandise_sold':
        case 'parts_cost':
          job[header] = value && value !== 'NULL' ? parseFloat(value) || 0 : 0
          break
          
        case 'paycode':
          if (value && value !== 'NULL' && value !== '') {
            const numValue = parseFloat(value)
            job[header] = Math.round(numValue)
          } else {
            job[header] = null
          }
          break
          
        case 'is_oem_client':
          job[header] = value?.toLowerCase() === 'yes' || value?.toLowerCase() === 'true'
          break
          
        case 'date_recorded':
          job[header] = value && value !== 'NULL' ? formatDate(value) : null
          break
          
        case 'created_at':
        case 'updated_at':
        case 'id':
          break
          
        default:
          job[header] = value && value !== 'NULL' && value !== '' ? value : null
      }
    })
    
    if (rowIndex <= 2) {
      console.log(`Final parsed job ${rowIndex}:`, job)
    }
    
    return job
  }

  const fetchGoogleSheetData = async (spreadsheetId: string): Promise<string> => {
    const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=csv`
    const response = await fetch(csvUrl)
    if (!response.ok) {
      throw new Error(`Failed to fetch Google Sheet: ${response.status}`)
    }
    return await response.text()
  }

  const handlePreview = async () => {
    if (!spreadsheetUrl) {
      setImportStatus({ error: 'Please enter your Google Sheets URL' })
      return
    }

    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      setImportStatus({ error: 'Invalid Google Sheets URL' })
      return
    }

    try {
      setIsImporting(true)
      setImportStatus({ success: 'Fetching preview data...' })

      const spreadsheetId = match[1]
      let csvData = await fetchGoogleSheetData(spreadsheetId)
      csvData = cleanCSVHeaders(csvData)
      
      const lines = csvData.split('\n')
      const headers = parseCSVLine(lines[0])
      
      const previewJobs = lines.slice(1, 6).map((line, index) => {
        if (line.trim()) {
          return parseCSVRow(line, headers, index + 1)
        }
        return null
      }).filter(Boolean)

      setPreviewData(previewJobs)
      setShowPreview(true)
      setImportStatus({ success: `Preview loaded - ${lines.length - 1} total rows found` })
      
    } catch (error) {
      setImportStatus({ error: `Preview failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
    } finally {
      setIsImporting(false)
    }
  }

  const handleImport = async (clearFirst: boolean = false) => {
    if (!spreadsheetUrl) {
      setImportStatus({ error: 'Please enter your Google Sheets URL' })
      return
    }

    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      setImportStatus({ error: 'Invalid Google Sheets URL' })
      return
    }

    try {
      setIsImporting(true)
      setImportProgress({ current: 0, total: 0, batch: 0, totalBatches: 0 })

      console.log('🔍 Testing database connection...')
      const { data: testData, error: testError } = await supabaseAdmin
        .from('jobs')
        .select('*')
        .limit(1)
      
      if (testError) {
        console.error('❌ Database test failed:', testError)
        setImportStatus({ error: `Database error: ${testError.message}` })
        return
      }
      
      console.log('✅ Database connection successful')

      if (clearFirst) {
        setImportStatus({ success: 'Clearing existing data...' })
        const { error: deleteError } = await supabaseAdmin
          .from('jobs')
          .delete()
          .neq('id', 0)
        
        if (deleteError) {
          throw new Error(`Failed to clear data: ${deleteError.message}`)
        }
      }

      setImportStatus({ success: 'Fetching Google Sheets data...' })
      const spreadsheetId = match[1]
      let csvData = await fetchGoogleSheetData(spreadsheetId)
      csvData = cleanCSVHeaders(csvData)
      
      const lines = csvData.split('\n')
      const headers = parseCSVLine(lines[0])
      const dataLines = lines.slice(1).filter(line => line.trim())
      
      console.log('📊 Headers:', headers)
      console.log('📊 Total data lines:', dataLines.length)
      
      setImportProgress({ 
        current: 0, 
        total: dataLines.length, 
        batch: 0, 
        totalBatches: Math.ceil(dataLines.length / 100) 
      })

      const batchSize = 100
      let imported = 0
      let skipped = 0

      for (let i = 0; i < dataLines.length; i += batchSize) {
        const batch = dataLines.slice(i, i + batchSize)
        const jobs = batch.map((line, index) => parseCSVRow(line, headers, i + index + 1))
          .filter(Boolean)
        
        setImportProgress({ 
          current: imported, 
          total: dataLines.length, 
          batch: Math.floor(i / batchSize) + 1, 
          totalBatches: Math.ceil(dataLines.length / batchSize) 
        })

        if (jobs.length > 0) {
          console.log(`📦 Importing batch ${Math.floor(i / batchSize) + 1} with ${jobs.length} jobs`)
          
          const { data, error } = await supabaseAdmin.from('jobs').insert(jobs)
          
          if (error) {
            console.error('❌ Batch error:', error)
            
            for (let jobIndex = 0; jobIndex < jobs.length; jobIndex++) {
              const job = jobs[jobIndex]
              const { error: singleError } = await supabaseAdmin.from('jobs').insert([job])
              
              if (singleError) {
                console.error(`❌ Job ${jobIndex} error:`, singleError.message)
                console.error(`❌ Job ${jobIndex} data:`, job)
                if (skipped < 3) {
                  setImportStatus({ error: `Error: ${singleError.message}` })
                }
                skipped++
              } else {
                imported++
              }
            }
          } else {
            imported += jobs.length
            console.log(`✅ Batch imported successfully`)
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 200))
      }

      const message = skipped > 0 
        ? `✅ Import completed! ${imported} jobs imported, ${skipped} skipped due to errors.`
        : `✅ Successfully imported ${imported} jobs!`
      
      setImportStatus({ success: message })
      setImportProgress(null)

    } catch (error) {
      console.error('❌ Import failed:', error)
      setImportStatus({ error: `Import failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
      setImportProgress(null)
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Import Jobs Data</h1>
            </div>
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800"
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">
              Google Sheets URL
            </label>
            <input
              type="url"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>

          <div className="flex gap-4 mb-6">
            <button
              onClick={handlePreview}
              disabled={isImporting}
              className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              Preview Data
            </button>
            
            <button
              onClick={() => handleImport(false)}
              disabled={isImporting}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Import Jobs
            </button>
            
            <button
              onClick={() => handleImport(true)}
              disabled={isImporting}
              className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              Clear & Re-import
            </button>
          </div>

          {importProgress && (
            <div className="mb-6 bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between text-sm mb-2">
                <span>Batch {importProgress.batch} of {importProgress.totalBatches}</span>
                <span>{importProgress.current} of {importProgress.total} rows</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full"
                  style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {importStatus.success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {importStatus.success}
            </div>
          )}
          
          {importStatus.error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {importStatus.error}
            </div>
          )}

          {showPreview && previewData.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full border">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="border px-4 py-2">Customer</th>
                      <th className="border px-4 py-2">Invoice</th>
                      <th className="border px-4 py-2">Date</th>
                      <th className="border px-4 py-2">Amount</th>
                      <th className="border px-4 py-2">Technician</th>
                      <th className="border px-4 py-2">Paycode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewData.map((job, index) => (
                      <tr key={index}>
                        <td className="border px-4 py-2">{job.customer_name || 'N/A'}</td>
                        <td className="border px-4 py-2">{job.invoice_number || 'NULL'}</td>
                        <td className="border px-4 py-2">{job.date_recorded || 'N/A'}</td>
                        <td className="border px-4 py-2">${job.total_amount || 0}</td>
                        <td className="border px-4 py-2">{job.technician || 'N/A'}</td>
                        <td className="border px-4 py-2">{job.paycode || 'N/A'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}