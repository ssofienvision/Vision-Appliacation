import { supabase } from '../src/lib/supabase'

async function debugImport() {
  console.log('🔍 Debugging Import Issues...')
  
  try {
    // Check if we have any jobs at all
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(10)

    if (jobsError) {
      console.error('❌ Error fetching jobs:', jobsError)
      return
    }

    console.log(`📊 Total jobs in database: ${jobs?.length || 0}`)
    
    if (jobs && jobs.length > 0) {
      console.log('\n📋 Sample job data:')
      jobs.forEach((job: any, index: number) => {
        console.log(`Job ${index + 1}:`)
        console.log(`  - Invoice Number: "${job.invoice_number}" (type: ${typeof job.invoice_number})`)
        console.log(`  - Zip Code: "${job.zip_code_for_job}" (type: ${typeof job.zip_code_for_job})`)
        console.log(`  - Customer: "${job.customer_name}"`)
        console.log(`  - Date: "${job.date_recorded}"`)
        console.log(`  - Technician: "${job.technician}"`)
        console.log(`  - Total Amount: ${job.total_amount}`)
        console.log('  ---')
      })
    } else {
      console.log('❌ No jobs found in database!')
      
      // Check if the jobs table exists and has the right structure
      console.log('\n🔍 Checking jobs table structure...')
      
      // Try to insert a test record to see if the table works
      const testJob = {
        customer_name: 'Test Customer',
        date_recorded: '2024-01-01',
        technician: 'TEST',
        total_amount: 100.00,
        invoice_number: 'TEST-001',
        zip_code_for_job: '12345'
      }
      
      const { data: insertData, error: insertError } = await supabase
        .from('jobs')
        .insert([testJob])
        .select()
      
      if (insertError) {
        console.error('❌ Error inserting test job:', insertError)
        console.log('This suggests the table structure or permissions are wrong')
      } else {
        console.log('✅ Test job inserted successfully:', insertData)
        
        // Clean up the test record
        await supabase
          .from('jobs')
          .delete()
          .eq('invoice_number', 'TEST-001')
      }
    }

    // Check for jobs with NULL invoice numbers specifically
    const { data: nullInvoices, error: nullError } = await supabase
      .from('jobs')
      .select('*')
      .is('invoice_number', null)
      .limit(5)

    if (nullError) {
      console.error('❌ Error checking NULL invoices:', nullError)
    } else {
      console.log(`\n📋 Jobs with NULL invoice numbers: ${nullInvoices?.length || 0}`)
      if (nullInvoices && nullInvoices.length > 0) {
        nullInvoices.forEach((job: any, index: number) => {
          console.log(`NULL Invoice Job ${index + 1}:`)
          console.log(`  - Customer: "${job.customer_name}"`)
          console.log(`  - Date: "${job.date_recorded}"`)
          console.log(`  - Technician: "${job.technician}"`)
          console.log(`  - Zip Code: "${job.zip_code_for_job}"`)
        })
      }
    }

    // Check for jobs with NULL zip codes
    const { data: nullZips, error: zipError } = await supabase
      .from('jobs')
      .select('*')
      .is('zip_code_for_job', null)
      .limit(5)

    if (zipError) {
      console.error('❌ Error checking NULL zip codes:', zipError)
    } else {
      console.log(`\n📋 Jobs with NULL zip codes: ${nullZips?.length || 0}`)
      if (nullZips && nullZips.length > 0) {
        nullZips.forEach((job: any, index: number) => {
          console.log(`NULL Zip Job ${index + 1}:`)
          console.log(`  - Customer: "${job.customer_name}"`)
          console.log(`  - Invoice: "${job.invoice_number}"`)
          console.log(`  - Date: "${job.date_recorded}"`)
          console.log(`  - Technician: "${job.technician}"`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugImport() 