import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

let supabase: any
let supabaseAdmin: any

// Check if environment variables are set
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(`
    Supabase environment variables are missing.
    
    Please create a .env.local file in your project root with:
    
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
    
    Get these values from your Supabase project settings.
  `)
  // Simple test to check Supabase connection
require('dotenv').config({ path: '.env.local' })

console.log('Environment variables:')
console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing')
console.log('SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing')

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log('URL starts with:', process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30) + '...')
}
  // Create a mock client for development
  supabase = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      signIn: async () => ({ data: { user: null }, error: null }),
      signOut: async () => ({ error: null })
    },
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null })
    })
  }
  
  supabaseAdmin = supabase
} else {

  // Create Supabase client
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  })

  // Create admin client with service role key if available
  if (supabaseServiceKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  } else {
    supabaseAdmin = supabase // Fallback to regular client
  }
}


export { supabase, supabaseAdmin }

// Database types (will be generated from Supabase)
export type Database = {
  public: {
    Tables: {
      jobs: {
        Row: {
          id: number
          zip_code_for_job: string | null
          city: string | null
          state: string | null
          date_recorded: string | null
          technician: string | null
          customer_name: string | null
          consumer_name_if_not_customer: string | null
          invoice_number: string | null
          merchandise_sold: number | null
          parts_sold: number | null
          service_call_amount: number | null
          other_labor: number | null
          sales_tax: number | null
          total_amount: number | null
          paycode: number | null
          dept: string | null
          tax_portion1: number | null
          tax_portion2: number | null
          exempt_materials: number | null
          exempt_labor: number | null
          exempt_total: number | null
          other_data: string | null
          tax_scheme: string | null
          tax_jurisdiction: string | null
          po_dispatch_id: string | null
          merch_cost: number | null
          parts_cost: number | null
          type_serviced: string | null
          make_serviced: string | null
          tp_money_rcvd: string | null
          is_oem_client: boolean | null
          dt_of_prior_py_cd2_entry: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          zip_code_for_job?: string | null
          city?: string | null
          state?: string | null
          date_recorded?: string | null
          technician?: string | null
          customer_name?: string | null
          consumer_name_if_not_customer?: string | null
          invoice_number?: string | null
          merchandise_sold?: number | null
          parts_sold?: number | null
          service_call_amount?: number | null
          other_labor?: number | null
          sales_tax?: number | null
          total_amount?: number | null
          paycode?: number | null
          dept?: string | null
          tax_portion1?: number | null
          tax_portion2?: number | null
          exempt_materials?: number | null
          exempt_labor?: number | null
          exempt_total?: number | null
          other_data?: string | null
          tax_scheme?: string | null
          tax_jurisdiction?: string | null
          po_dispatch_id?: string | null
          merch_cost?: number | null
          parts_cost?: number | null
          type_serviced?: string | null
          make_serviced?: string | null
          tp_money_rcvd?: string | null
          is_oem_client?: boolean | null
          dt_of_prior_py_cd2_entry?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          zip_code_for_job?: string | null
          city?: string | null
          state?: string | null
          date_recorded?: string | null
          technician?: string | null
          customer_name?: string | null
          consumer_name_if_not_customer?: string | null
          invoice_number?: string | null
          merchandise_sold?: number | null
          parts_sold?: number | null
          service_call_amount?: number | null
          other_labor?: number | null
          sales_tax?: number | null
          total_amount?: number | null
          paycode?: number | null
          dept?: string | null
          tax_portion1?: number | null
          tax_portion2?: number | null
          exempt_materials?: number | null
          exempt_labor?: number | null
          exempt_total?: number | null
          other_data?: string | null
          tax_scheme?: string | null
          tax_jurisdiction?: string | null
          po_dispatch_id?: string | null
          merch_cost?: number | null
          parts_cost?: number | null
          type_serviced?: string | null
          make_serviced?: string | null
          tp_money_rcvd?: string | null
          is_oem_client?: boolean | null
          dt_of_prior_py_cd2_entry?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      technicians: {
        Row: {
          id: number
          technician_code: string
          name: string | null
          email: string | null
          role: string | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: number
          technician_code: string
          name?: string | null
          email?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: number
          technician_code?: string
          name?: string | null
          email?: string | null
          role?: string | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
    Views: {
      job_metrics: {
        Row: {
          technician: string | null
          month: string | null
          total_jobs: number | null
          total_sales: number | null
          total_parts_cost: number | null
          total_labor: number | null
          avg_sale_per_job: number | null
          avg_labor_per_job: number | null
          service_call_count: number | null
          service_call_percentage: number | null
          part_cost_to_sales_ratio: number | null
          labor_to_sales_ratio: number | null
        }
      }
    }
    Functions: {
      calculate_payout: {
        Args: {
          total_sales: number
          parts_cost: number
          is_oem: boolean
        }
        Returns: number
      }
    }
  }
}