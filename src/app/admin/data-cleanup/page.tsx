'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { jobsService } from '@/lib/database'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import Sidebar from '@/components/Sidebar'
import { Wrench, AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

interface CleanupResult {
  success: boolean
  message: string
  updatedCount: number
}

export default function DataCleanupPage() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<CleanupResult[]>([])
  const [currentUser, setCurrentUser] = useState<any>(null)
  const router = useRouter()

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Check if user is admin
    const { data: technicianData } = await supabase
      .from('technicians')
      .select('*')
      .eq('email', user.email)
      .single()

    if (technicianData?.role !== 'admin') {
      router.push('/dashboard')
      return
    }

    setCurrentUser(technicianData)
  }

  useEffect(() => {
    checkUser()
  }, [])

  const fixNullZipCodes = async (): Promise<CleanupResult> => {
    try {
      // Get all jobs with NULL zip codes
      const { data: jobsWithNullZip, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .is('zip_code_for_job', null)
        .order('date_recorded', { ascending: false })

      if (fetchError) {
        return { success: false, message: 'Error fetching jobs', updatedCount: 0 }
      }

      if (!jobsWithNullZip || jobsWithNullZip.length === 0) {
        return { success: true, message: 'All jobs already have zip codes', updatedCount: 0 }
      }

      // Update jobs one by one to avoid conflicts
      let updatedCount = 0
      for (const job of jobsWithNullZip) {
        let zipCode = '00000' // Default zip code
        
        // Try to assign zip codes based on city/state if available
        if (job.city && job.state) {
          const cityState = `${job.city}, ${job.state}`.toLowerCase()
          
          // Common zip code mappings
          const zipCodeMap: Record<string, string> = {
            'new york, ny': '10001',
            'los angeles, ca': '90001',
            'chicago, il': '60601',
            'houston, tx': '77001',
            'phoenix, az': '85001',
            'philadelphia, pa': '19101',
            'san antonio, tx': '78201',
            'san diego, ca': '92101',
            'dallas, tx': '75201',
            'san jose, ca': '95101',
            'austin, tx': '73301',
            'jacksonville, fl': '32099',
            'fort worth, tx': '76101',
            'columbus, oh': '43201',
            'charlotte, nc': '28201',
            'san francisco, ca': '94101',
            'indianapolis, in': '46201',
            'seattle, wa': '98101',
            'denver, co': '80201',
            'washington, dc': '20001'
          }
          
          zipCode = zipCodeMap[cityState] || '00000'
        }
        
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ zip_code_for_job: zipCode })
          .eq('date_recorded', job.date_recorded)
          .eq('customer_name', job.customer_name)
          .eq('technician', job.technician)
          .is('zip_code_for_job', null)

        if (updateError) {
          console.error('Error updating zip code for job:', updateError)
          continue
        }

        updatedCount++
      }

      return { 
        success: true, 
        message: `Successfully fixed zip codes for ${updatedCount} jobs`, 
        updatedCount 
      }

    } catch (error) {
      return { success: false, message: 'Unexpected error occurred', updatedCount: 0 }
    }
  }

  const runDataCleanup = async () => {
    setLoading(true)
    setResults([])

    try {
      const newResults: CleanupResult[] = []

      // Step 1: Generate missing invoice numbers
      const invoiceResult = await generateMissingInvoiceNumbers()
      newResults.push(invoiceResult)

      // Step 2: Fix NULL zip codes
      const zipResult = await fixNullZipCodes()
      newResults.push(zipResult)

      // Step 3: Final invoice number generation
      const finalInvoiceResult = await generateMissingInvoiceNumbers()
      newResults.push(finalInvoiceResult)

      setResults(newResults)
    } catch (error) {
      console.error('Error during data cleanup:', error)
      setResults([{ success: false, message: 'Error during data cleanup', updatedCount: 0 }])
    } finally {
      setLoading(false)
    }
  }

  const generateMissingInvoiceNumbers = async (): Promise<CleanupResult> => {
    try {
      // Get all jobs without invoice numbers
      const { data: jobsWithoutInvoices, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .is('invoice_number', null)
        .order('date_recorded', { ascending: false })

      if (fetchError) {
        return { success: false, message: 'Error fetching jobs', updatedCount: 0 }
      }

      if (!jobsWithoutInvoices || jobsWithoutInvoices.length === 0) {
        return { success: true, message: 'All jobs already have invoice numbers', updatedCount: 0 }
      }

      // Get the highest existing invoice number to start from
      const { data: existingInvoices, error: maxError } = await supabase
        .from('jobs')
        .select('invoice_number')
        .not('invoice_number', 'is', null)
        .order('invoice_number', { ascending: false })
        .limit(1)

      let nextInvoiceNumber = 10000 // Start from 10000 if no existing invoices
      
      if (existingInvoices && existingInvoices.length > 0) {
        const highestInvoice = existingInvoices[0].invoice_number
        // Extract numeric part and increment
        const numericPart = parseInt(highestInvoice.replace(/\D/g, '')) || 9999
        nextInvoiceNumber = numericPart + 1
      }

      // Update jobs one by one to avoid conflicts
      let updatedCount = 0
      for (let i = 0; i < jobsWithoutInvoices.length; i++) {
        const job = jobsWithoutInvoices[i]
        const invoiceNumber = String(nextInvoiceNumber + i).padStart(5, '0')
        
        const { error: updateError } = await supabase
          .from('jobs')
          .update({ invoice_number: invoiceNumber })
          .eq('date_recorded', job.date_recorded)
          .eq('customer_name', job.customer_name)
          .eq('technician', job.technician)
          .is('invoice_number', null)

        if (updateError) {
          console.error('Error updating job:', updateError)
          continue
        }

        updatedCount++
      }

      return { 
        success: true, 
        message: `Successfully generated invoice numbers for ${updatedCount} jobs`, 
        updatedCount 
      }

    } catch (error) {
      return { success: false, message: 'Unexpected error occurred', updatedCount: 0 }
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Data Cleanup</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Fix NULL values and generate missing data
                  {currentUser?.name && ` - Welcome, ${currentUser.name}`}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <Wrench className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                Data Cleanup Operations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3" />
                  <div>
                    <h3 className="text-sm font-medium text-yellow-800">Important</h3>
                    <p className="text-sm text-yellow-700 mt-1">
                      This will fix NULL invoice numbers and zip codes in your imported data. 
                      Make sure you have a backup before proceeding.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={runDataCleanup}
                disabled={loading}
                className="w-full sm:w-auto"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Running Cleanup...
                  </>
                ) : (
                  <>
                    <Wrench className="h-4 w-4 mr-2" />
                    Run Data Cleanup
                  </>
                )}
              </Button>

              {/* Results */}
              {results.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold text-gray-900">Results:</h3>
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className={`flex items-start p-3 rounded-lg border ${
                        result.success
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      {result.success ? (
                        <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
                      )}
                      <div>
                        <p className={`text-sm font-medium ${
                          result.success ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.message}
                        </p>
                        {result.updatedCount > 0 && (
                          <p className={`text-sm ${
                            result.success ? 'text-green-700' : 'text-red-700'
                          }`}>
                            Updated {result.updatedCount} records
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
} 