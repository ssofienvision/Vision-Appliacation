import { supabase } from '../src/lib/supabase'
import { jobsService } from '../src/lib/database'

async function fixImportData() {
  console.log('🔧 Starting data cleanup process...')
  
  try {
    // Step 1: Generate missing invoice numbers
    console.log('\n📋 Step 1: Generating missing invoice numbers...')
    const invoiceResult = await generateMissingInvoiceNumbers()
    console.log(`✅ ${invoiceResult.message}`)
    
    // Step 2: Fix NULL zip codes
    console.log('\n📍 Step 2: Fixing NULL zip codes...')
    const zipResult = await fixNullZipCodes()
    console.log(`✅ ${zipResult.message}`)
    
    // Step 3: Generate missing invoice numbers for new records
    console.log('\n📋 Step 3: Final invoice number generation...')
    const finalInvoiceResult = await generateMissingInvoiceNumbers()
    console.log(`✅ ${finalInvoiceResult.message}`)
    
    // Step 4: Show summary
    console.log('\n📊 Data cleanup summary:')
    console.log(`- Invoice numbers generated: ${invoiceResult.updatedCount + finalInvoiceResult.updatedCount}`)
    console.log(`- Zip codes fixed: ${zipResult.updatedCount}`)
    
    console.log('\n✅ Data cleanup completed successfully!')
    
  } catch (error) {
    console.error('❌ Error during data cleanup:', error)
    process.exit(1)
  }
}

async function generateMissingInvoiceNumbers(): Promise<{ success: boolean; message: string; updatedCount: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: false, message: 'Supabase environment variables not configured', updatedCount: 0 }
  }

  try {
    // Get all jobs without invoice numbers
    const { data: jobsWithoutInvoices, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .is('invoice_number', null)
      .order('date_recorded', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching jobs without invoices:', fetchError)
      return { success: false, message: 'Error fetching jobs', updatedCount: 0 }
    }

    if (!jobsWithoutInvoices || jobsWithoutInvoices.length === 0) {
      return { success: true, message: 'All jobs already have invoice numbers', updatedCount: 0 }
    }

    console.log(`📊 Found ${jobsWithoutInvoices.length} jobs without invoice numbers`)

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
        console.error('❌ Error updating job:', updateError)
        continue
      }

      updatedCount++
      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount} jobs so far...`)
      }
    }

    return { 
      success: true, 
      message: `Successfully generated invoice numbers for ${updatedCount} jobs`, 
      updatedCount 
    }

  } catch (error) {
    console.error('❌ Error generating invoice numbers:', error)
    return { success: false, message: 'Unexpected error occurred', updatedCount: 0 }
  }
}

async function fixNullZipCodes(): Promise<{ success: boolean; message: string; updatedCount: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: false, message: 'Supabase environment variables not configured', updatedCount: 0 }
  }

  try {
    // Get all jobs with NULL zip codes
    const { data: jobsWithNullZip, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .is('zip_code_for_job', null)
      .order('date_recorded', { ascending: false })

    if (fetchError) {
      console.error('❌ Error fetching jobs with NULL zip codes:', fetchError)
      return { success: false, message: 'Error fetching jobs', updatedCount: 0 }
    }

    if (!jobsWithNullZip || jobsWithNullZip.length === 0) {
      return { success: true, message: 'All jobs already have zip codes', updatedCount: 0 }
    }

    console.log(`📍 Found ${jobsWithNullZip.length} jobs with NULL zip codes`)

    // Update jobs one by one to avoid conflicts
    let updatedCount = 0
    for (const job of jobsWithNullZip) {
      let zipCode = '00000' // Default zip code
      
      // Try to assign zip codes based on city/state if available
      if (job.city && job.state) {
        const cityState = `${job.city}, ${job.state}`.toLowerCase()
        
        // Common zip code mappings (you can expand this)
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
        console.error('❌ Error updating zip code for job:', updateError)
        continue
      }

      updatedCount++
      if (updatedCount % 10 === 0) {
        console.log(`✅ Updated ${updatedCount} zip codes so far...`)
      }
    }

    return { 
      success: true, 
      message: `Successfully fixed zip codes for ${updatedCount} jobs`, 
      updatedCount 
    }

  } catch (error) {
    console.error('❌ Error fixing zip codes:', error)
    return { success: false, message: 'Unexpected error occurred', updatedCount: 0 }
  }
}

// Run the script
fixImportData()
  .then(() => {
    console.log('\n🎉 Script completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Script failed:', error)
    process.exit(1)
  }) 