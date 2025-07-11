import { supabase } from '../src/lib/supabase'

async function debugMetrics() {
  console.log('🔍 Debugging dashboard metrics...')

  try {
    // Check total count
    const { count: totalCount, error: countError } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      console.error('❌ Error getting total count:', countError)
      return
    }

    console.log('📊 Total jobs in database:', totalCount)

    // Get all jobs with high limit
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(10000)

    if (error) {
      console.error('❌ Error fetching jobs:', error)
      return
    }

    console.log('📊 Jobs fetched:', jobs?.length || 0)

    if (jobs && jobs.length > 0) {
      // Check service call amounts
      const serviceCallAmounts = jobs
        .filter((job: any) => {
          const amount = job.total_amount || 0
          return amount === 74.95 || amount === 89.45 || amount === 75 || amount === 90 || 
                 (amount >= 70 && amount <= 100 && (job.parts_cost || 0) === 0)
        })
        .map((job: any) => ({
          amount: job.total_amount,
          parts_cost: job.parts_cost,
          customer: job.customer_name,
          date: job.date_recorded
        }))

      console.log('🔧 Service call jobs found:', serviceCallAmounts.length)
      if (serviceCallAmounts.length > 0) {
        console.log('🔧 Sample service call jobs:', serviceCallAmounts.slice(0, 5))
      }

      // Check OEM jobs
      const oemJobs = jobs.filter((job: any) => job.is_oem_client === true)
      const nonOemJobs = jobs.filter((job: any) => job.is_oem_client === false)
      const nullOemJobs = jobs.filter((job: any) => job.is_oem_client === null)

      console.log('🏭 OEM jobs:', oemJobs.length)
      console.log('🏭 Non-OEM jobs:', nonOemJobs.length)
      console.log('🏭 Null OEM jobs:', nullOemJobs.length)

      // Check parts cost
      const jobsWithParts = jobs.filter((job: any) => (job.parts_cost || 0) > 0)
      const jobsWithoutParts = jobs.filter((job: any) => (job.parts_cost || 0) === 0)

      console.log('📦 Jobs with parts cost:', jobsWithParts.length)
      console.log('📦 Jobs without parts cost:', jobsWithoutParts.length)

      // Calculate basic metrics
      const totalSales = jobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)
      const totalParts = jobs.reduce((sum: number, job: any) => sum + (job.parts_cost || 0), 0)
      const totalLabor = totalSales - totalParts

      console.log('💰 Total sales:', totalSales)
      console.log('💰 Total parts:', totalParts)
      console.log('💰 Total labor:', totalLabor)
      console.log('💰 Parts/Sales ratio:', totalSales > 0 ? (totalParts / totalSales) * 100 : 0)
      console.log('💰 Labor/Sales ratio:', totalSales > 0 ? (totalLabor / totalSales) * 100 : 0)

      // Check for jobs with missing data
      const jobsWithNullAmounts = jobs.filter((job: any) => job.total_amount === null)
      const jobsWithNullParts = jobs.filter((job: any) => job.parts_cost === null)

      console.log('⚠️ Jobs with null total_amount:', jobsWithNullAmounts.length)
      console.log('⚠️ Jobs with null parts_cost:', jobsWithNullParts.length)

    } else {
      console.log('❌ No jobs found in database')
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

debugMetrics() 