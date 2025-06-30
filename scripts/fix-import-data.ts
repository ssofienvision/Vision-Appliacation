import { supabase } from '../src/lib/supabase'
import { jobsService } from '../src/lib/database'

async function fixImportData() {
  console.log('🔧 Starting data cleanup process...')
  
  try {
    // Step 1: Generate missing invoice numbers
    console.log('\n📋 Step 1: Generating missing invoice numbers...')
    const invoiceResult = await jobsService.generateMissingInvoiceNumbers()
    console.log(`✅ ${invoiceResult.message}`)
    
    // Step 2: Fix NULL zip codes
    console.log('\n📍 Step 2: Fixing NULL zip codes...')
    const zipResult = await fixNullZipCodes()
    console.log(`✅ ${zipResult.message}`)
    
    // Step 3: Generate missing invoice numbers for new records
    console.log('\n📋 Step 3: Final invoice number generation...')
    const finalInvoiceResult = await jobsService.generateMissingInvoiceNumbers()
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

async function fixNullZipCodes(): Promise<{ success: boolean; message: string; updatedCount: number }> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: false, message: 'Cannot update mock data', updatedCount: 0 }
  }

  try {
    // Get all jobs with NULL zip codes
    const { data: jobsWithNullZip, error: fetchError } = await supabase
      .from('jobs')
      .select('zip_code_for_job, city, state, date_recorded')
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

    // Generate default zip codes based on city/state or use a default
    const updates = jobsWithNullZip.map((job: any) => {
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
      
      return {
        zip_code_for_job: zipCode
      }
    })

    // Update jobs in batches
    const batchSize = 10
    let updatedCount = 0

    for (let i = 0; i < updates.length; i += batchSize) {
      const batch = updates.slice(i, i + batchSize)
      
      const { error: updateError } = await supabase
        .from('jobs')
        .upsert(batch, { onConflict: 'zip_code_for_job' })

      if (updateError) {
        console.error('❌ Error updating zip code batch:', updateError)
        return { success: false, message: `Error updating zip code batch ${i / batchSize + 1}`, updatedCount }
      }

      updatedCount += batch.length
      console.log(`✅ Updated zip code batch ${Math.floor(i / batchSize) + 1}: ${batch.length} jobs`)
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