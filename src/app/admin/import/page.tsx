'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import Sidebar from '@/components/Sidebar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Upload, LogOut, CheckCircle, AlertCircle, FileText, Database } from 'lucide-react'

interface User {
  id: string
  email: string
  role: string
  technician_code?: string
  name?: string
}

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

export default function AdminImportPage() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isImporting, setIsImporting] = useState(false)
  const [importStatus, setImportStatus] = useState<ImportStatus>({})
  const [importProgress, setImportProgress] = useState<ImportProgress | undefined>()
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('')
  const [importChoice, setImportChoice] = useState<'jobs' | 'parts' | 'both'>('jobs')
  const router = useRouter()

  useEffect(() => {
    initializeUser()
  }, [])

  const initializeUser = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: technicianData } = await supabase
        .from('technicians')
        .select('*')
        .eq('email', user.email)
        .single()

      if (technicianData) {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          role: technicianData.role || 'technician',
          technician_code: technicianData.technician_code,
          name: technicianData.name
        })
        
        // Redirect non-admin users
        if (technicianData.role !== 'admin') {
          router.push('/tech-dashboard')
          return
        }
      } else {
        setCurrentUser({
          id: user.id,
          email: user.email || '',
          role: 'technician'
        })
        router.push('/tech-dashboard')
        return
      }
    } catch (error) {
      console.error('Error initializing user:', error)
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  const handleUnifiedImport = async () => {
    if (!spreadsheetUrl) {
      setImportStatus({ error: 'Please enter your Google Sheets URL' })
      return
    }

    const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
    if (!match) {
      setImportStatus({ error: 'Invalid Google Sheets URL' })
      return
    }

    const spreadsheetId = match[1]

    try {
      if (importChoice === 'both') {
        await importBothJobsAndParts(spreadsheetId)
      } else if (importChoice === 'jobs') {
        await importJobsFromSheet(spreadsheetId, 'Jobs Data')
      } else {
        await importPartsFromSheet(spreadsheetId, 'Parts Inventory')
      }
    } catch (error) {
      setImportStatus({ error: error instanceof Error ? error.message : 'Import failed' })
    }
  }

  const importBothJobsAndParts = async (spreadsheetId: string) => {
    setIsImporting(true)
    setImportStatus({ success: 'Starting import of both Jobs and Parts...' })

    try {
      // Import Jobs first
      await importJobsFromSheet(spreadsheetId, 'Jobs Data')
      
      // Then import Parts
      await importPartsFromSheet(spreadsheetId, 'Parts Inventory')
      
      setImportStatus({ success: '🎉 Successfully imported both Jobs and Parts data!' })
      
      // Clear form after successful import
      setTimeout(() => {
        setSpreadsheetUrl('')
        setImportChoice('jobs')
        setImportStatus({})
        setImportProgress(undefined)
      }, 3000)

    } catch (error) {
      throw error
    } finally {
      setIsImporting(false)
    }
  }

  const importJobsFromSheet = async (spreadsheetId: string, sheetName: string) => {
    setImportStatus({ success: `Importing from "${sheetName}" sheet...` })

    // Get latest job date for smart updates
    const { data: latestRecord } = await supabase
      .from('jobs')
      .select('date_recorded')
      .order('date_recorded', { ascending: false })
      .limit(1)

    let cutoffDate = new Date('2020-01-01')
    if (latestRecord && latestRecord.length > 0) {
      cutoffDate = new Date(latestRecord[0].date_recorded)
    }

    // Fetch jobs data
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:U?key=${apiKey}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sheetName}: ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!data.values || data.values.length === 0) {
      throw new Error(`No data found in ${sheetName} sheet`)
    }

    const headers = data.values[0].map((h: string) => h.trim().toLowerCase())
    const rows = data.values.slice(1)
    
    console.log('📊 Import Debug - Headers found:', headers)
    console.log('📊 Import Debug - Sample row:', rows[0])
    
    // Process jobs data
    const newJobs = rows
      .map((row: any[]) => processJobRow(headers, row))
      .filter((job: any) => {
        if (!job.date_recorded || !job.customer_name) return false
        const jobDate = new Date(job.date_recorded)
        return jobDate > cutoffDate
      })

    console.log('📊 Import Debug - Sample processed job:', newJobs[0])
    console.log('📊 Import Debug - Column mapping test:')
    if (rows[0]) {
      console.log('  Invoice number raw value:', rows[0][headers.findIndex((h: string) => h.toLowerCase().includes('invoice'))])
      console.log('  Zip code raw value:', rows[0][headers.findIndex((h: string) => h.toLowerCase().includes('zip'))])
      console.log('  Date raw value:', rows[0][headers.findIndex((h: string) => h.toLowerCase().includes('date'))])
      console.log('  Customer raw value:', rows[0][headers.findIndex((h: string) => h.toLowerCase().includes('customer'))])
    }
    console.log('📊 Import Debug - Processed values:')
    console.log('  Invoice number processed:', newJobs[0]?.invoice_number)
    console.log('  Zip code processed:', newJobs[0]?.zip_code_for_job)
    console.log('  Date processed:', newJobs[0]?.date_recorded)
    console.log('  Customer processed:', newJobs[0]?.customer_name)

    if (newJobs.length === 0) {
      setImportStatus({ success: `No new jobs found in ${sheetName}` })
      return
    }

    // Import jobs in batches
    await importInBatches(newJobs, 'jobs')
    setImportStatus({ success: `✅ Imported ${newJobs.length} jobs from ${sheetName}` })
  }

  const importPartsFromSheet = async (spreadsheetId: string, sheetName: string) => {
    setImportStatus({ success: `Importing from "${sheetName}" sheet...` })

    // Get latest parts date for smart updates
    const { data: latestRecord } = await supabase
      .from('parts_requests')
      .select('requested_date')
      .order('requested_date', { ascending: false })
      .limit(1)

    let cutoffDate = new Date('2020-01-01')
    if (latestRecord && latestRecord.length > 0) {
      cutoffDate = new Date(latestRecord[0].requested_date)
    }

    // Fetch parts data - note the extended range for more columns
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A:AF?key=${apiKey}`
    
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Failed to fetch ${sheetName}: ${response.statusText}`)
    }
    
    const data = await response.json()
    if (!data.values || data.values.length === 0) {
      throw new Error(`No data found in ${sheetName} sheet`)
    }

    const headers = data.values[0].map((h: string) => h.trim().toLowerCase())
    const rows = data.values.slice(1)
    
    // Process parts data
    const newParts = rows
      .map((row: any[]) => processPartsRow(headers, row))
      .filter((part: any) => {
        if (!part.requested_date || !part.part_description) return false
        const partDate = new Date(part.requested_date)
        return partDate > cutoffDate
      })

    if (newParts.length === 0) {
      setImportStatus({ success: `No new parts found in ${sheetName}` })
      return
    }

    // Import parts in batches
    await importInBatches(newParts, 'parts_requests')
    setImportStatus({ success: `✅ Imported ${newParts.length} parts from ${sheetName}` })
  }

  const processJobRow = (headers: string[], row: any[]) => {
    const getValue = (headerName: string) => {
      // More flexible column matching - try multiple variations
      const variations = [
        headerName,
        headerName.toLowerCase(),
        headerName.toUpperCase(),
        headerName.replace(/[^a-z0-9]/g, ''),
        headerName.replace(/[^a-z0-9]/g, '').toLowerCase(),
        headerName.replace(/[^a-z0-9]/g, '').toUpperCase()
      ]
      
      for (const variation of variations) {
        const index = headers.findIndex(h => {
          // Try exact match first
          if (h.toLowerCase() === variation.toLowerCase()) {
            return true
          }
          // Try with spaces removed
          const cleanHeader = h.replace(/[^a-z0-9]/g, '').toLowerCase()
          const cleanVariation = variation.replace(/[^a-z0-9]/g, '').toLowerCase()
          if (cleanHeader === cleanVariation) {
            return true
          }
          // Try with underscores/spaces normalized
          const normalizedHeader = h.replace(/[\s_]/g, ' ').toLowerCase().trim()
          const normalizedVariation = variation.replace(/[\s_]/g, ' ').toLowerCase().trim()
          if (normalizedHeader === normalizedVariation) {
            return true
          }
          return false
        })
        if (index >= 0) {
          return (row[index] || '').toString().trim()
        }
      }
      return ''
    }

    const parseCurrency = (value: string) => {
      if (!value || value === 'NULL' || value === 'n/a') return null
      return parseFloat(value.replace(/[$,]/g, '')) || null
    }

    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr === 'NULL' || dateStr === 'n/a') return null
      
      // Handle M/D/YY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0')
          const day = parts[1].padStart(2, '0')
          const year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
          return `${year}-${month}-${day}`
        }
      }
      return dateStr
    }

    // Only include essential columns that are most likely to exist
    const jobData: any = {
      zip_code_for_job: getValue('zipcode') || getValue('zip_code') || getValue('zipcodeforjob') || getValue('zip') || getValue('postal') || getValue('postalcode') || null,
      city: getValue('city') || null,
      state: getValue('state') || null,
      date_recorded: parseDate(getValue('date') || getValue('daterecorded') || getValue('date_recorded') || getValue('jobdate') || getValue('servicedate') || getValue('completedate')),
      technician: getValue('tech') || getValue('technician') || null,
      customer_name: getValue('customer') || getValue('customername') || getValue('customer_name') || null,
      consumer_name_if_not_customer: getValue('consumername') || getValue('cnsmrn') || null,
      invoice_number: getValue('invoice') || getValue('invoicenumber') || getValue('invoice_number') || getValue('invoicenmbr') || getValue('invoicenumber') || getValue('inv') || getValue('invnum') || null,
      merchandise_sold: parseCurrency(getValue('merchandise') || getValue('merchsold') || getValue('mrchndssold')),
      parts_sold: parseCurrency(getValue('partssold') || getValue('parts_sold') || getValue('partssold')),
      service_call_amount: parseCurrency(getValue('servicecall') || getValue('service_call_amount') || getValue('scallamount')),
      other_labor: parseCurrency(getValue('otherlabor') || getValue('other_labor')),
      sales_tax: parseCurrency(getValue('salestax') || getValue('sales_tax')),
      total_amount: parseCurrency(getValue('total') || getValue('totalamount') || getValue('total_amount')),
      paycode: parseInt(getValue('paycode')) || null,
      dept: getValue('dept') || getValue('department') || null,
      type_serviced: getValue('type') || getValue('typeserviced') || getValue('type_serviced') || getValue('typeserviced') || null,
      make_serviced: getValue('make') || getValue('makeserviced') || getValue('make_serviced') || getValue('makeserviced') || null,
      tp_money_rcvd: getValue('tpmoney') || getValue('tp_money_rcvd') || getValue('tpmoneyrcvd') || null,
      is_oem_client: getValue('oem') || getValue('isoem') || getValue('is_oem_client') || getValue('isoemclient') === 'true' || false
    }

    // Only add optional columns if they have values
    const tax_portion1 = parseCurrency(getValue('taxportion1') || getValue('tax_portion1'))
    if (tax_portion1 !== null) jobData.tax_portion1 = tax_portion1

    const tax_portion2 = parseCurrency(getValue('taxportion2') || getValue('tax_portion2'))
    if (tax_portion2 !== null) jobData.tax_portion2 = tax_portion2

    const exempt_materials = parseCurrency(getValue('exemptmaterials') || getValue('exempt_materials'))
    if (exempt_materials !== null) jobData.exempt_materials = exempt_materials

    const exempt_labor = parseCurrency(getValue('exemptlabor') || getValue('exempt_labor'))
    if (exempt_labor !== null) jobData.exempt_labor = exempt_labor

    const exempt_total = parseCurrency(getValue('exempttotal') || getValue('exempt_total'))
    if (exempt_total !== null) jobData.exempt_total = exempt_total

    const other_data = getValue('otherdata') || getValue('other_data')
    if (other_data) jobData.other_data = other_data

    const tax_scheme = getValue('taxscheme') || getValue('tax_scheme')
    if (tax_scheme) jobData.tax_scheme = tax_scheme

    const tax_jurisdiction = getValue('taxjurisdiction') || getValue('tax_jurisdiction')
    if (tax_jurisdiction) jobData.tax_jurisdiction = tax_jurisdiction

    const po_dispatch_id = getValue('podispatch') || getValue('po_dispatch_id')
    if (po_dispatch_id) jobData.po_dispatch_id = po_dispatch_id

    const merch_cost = parseCurrency(getValue('merchcost') || getValue('merch_cost'))
    if (merch_cost !== null) jobData.merch_cost = merch_cost

    const parts_cost = parseCurrency(getValue('partscost') || getValue('parts_cost'))
    if (parts_cost !== null) jobData.parts_cost = parts_cost

    const dt_of_prior_py_cd2_entry = parseDate(getValue('dtprior') || getValue('dt_of_prior_py_cd2_entry'))
    if (dt_of_prior_py_cd2_entry) jobData.dt_of_prior_py_cd2_entry = dt_of_prior_py_cd2_entry

    return jobData
  }

  const processPartsRow = (headers: string[], row: any[]) => {
    const getValue = (headerName: string) => {
      const index = headers.findIndex(h => 
        h.replace(/[^a-z0-9]/g, '') === headerName.replace(/[^a-z0-9]/g, '')
      )
      return index >= 0 ? (row[index] || '').toString().trim() : ''
    }

    const parseCurrency = (value: string) => {
      if (!value || value === 'NULL' || value === 'n/a') return null
      return parseFloat(value.replace(/[$,]/g, '')) || null
    }

    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr === 'NULL' || dateStr === 'n/a') return null
      
      // Handle M/D/YY format
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/')
        if (parts.length === 3) {
          const month = parts[0].padStart(2, '0')
          const day = parts[1].padStart(2, '0')
          const year = parts[2].length === 2 ? '20' + parts[2] : parts[2]
          return `${year}-${month}-${day}`
        }
      }
      return dateStr
    }

    return {
      sd_invoice_number: getValue('sdinvnmbr') || getValue('sdinvoicenumber') || null,
      request_id: parseInt(getValue('requestid')) || null,
      requested_qty: parseInt(getValue('rqstdqty') || getValue('requestedqty')) || 1,
      requested_date: parseDate(getValue('rqstddate') || getValue('requesteddate')),
      requesting_tech: getValue('rqstngtech') || getValue('requestingtech') || null,
      customer_name: getValue('customernm') || getValue('customername') || null,
      machine_type: getValue('machinetype') || null,
      machine_make: getValue('machinemake') || null,
      machine_model: getValue('machinemodel') || null,
      machine_serial: getValue('machineserial') || null,
      part_description: getValue('partdescription') || null,
      request_instructions: getValue('requestinstruct') || getValue('requestinstructions') || null,
      request_notes: getValue('requestnotes') || null,
      part_number: getValue('partnumber') || null,
      vendor: getValue('vendor') || null,
      vendor_inquiry_date: parseDate(getValue('vndrinquirydt') || getValue('vendorinquirydate')),
      contact_person: getValue('cntctprsn') || getValue('contactperson') || null,
      contact_method: getValue('cntctmthd') || getValue('contactmethod') || null,
      quoted_wholesale: parseCurrency(getValue('quotedwhlsl') || getValue('quotedwholesale')),
      quoted_retail: parseCurrency(getValue('quotedrtl') || getValue('quotedretail')),
      availability: getValue('availability') || null,
      order_instructions: getValue('orderinstruct') || getValue('orderinstructions') || null,
      po_number: getValue('ponumbr') || getValue('ponumber') || null,
      date_order_confirmed: parseDate(getValue('dtordrcnfrmd') || getValue('dateorderconfirmed')),
      date_shipment_expected: parseDate(getValue('dtshpmntexpctd') || getValue('dateshipmentexpected')),
      date_received: parseDate(getValue('dtreceived') || getValue('datereceived')),
      invoice_cost: parseCurrency(getValue('invoicecost')),
      purchase_invoice_number: getValue('prchsinvnmbr') || getValue('purchaseinvoicenumber') || null,
      sell_for_price: parseCurrency(getValue('sellforprice')),
      hold_location: getValue('holdloc') || getValue('holdlocation') || null,
      purchase_notes: getValue('purchasenotes') || null
    }
  }

  const importInBatches = async (data: any[], tableName: string) => {
    const batchSize = 100
    let imported = 0

    // Debug: Check if admin client is available
    console.log('=== IMPORT DEBUG INFO ===')
    console.log('Using admin client:', !!supabaseAdmin)
    console.log('Service role key available:', !!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY)
    console.log('Service role key length:', process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY?.length || 0)
    console.log('Admin client type:', typeof supabaseAdmin)
    console.log('Regular client type:', typeof supabase)
    console.log('========================')

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize)
      
      try {
        // Try with admin client first
        let { error } = await supabaseAdmin
          .from(tableName)
          .insert(batch)

        // If admin client fails, try with regular client as fallback
        if (error && error.message.includes('row-level security policy')) {
          console.log('Admin client failed, trying regular client...')
          const { error: regularError } = await supabase
            .from(tableName)
            .insert(batch)
          
          if (regularError) {
            error = regularError
          } else {
            error = null
          }
        }

        // If both fail, try alternative approach - insert one by one
        if (error && error.message.includes('row-level security policy')) {
          console.log('Both clients failed, trying individual inserts...')
          let successCount = 0
          
          for (const record of batch) {
            try {
              // Try to insert with current user context
              const { error: singleError } = await supabase
                .from(tableName)
                .insert([record])
              
              if (!singleError) {
                successCount++
              } else {
                console.error('Failed to insert record:', record, singleError)
              }
            } catch (err) {
              console.error('Error inserting single record:', err)
            }
          }
          
          if (successCount === 0) {
            throw new Error(`All records were blocked by RLS policies. Please check your database permissions or add the service role key.`)
          }
          
          imported += successCount
          console.log(`Successfully inserted ${successCount} out of ${batch.length} records`)
        } else if (error) {
          console.error('Batch import error:', error)
          
          // Handle RLS policy violations
          if (error.message.includes('row-level security policy')) {
            throw new Error(`Import blocked by security policies. Please add NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY to your .env.local file. Current status: ${!!process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ? 'Key found' : 'Key missing'}`)
          } else if (error.message.includes('column') && error.message.includes('does not exist')) {
            throw new Error(`Database column mismatch. Please check your database schema. Error: ${error.message}`)
          } else if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
            throw new Error(`Duplicate data found. Some records already exist in the database.`)
          } else if (error.message.includes('ON CONFLICT')) {
            throw new Error(`Database constraint issue. Please check your database schema.`)
          } else {
            throw new Error(`Import failed: ${error.message}`)
          }
        } else {
          imported += batch.length
        }

        setImportProgress({
          current: imported,
          total: data.length,
          batch: Math.floor(i/batchSize) + 1,
          totalBatches: Math.ceil(data.length / batchSize)
        })

        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (error) {
        console.error('Import error:', error)
        throw error
      }
    }
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
          <p className="text-gray-600">Loading import page...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Data Import</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Welcome, {currentUser?.name} (Administrator)
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-6">
            {/* Import Instructions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Import Instructions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Google Sheets Setup</h3>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• Create a Google Sheet with separate tabs for "Jobs Data" and "Parts Inventory"</li>
                      <li>• Make sure the sheet is publicly accessible (anyone with link can view)</li>
                      <li>• Copy the sheet URL and paste it below</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Required Columns</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h4 className="font-medium text-blue-600">Jobs Data Sheet:</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li>• customer_name, date_recorded, technician</li>
                          <li>• total_amount, invoice_number</li>
                          <li>• type_serviced, make_serviced</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600">Parts Inventory Sheet:</h4>
                        <ul className="text-gray-600 space-y-1">
                          <li>• part_description, requested_date</li>
                          <li>• customer_name, requesting_tech</li>
                          <li>• machine_type, machine_make</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Import Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Google Sheets URL */}
                  <div>
                    <label htmlFor="spreadsheetUrl" className="block text-sm font-medium text-gray-700 mb-2">
                      Google Sheets URL
                    </label>
                    <input
                      type="url"
                      id="spreadsheetUrl"
                      value={spreadsheetUrl}
                      onChange={(e) => setSpreadsheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      disabled={isImporting}
                    />
                  </div>

                  {/* Import Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Import Type
                    </label>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => setImportChoice('jobs')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          importChoice === 'jobs'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        disabled={isImporting}
                      >
                        Jobs Data
                      </button>
                      <button
                        onClick={() => setImportChoice('parts')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          importChoice === 'parts'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        disabled={isImporting}
                      >
                        Parts Inventory
                      </button>
                      <button
                        onClick={() => setImportChoice('both')}
                        className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                          importChoice === 'both'
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                        disabled={isImporting}
                      >
                        Both
                      </button>
                    </div>
                  </div>

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

                  {/* Import Button */}
                  <Button
                    onClick={handleUnifiedImport}
                    disabled={!spreadsheetUrl || isImporting}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <Upload className="h-4 w-4" />
                    {isImporting ? 'Importing...' : 'Start Import'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  )
}