// Add this function to your import page

const clearExistingJobs = async () => {
  if (!confirm('⚠️ This will DELETE ALL existing jobs data. Are you sure you want to continue?')) {
    return false
  }
  
  if (!confirm('🚨 FINAL WARNING: This action cannot be undone. Delete all jobs data?')) {
    return false
  }
  
  try {
    setImportStatus({ success: 'Clearing existing jobs data...' })
    
    const { error } = await supabase
      .from('jobs')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all records
    
    if (error) {
      throw new Error(`Failed to clear jobs: ${error.message}`)
    }
    
    setImportStatus({ success: '✅ All existing jobs cleared. Ready for fresh import.' })
    return true
  } catch (error) {
    setImportStatus({ error: `Failed to clear jobs: ${error instanceof Error ? error.message : 'Unknown error'}` })
    return false
  }
}

// Modified import function to force re-import
const importJobsFromSheet = async (spreadsheetId: string, sheetName: string, forceReimport: boolean = false) => {
  setImportStatus({ success: `Importing from "${sheetName}" sheet...` })

  // Test database connection first
  try {
    const { data: testData, error: testError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1)
    
    if (testError) {
      throw new Error(`Database connection failed: ${testError.message}`)
    }
  } catch (error) {
    throw new Error(`Database connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }

  // Skip date filtering if forcing re-import
  let cutoffDate = new Date('2020-01-01')
  if (!forceReimport) {
    const { data: latestRecord } = await supabase
      .from('jobs')
      .select('date_recorded')
      .order('date_recorded', { ascending: false })
      .limit(1)

    if (latestRecord && latestRecord.length > 0) {
      cutoffDate = new Date(latestRecord[0].date_recorded)
    }
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_SHEETS_API_KEY
  if (!apiKey) {
    throw new Error('Google Sheets API key is not configured')
  }

  // FIXED: Properly encode the sheet name and range
  const encodedRange = encodeURIComponent(`${sheetName}!A:U`)
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?key=${apiKey}`
  
  console.log('🔍 Fetching from Google Sheets:', url)
  console.log('🔍 Force re-import mode:', forceReimport)
  
  try {
    const response = await fetch(url)
    
    console.log('📊 Response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Google Sheets API error:', response.status, errorText)
      
      if (response.status === 400) {
        throw new Error(`Bad Request: The sheet "${sheetName}" may not exist or the spreadsheet ID is invalid.`)
      } else if (response.status === 403) {
        throw new Error(`Access Denied: Please ensure your Google Sheet is set to "Anyone with the link can view".`)
      } else if (response.status === 404) {
        throw new Error(`Not Found: The spreadsheet or sheet "${sheetName}" was not found.`)
      } else {
        throw new Error(`Google Sheets API Error ${response.status}: ${errorText}`)
      }
    }
    
    const data = await response.json()
    
    if (!data.values || data.values.length === 0) {
      throw new Error(`No data found in "${sheetName}" sheet.`)
    }

    const headers = data.values[0].map((h: string) => h.trim().toLowerCase())
    debugColumnHeaders(headers) // Show what columns we found
    const rows = data.values.slice(1)
    
    console.log('📊 Total rows to process:', rows.length)
    
    // Process all rows or filter by date
    const processedJobs = rows.map((row: any[]) => processJobRow(headers, row))
    
    const validJobs = processedJobs.filter((job: any) => {
      if (!job.customer_name) {
        console.log('❌ Skipping job without customer name:', job)
        return false
      }
      
      if (forceReimport) {
        return true // Import everything when forcing re-import
      }
      
      if (!job.date_recorded) {
        console.log('❌ Skipping job without date:', job)
        return false
      }
      
      const jobDate = new Date(job.date_recorded)
      return jobDate > cutoffDate
    })

    // Show sample of what we're importing
    console.log('📊 Sample processed job with invoice/zip:', {
      invoice_number: validJobs[0]?.invoice_number,
      zip_code_for_job: validJobs[0]?.zip_code_for_job,
      customer_name: validJobs[0]?.customer_name,
      date_recorded: validJobs[0]?.date_recorded
    })
    
    console.log('📊 Valid jobs to import:', validJobs.length)

    if (validJobs.length === 0) {
      if (forceReimport) {
        setImportStatus({ error: `No valid jobs found in ${sheetName}. Check your data format.` })
      } else {
        setImportStatus({ success: `No new jobs found in ${sheetName}. Use "Clear & Re-import" to import all data again.` })
      }
      return
    }

    await importInBatches(validJobs, 'jobs')
    setImportStatus({ success: `✅ Imported ${validJobs.length} jobs from ${sheetName}` })
    
  } catch (error) {
    console.error('Import error:', error)
    throw error
  }
}

// Add clear and re-import functionality
const handleClearAndReimport = async () => {
  if (!spreadsheetUrl) {
    setImportStatus({ error: 'Please enter your Google Sheets URL' })
    return
  }

  const cleared = await clearExistingJobs()
  if (!cleared) return

  const match = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
  if (!match) {
    setImportStatus({ error: 'Invalid Google Sheets URL' })
    return
  }

  const spreadsheetId = match[1]

  try {
    setIsImporting(true)
    await importJobsFromSheet(spreadsheetId, 'Jobs Data', true) // Force re-import
  } catch (error) {
    console.error('Re-import error:', error)
    setImportStatus({ error: error instanceof Error ? error.message : 'Re-import failed' })
  } finally {
    setIsImporting(false)
  }
}