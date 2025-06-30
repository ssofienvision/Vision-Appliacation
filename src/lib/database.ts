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

// Mock data for development
const mockJobs: Job[] = [
  {
    invoice_number: 'INV001',
    customer_name: 'John Smith',
    total_amount: 245.50,
    date_recorded: '2024-01-15',
    technician: 'TECH001',
    type_serviced: 'HVAC Repair',
    make_serviced: 'Carrier',
    parts_cost: 45.00,
    is_oem_client: false,
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    invoice_number: 'INV002',
    customer_name: 'Sarah Johnson',
    total_amount: 189.75,
    date_recorded: '2024-01-14',
    technician: 'TECH002',
    type_serviced: 'Plumbing',
    make_serviced: 'Kohler',
    parts_cost: 25.00,
    is_oem_client: true,
    created_at: '2024-01-14T14:30:00Z',
    updated_at: '2024-01-14T14:30:00Z'
  },
  {
    invoice_number: 'INV003',
    customer_name: 'Mike Wilson',
    total_amount: 320.00,
    date_recorded: '2024-01-13',
    technician: 'TECH001',
    type_serviced: 'Electrical',
    make_serviced: 'Siemens',
    parts_cost: 80.00,
    is_oem_client: false,
    created_at: '2024-01-13T09:15:00Z',
    updated_at: '2024-01-13T09:15:00Z'
  }
]

const mockTechnicians: Technician[] = [
  {
    technician_code: 'TECH001',
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'technician',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    technician_code: 'TECH002',
    name: 'Maria Garcia',
    email: 'maria@example.com',
    role: 'technician',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    technician_code: 'ADMIN001',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'admin',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

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
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock jobs data')
      return mockJobs
    }

    console.log('🔍 Fetching jobs from database with filters:', filters)
    console.log('🔍 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
    console.log('🔍 Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

    try {
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
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      console.log('🔍 Executing database query...')
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
      
    } catch (error) {
      console.error('❌ Unexpected error in getJobs:', error)
      console.error('❌ Error type:', typeof error)
      console.error('❌ Error message:', error instanceof Error ? error.message : 'Unknown error')
      
      // Return empty array instead of throwing to prevent app crash
      return []
    }
  },

  async getDashboardMetrics(filters: any = {}): Promise<DashboardMetrics> {
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock dashboard metrics')
      const totalJobs = mockJobs.length
      const totalSales = mockJobs.reduce((sum: number, job: Job) => sum + job.total_amount, 0)
      const totalParts = mockJobs.reduce((sum: number, job: Job) => sum + job.parts_cost, 0)
      const totalLabor = totalSales - totalParts
      const avgSalePerJob = totalJobs > 0 ? totalSales / totalJobs : 0
      const serviceCalls = mockJobs.filter((job: Job) => job.parts_cost > 0).length
      const serviceCallPercentage = totalJobs > 0 ? (serviceCalls / totalJobs) * 100 : 0

      return {
        totalJobs,
        totalSales,
        totalTechnicians: mockTechnicians.length,
        avgSalePerJob,
        serviceCallPercentage,
        totalLabor,
        totalParts,
        jobsThisMonth: totalJobs,
        salesThisMonth: totalSales
      }
    }

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
    if (error) throw error

    const jobs = data || []
    const totalJobs = jobs.length
    const totalSales = jobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)
    const totalParts = jobs.reduce((sum: number, job: any) => sum + (job.parts_cost || 0), 0)
    const totalLabor = totalSales - totalParts
    const avgSalePerJob = totalJobs > 0 ? totalSales / totalJobs : 0

    // Calculate service call percentage (jobs with parts_cost > 0)
    const serviceCalls = jobs.filter((job: any) => (job.parts_cost || 0) > 0).length
    const serviceCallPercentage = totalJobs > 0 ? (serviceCalls / totalJobs) * 100 : 0

    // Get this month's data
    const now = new Date()
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthJobs = jobs.filter((job: any) => new Date(job.date_recorded) >= thisMonthStart)
    const jobsThisMonth = thisMonthJobs.length
    const salesThisMonth = thisMonthJobs.reduce((sum: number, job: any) => sum + (job.total_amount || 0), 0)

    // Get total technicians (this would need to be fetched separately in a real app)
    const { data: techData } = await supabase.from('technicians').select('technician_code')
    const totalTechnicians = techData?.length || 0

    return {
      totalJobs,
      totalSales,
      totalTechnicians,
      avgSalePerJob,
      serviceCallPercentage,
      totalLabor,
      totalParts,
      jobsThisMonth,
      salesThisMonth
    }
  },

  async getSalesOverTime(filters: any = {}): Promise<SalesData[]> {
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock sales data')
      return [
        { month: '2024-01', sales: 755.25 },
        { month: '2024-02', sales: 820.50 },
        { month: '2024-03', sales: 945.75 }
      ]
    }

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
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock job type data')
      return [
        { type: 'HVAC Repair', totalSales: 245.50, count: 1 },
        { type: 'Plumbing', totalSales: 189.75, count: 1 },
        { type: 'Electrical', totalSales: 320.00, count: 1 }
      ]
    }

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

  // Generate invoice numbers for jobs that don't have them
  async generateMissingInvoiceNumbers(): Promise<{ success: boolean; message: string; updatedCount: number }> {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      return { success: false, message: 'Cannot update mock data', updatedCount: 0 }
    }

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

      // Generate invoice numbers and update database
      const updates = jobsWithoutInvoices.map((job: any, index: number) => {
        const date = new Date(job.date_recorded)
        const year = date.getFullYear()
        const month = String(date.getMonth() + 1).padStart(2, '0')
        const day = String(date.getDate()).padStart(2, '0')
        const sequence = String(index + 1).padStart(3, '0')
        
        // Generate invoice number format: INV-YYYYMMDD-XXX
        const invoiceNumber = `INV-${year}${month}${day}-${sequence}`
        
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
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock technicians data')
      return mockTechnicians
    }

    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .order('name')
    
    if (error) throw error
    return data || []
  },

  async getCurrentTechnician(): Promise<Technician | null> {
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock current technician data')
      return mockTechnicians[0] // Return first technician as current user
    }

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
    // Check if we're in mock mode
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.log('📊 Using mock technician by code data')
      return mockTechnicians.find(t => t.technician_code === technicianCode) || null
    }

    const { data, error } = await supabase
      .from('technicians')
      .select('*')
      .eq('technician_code', technicianCode)
      .single()

    if (error) throw error
    return data
  }
} 