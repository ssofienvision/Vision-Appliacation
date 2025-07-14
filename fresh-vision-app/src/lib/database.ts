import { supabase } from './supabase'

// Types
export interface Job {
  invoice_number: string
  customer_name: string
  total_amount: number
  date_recorded: string
  technician: string
  type_serviced: string
  make_serviced: string
  parts_cost: number
  is_oem_client: boolean
  created_at: string
  updated_at: string
}

export interface Technician {
  technician_code: string
  name: string
  email: string
  role: string
  created_at: string
  updated_at: string
}

export interface DashboardMetrics {
  totalJobs: number
  totalSales: number
  totalTechnicians: number
  avgSalePerJob: number
  serviceCallPercentage: number
  totalLabor: number
  totalParts: number
  jobsThisMonth: number
  salesThisMonth: number
  // New KPIs
  avgLaborPerJob: number
  invoiceCount: number
  salesByState: { state: string; sales: number; count: number }[]
  returnCustomerCount: number
  returnCustomerPercentage: number
  totalPartProfit: number
  avgPartProfit: number
  serviceCallCount: number
  totalServiceCallSales: number
  serviceCallToTotalSalesRatio: number
  // Additional metrics
  partsSalesRatio: number
  laborSalesRatio: number
  totalPayout: number
  oemJobsCount: number
  nonOemJobsCount: number
  oemSales: number
  nonOemSales: number
}

export interface SalesData {
  month: string
  sales: number
}

export interface JobTypeData {
  type: string
  totalSales: number
  count: number
}

export interface ClientData {
  customer_name: string
  totalSales: number
  totalJobs: number
  avgSalePerJob: number
  firstJobDate: string
  lastJobDate: string
  totalParts: number
  totalLabor: number
  returnCustomer: boolean
  paycode: number
  state: string
  city: string
  monthlyData: {
    month: string
    sales: number
    jobs: number
    parts: number
    labor: number
  }[]
}

export interface ClientFilters {
  startDate?: string
  endDate?: string
  technician?: string
  state?: string
  city?: string
  returnCustomer?: boolean
  minSales?: number
  maxSales?: number
  minJobs?: number
  maxJobs?: number
  sortBy?: 'totalSales' | 'totalJobs' | 'avgSalePerJob' | 'lastJobDate'
  sortOrder?: 'asc' | 'desc'
  limit?: number
}


// Database connection test function
export const testDatabaseConnection = async () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return { success: false, message: 'Missing Supabase URL' }
  }

  try {
    console.log('🔍 Testing database connection...')
    
    // Test basic connection
    const { data, error } = await supabase
      .from('technicians')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection test failed:', error)
      return { success: false, message: `Connection failed: ${error.message}` }
    }
    
    console.log('✅ Database connection successful')
    return { success: true, message: 'Database connection successful' }
    
  } catch (error) {
    console.error('❌ Database connection test error:', error)
    return { success: false, message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` }
  }
}

// Jobs Service
export const jobsService = {
  async getJobs(filters: any = {}): Promise<Job[]> {
    console.log('🔍 Fetching jobs from database with filters:', filters)
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('🔍 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

    try {
      // If a specific limit is provided, use it
      if (filters.limit) {
        let query = supabase
          .from('jobs')
          .select('*')
          .order('date_recorded', { ascending: false })

        if (filters.technician) {
          query = query.eq('technician', filters.technician)
        }
        if (filters.startDate) {
          query = query.gte('date_recorded', filters.startDate)
        }
        if (filters.endDate) {
          query = query.lte('date_recorded', filters.endDate)
        }
        query = query.limit(filters.limit)

        console.log('🔍 Executing limited database query...')
        const { data, error } = await query
        
        if (error) {
          console.error('❌ Database error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
          
          // Check for specific error types
          if (error.code === 'PGRST116') {
            console.error('❌ This might be a Row Level Security (RLS) issue')
            console.error('❌ Check if the user has proper permissions')
          }
          
          if (error.code === '42P01') {
            console.error('❌ Table "jobs" does not exist')
            console.error('❌ Check if the database schema is properly set up')
          }
          
          throw error
        }
        
        console.log('📊 Raw database response:', data)
        console.log('📊 Number of jobs returned:', data?.length || 0)
        
        if (data && data.length > 0) {
          console.log('📊 Sample jobs with invoice numbers:', data.slice(0, 3).map((job: any) => ({
            invoice_number: job.invoice_number,
            customer_name: job.customer_name,
            invoice_number_type: typeof job.invoice_number,
            invoice_number_null: job.invoice_number === null,
            invoice_number_undefined: job.invoice_number === undefined
          })))
          
          // Log all fields for the first job to see what's populated
          console.log('📊 Complete first job record:', data[0])
          console.log('📊 Available fields in first job:', Object.keys(data[0]))
          console.log('📊 Non-null fields in first job:', Object.entries(data[0]).filter(([key, value]) => value !== null && value !== undefined))
        } else {
          console.log('📊 No jobs found in database')
        }
        
        return data || []
      }
      
      // If no limit is provided, fetch all jobs with pagination
      console.log('🔍 Fetching all jobs with pagination...')
      
      // First get total count
      let countQuery = supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })

      if (filters.technician) {
        countQuery = countQuery.eq('technician', filters.technician)
      }
      if (filters.startDate) {
        countQuery = countQuery.gte('date_recorded', filters.startDate)
      }
      if (filters.endDate) {
        countQuery = countQuery.lte('date_recorded', filters.endDate)
      }

      const { count: totalCount, error: countError } = await countQuery
      if (countError) {
        console.error('❌ Error getting total count:', countError)
        throw countError
      }

      console.log('📊 Total jobs to fetch:', totalCount)

      // Fetch all jobs in chunks
      let allJobs: any[] = []
      const chunkSize = 1000 // Supabase default limit
      
      for (let offset = 0; offset < (totalCount || 0); offset += chunkSize) {
        let chunkQuery = supabase
          .from('jobs')
          .select('*')
          .order('date_recorded', { ascending: false })
          .range(offset, offset + chunkSize - 1)

        if (filters.technician) {
          chunkQuery = chunkQuery.eq('technician', filters.technician)
        }
        if (filters.startDate) {
          chunkQuery = chunkQuery.gte('date_recorded', filters.startDate)
        }
        if (filters.endDate) {
          chunkQuery = chunkQuery.lte('date_recorded', filters.endDate)
        }

        const { data: chunkData, error: chunkError } = await chunkQuery
        if (chunkError) {
          console.error('❌ Error fetching chunk:', chunkError)
          throw chunkError
        }

        if (chunkData) {
          allJobs = allJobs.concat(chunkData)
        }
        
        console.log(`📊 Fetched chunk ${Math.floor(offset / chunkSize) + 1}, total jobs so far: ${allJobs.length}`)
      }

      console.log('📊 Total jobs fetched:', allJobs.length)
      return allJobs
      
    } catch (error) {
      console.error('❌ Unexpected error in getJobs:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
      
      // Return empty array instead of throwing to prevent app crash
      return []
    }
  },

  async getDashboardMetrics(filters: any = {}): Promise<DashboardMetrics> {
    console.log('🔍 Getting dashboard metrics with filters:', filters)

    // First, get total count without limit to check if we're hitting limits
    let countQuery = supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })

    if (filters.technician) {
      countQuery = countQuery.eq('technician', filters.technician)
    }
    if (filters.startDate) {
      countQuery = countQuery.gte('date_recorded', filters.startDate)
    }
    if (filters.endDate) {
      countQuery = countQuery.lte('date_recorded', filters.endDate)
    }

    const { count: totalCount, error: countError } = await countQuery
    if (countError) {
      console.error('❌ Error getting total count:', countError)
      throw countError
    }

    console.log('📊 Total jobs in database:', totalCount)

    // Handle large datasets by fetching in chunks if needed
    let allJobs: any[] = []
    const chunkSize = 1000 // Supabase default limit
    
    if (totalCount && totalCount > chunkSize) {
      console.log('📊 Large dataset detected, fetching in chunks...')
      
      // Fetch all jobs in chunks
      for (let offset = 0; offset < totalCount; offset += chunkSize) {
        let chunkQuery = supabase
          .from('jobs')
          .select('*')
          .range(offset, offset + chunkSize - 1)

        if (filters.technician) {
          chunkQuery = chunkQuery.eq('technician', filters.technician)
        }
        if (filters.startDate) {
          chunkQuery = chunkQuery.gte('date_recorded', filters.startDate)
        }
        if (filters.endDate) {
          chunkQuery = chunkQuery.lte('date_recorded', filters.endDate)
        }

        const { data: chunkData, error: chunkError } = await chunkQuery
        if (chunkError) {
          console.error('❌ Error fetching chunk:', chunkError)
          throw chunkError
        }

        if (chunkData) {
          allJobs = allJobs.concat(chunkData)
        }
        
        console.log(`📊 Fetched chunk ${Math.floor(offset / chunkSize) + 1}, total jobs so far: ${allJobs.length}`)
      }
    } else {
      // For smaller datasets, fetch all at once
      let query = supabase
        .from('jobs')
        .select('*')

      if (filters.technician) {
        query = query.eq('technician', filters.technician)
      }
      if (filters.startDate) {
        query = query.gte('date_recorded', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('date_recorded', filters.endDate)
      }

      const { data, error } = await query
      if (error) {
        console.error('❌ Error fetching jobs:', error)
        throw error
      }

      allJobs = data || []
    }

    console.log('📊 Total jobs fetched:', allJobs.length)

    const totalJobs = allJobs.length
    const totalSales = allJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)
    const totalParts = allJobs.reduce((sum: number, job: any) => sum + (job.parts_cost || 0), 0)
    const totalLabor = totalSales - totalParts
    const avgSalePerJob = totalJobs > 0 ? totalSales / totalJobs : 0
    const avgLaborPerJob = totalJobs > 0 ? totalLabor / totalJobs : 0

    // Calculate ratios
    const partsSalesRatio = totalSales > 0 ? (totalParts / totalSales) * 100 : 0
    const laborSalesRatio = totalSales > 0 ? (totalLabor / totalSales) * 100 : 0

    // Calculate service call metrics - be more flexible with amounts
    const serviceCallJobs = allJobs.filter((job: any) => {
      const amount = job.total_amount || 0
      // Check for common service call amounts
      return amount === 74.95 || amount === 89.45 || amount === 75 || amount === 90 || 
             (amount >= 70 && amount <= 100 && job.parts_cost === 0) // Service calls typically have no parts
    })
    const serviceCallCount = serviceCallJobs.length
    const totalServiceCallSales = serviceCallJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)
    const serviceCallPercentage = totalJobs > 0 ? (serviceCallCount / totalJobs) * 100 : 0
    const serviceCallToTotalSalesRatio = totalSales > 0 ? (totalServiceCallSales / totalSales) * 100 : 0

    // Calculate invoice count (unique invoice numbers)
    const uniqueInvoices = new Set(allJobs.map((job: any) => job.invoice_number).filter(Boolean))
    const invoiceCount = uniqueInvoices.size

    // Calculate sales by state
    const stateSales = allJobs.reduce((acc: Record<string, { sales: number; count: number }>, job: any) => {
      const state = job.state || 'Unknown'
      if (!acc[state]) {
        acc[state] = { sales: 0, count: 0 }
      }
      acc[state].sales += job.total_amount || 0
      acc[state].count += 1
      return acc
    }, {})

    const salesByState = Object.entries(stateSales)
      .map(([state, data]) => ({ 
        state, 
        sales: (data as { sales: number; count: number }).sales, 
        count: (data as { sales: number; count: number }).count 
      }))
      .sort((a, b) => b.sales - a.sales)

    // Calculate return customers (paycode = 2)
    const returnCustomers = allJobs.filter((job: any) => job.paycode === 2)
    const returnCustomerCount = returnCustomers.length
    const returnCustomerPercentage = totalJobs > 0 ? (returnCustomerCount / totalJobs) * 100 : 0

    // Calculate part profit (parts_sold - parts_cost)
    const totalPartProfit = allJobs.reduce((sum: number, job: any) => {
      const partsSold = job.parts_sold || 0
      const partsCost = job.parts_cost || 0
      return sum + (partsSold - partsCost)
    }, 0)
    const avgPartProfit = totalJobs > 0 ? totalPartProfit / totalJobs : 0

    // Calculate OEM vs Non-OEM metrics
    const oemJobs = allJobs.filter((job: any) => job.is_oem_client === true)
    const nonOemJobs = allJobs.filter((job: any) => job.is_oem_client === false)
    const oemJobsCount = oemJobs.length
    const nonOemJobsCount = nonOemJobs.length
    const oemSales = oemJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)
    const nonOemSales = nonOemJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)

    // Get this month's data
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthJobs = allJobs.filter((job: any) => new Date(job.date_recorded) >= thisMonthStart)
    const jobsThisMonth = thisMonthJobs.length
    const salesThisMonth = thisMonthJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)

    // Get total technicians
    const { data: techData } = await supabase.from('technicians').select('technician_code')
    const totalTechnicians = techData?.length || 0

    // Calculate total payout (this would need to be implemented based on your payout logic)
    const totalPayout = allJobs.reduce((sum: number, job: any) => {
      // Simple payout calculation - you might want to adjust this
      const labor = (job.total_amount || 0) - (job.parts_cost || 0)
      const isOem = job.is_oem_client === true
      if (isOem) {
        return sum + (labor * 0.065) + (job.parts_cost || 0) // 6.5% for OEM
      } else {
        return sum + (labor * 0.5) + (job.parts_cost || 0) // 50% for non-OEM
      }
    }, 0)

    console.log('📊 Calculated metrics:', {
      totalJobs,
      totalSales,
      totalLabor,
      totalParts,
      avgSalePerJob,
      avgLaborPerJob,
      partsSalesRatio,
      laborSalesRatio,
      serviceCallCount,
      oemJobsCount,
      nonOemJobsCount
    })

    return {
      totalJobs,
      totalSales,
      totalTechnicians,
      avgSalePerJob,
      serviceCallPercentage,
      totalLabor,
      totalParts,
      jobsThisMonth,
      salesThisMonth,
      avgLaborPerJob,
      invoiceCount,
      salesByState,
      returnCustomerCount,
      returnCustomerPercentage,
      totalPartProfit,
      avgPartProfit,
      serviceCallCount,
      totalServiceCallSales,
      serviceCallToTotalSalesRatio,
      // Add the missing metrics
      partsSalesRatio,
      laborSalesRatio,
      totalPayout,
      oemJobsCount,
      nonOemJobsCount,
      oemSales,
      nonOemSales
    }
  },

  async getSalesOverTime(filters: any = {}): Promise<SalesData[]> {

    let query = supabase
      .from('jobs')
      .select('date_recorded, total_amount')

    if (filters.technician) {
      query = query.eq('technician', filters.technician)
    }
    if (filters.startDate) {
      query = query.gte('date_recorded', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('date_recorded', filters.endDate)
    }

    const { data, error } = await query
    if (error) throw error

    const jobs = data || []
    
    // Group by month
    const monthlyData = jobs.reduce((acc: Record<string, number>, job: any) => {
      const month = job.date_recorded.substring(0, 7) // YYYY-MM
      if (!acc[month]) {
        acc[month] = 0
      }
      acc[month] += job.total_amount || 0
      return acc
    }, {} as Record<string, number>)

    return Object.entries(monthlyData)
      .map(([month, sales]) => ({ month, sales: sales as number }))
      .sort((a, b) => a.month.localeCompare(b.month))
  },

  async getJobTypeSummary(filters: any = {}): Promise<JobTypeData[]> {

    let query = supabase
      .from('jobs')
      .select('type_serviced, total_amount')

    if (filters.technician) {
      query = query.eq('technician', filters.technician)
    }
    if (filters.startDate) {
      query = query.gte('date_recorded', filters.startDate)
    }
    if (filters.endDate) {
      query = query.lte('date_recorded', filters.endDate)
    }

    const { data, error } = await query
    if (error) throw error

    const jobs = data || []
    
    // Group by job type
    const typeData = jobs.reduce((acc: Record<string, { totalSales: number; count: number }>, job: any) => {
      const type = job.type_serviced || 'Unknown'
      if (!acc[type]) {
        acc[type] = { totalSales: 0, count: 0 }
      }
      acc[type].totalSales += job.total_amount || 0
      acc[type].count += 1
      return acc
    }, {} as Record<string, { totalSales: number; count: number }>)

    return Object.entries(typeData)
      .map(([type, data]) => ({ 
        type, 
        totalSales: (data as { totalSales: number; count: number }).totalSales, 
        count: (data as { totalSales: number; count: number }).count 
      }))
      .sort((a, b) => b.totalSales - a.totalSales)
  },

  // Get top clients with detailed analytics
  async getTopClients(filters: ClientFilters = {}): Promise<ClientData[]> {
    try {
      let query = supabase
        .from('jobs')
        .select('*')

      // Apply filters
      if (filters.technician) {
        query = query.eq('technician', filters.technician)
      }
      if (filters.startDate) {
        query = query.gte('date_recorded', filters.startDate)
      }
      if (filters.endDate) {
        query = query.lte('date_recorded', filters.endDate)
      }
      if (filters.state) {
        query = query.eq('state', filters.state)
      }
      if (filters.city) {
        query = query.eq('city', filters.city)
      }
      if (filters.returnCustomer !== undefined) {
        const paycode = filters.returnCustomer ? 2 : 1
        query = query.eq('paycode', paycode)
      }

      const { data, error } = await query
      if (error) throw error

      const jobs = data || []
      
      // Group jobs by customer
      const clientMap = new Map<string, any[]>()
      
      jobs.forEach((job: any) => {
        const customerName = job.customer_name || 'Unknown Customer'
        if (!clientMap.has(customerName)) {
          clientMap.set(customerName, [])
        }
        clientMap.get(customerName)!.push(job)
      })

      // Calculate client metrics
      const clients: ClientData[] = []
      
      clientMap.forEach((clientJobs, customerName) => {
        const totalSales = clientJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)
        const totalJobs = clientJobs.length
        const avgSalePerJob = totalJobs > 0 ? totalSales / totalJobs : 0
        const totalParts = clientJobs.reduce((sum: number, job: any) => sum + (job.parts_cost || 0), 0)
        const totalLabor = totalSales - totalParts
        
        // Get date range
        const dates = clientJobs.map((job: any) => new Date(job.date_recorded)).sort((a, b) => a.getTime() - b.getTime())
        const firstJobDate = dates[0]?.toISOString().split('T')[0] || ''
        const lastJobDate = dates[dates.length - 1]?.toISOString().split('T')[0] || ''
        
        // Get return customer status (check if any job has paycode 2)
        const returnCustomer = clientJobs.some((job: any) => job.paycode === 2)
        const paycode = returnCustomer ? 2 : 1
        
        // Get location (use most recent job's location)
        const mostRecentJob = clientJobs.sort((a: any, b: any) => 
          new Date(b.date_recorded).getTime() - new Date(a.date_recorded).getTime()
        )[0]
        const state = mostRecentJob?.state || 'Unknown'
        const city = mostRecentJob?.city || 'Unknown'
        
        // Calculate monthly data
        const monthlyData = this.calculateMonthlyData(clientJobs)
        
        clients.push({
          customer_name: customerName,
          totalSales,
          totalJobs,
          avgSalePerJob,
          firstJobDate,
          lastJobDate,
          totalParts,
          totalLabor,
          returnCustomer,
          paycode,
          state,
          city,
          monthlyData
        })
      })

      // Apply additional filters
      let filteredClients = clients.filter(client => {
        if (filters.minSales && client.totalSales < filters.minSales) return false
        if (filters.maxSales && client.totalSales > filters.maxSales) return false
        if (filters.minJobs && client.totalJobs < filters.minJobs) return false
        if (filters.maxJobs && client.totalJobs > filters.maxJobs) return false
        return true
      })

      // Sort clients
      const sortBy = filters.sortBy || 'totalSales'
      const sortOrder = filters.sortOrder || 'desc'
      
      filteredClients.sort((a, b) => {
        let aValue: any = a[sortBy]
        let bValue: any = b[sortBy]
        
        // Handle date sorting
        if (sortBy === 'lastJobDate') {
          aValue = new Date(aValue).getTime()
          bValue = new Date(bValue).getTime()
        }
        
        if (sortOrder === 'asc') {
          return aValue - bValue
        } else {
          return bValue - aValue
        }
      })

      // Apply limit
      const limit = filters.limit || 25
      return filteredClients.slice(0, limit)
      
    } catch (error) {
      console.error('Error getting top clients:', error)
      return []
    }
  },

  // Helper function to calculate monthly data for a client
  calculateMonthlyData(jobs: any[]): { month: string; sales: number; jobs: number; parts: number; labor: number }[] {
    const monthlyMap = new Map<string, { sales: number; jobs: number; parts: number; labor: number }>()
    
    jobs.forEach((job: any) => {
      const month = job.date_recorded.substring(0, 7) // YYYY-MM
      const sales = job.total_amount || 0
      const parts = job.parts_cost || 0
      const labor = sales - parts
      
      if (!monthlyMap.has(month)) {
        monthlyMap.set(month, { sales: 0, jobs: 0, parts: 0, labor: 0 })
      }
      
      const monthData = monthlyMap.get(month)!
      monthData.sales += sales
      monthData.jobs += 1
      monthData.parts += parts
      monthData.labor += labor
    })
    
    return Array.from(monthlyMap.entries())
      .map(([month, data]) => ({
        month,
        ...data
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
  },

  // Get unique states and cities for filtering
  async getClientFilterOptions(): Promise<{ states: string[]; cities: string[] }> {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('state, city')
        .not('state', 'is', null)
        .not('city', 'is', null)

      if (error) throw error

      const states = Array.from(new Set(data?.map((job: any) => job.state).filter(Boolean))).sort() as string[]
      const cities = Array.from(new Set(data?.map((job: any) => job.city).filter(Boolean))).sort() as string[]

      return { states, cities }
    } catch (error) {
      console.error('Error getting filter options:', error)
      return { states: [], cities: [] }
    }
  },

  // Generate invoice numbers for jobs that don't have them
  async generateMissingInvoiceNumbers(): Promise<{ success: boolean; message: string; updatedCount: number }> {

    try {
      // Get all jobs without invoice numbers
      const { data: jobsWithoutInvoices, error: fetchError } = await supabase
        .from('jobs')
        .select('invoice_number, date_recorded, technician, customer_name')
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

      // Generate simple 5-digit invoice numbers
      const updates = jobsWithoutInvoices.map((job: any, index: number) => {
        const invoiceNumber = String(nextInvoiceNumber + index).padStart(5, '0')
        
        return {
          invoice_number: invoiceNumber
        }
      })

      // Update jobs in batches
      const batchSize = 10
      let updatedCount = 0

      for (let i = 0; i < updates.length; i += batchSize) {
        const batch = updates.slice(i, i + batchSize)
        
        const { error: updateError } = await supabase
          .from('jobs')
          .upsert(batch, { onConflict: 'invoice_number' })

        if (updateError) {
          console.error('❌ Error updating batch:', updateError)
          return { success: false, message: `Error updating batch ${i / batchSize + 1}`, updatedCount }
        }

        updatedCount += batch.length
        console.log(`✅ Updated batch ${Math.floor(i / batchSize) + 1}: ${batch.length} jobs`)
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
}

// Technician Service
export const technicianService = {
  async getTechnicians(): Promise<Technician[]> {

    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getCurrentTechnician(): Promise<Technician | null> {

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('email', user.email)
      .single()

    if (error) throw error
    return data
  },

  async getTechnicianByCode(technicianCode: string): Promise<Technician | null> {

    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('technician_code', technicianCode)
      .single()

    if (error) throw error
    return data
  }
} 