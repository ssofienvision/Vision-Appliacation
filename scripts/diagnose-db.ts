import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

// Create Supabase client with anon key for testing
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('🔍 Environment Variables Check:')
console.log('📊 NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing')
console.log('📊 NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set (length: ' + supabaseAnonKey.length + ')' : 'Missing')

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  console.log('Example .env.local file:')
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function diagnoseDatabase() {
  console.log('🔍 Starting database diagnosis...')
  console.log('📊 Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('📊 Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')
  
  try {
    // Test 1: Basic connection
    console.log('\n🔍 Test 1: Basic connection...')
    const { data: testData, error: testError } = await supabase
      .from('technicians')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.error('❌ Basic connection failed:', testError)
      return
    }
    console.log('✅ Basic connection successful')

    // Test 2: Check if jobs table exists
    console.log('\n🔍 Test 2: Check jobs table...')
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('count')
      .limit(1)
    
    if (jobsError) {
      console.error('❌ Jobs table access failed:', jobsError)
      console.error('❌ Error details:', {
        message: jobsError.message,
        details: jobsError.details,
        hint: jobsError.hint,
        code: jobsError.code
      })
      
      if (jobsError.code === 'PGRST116') {
        console.error('❌ This is a Row Level Security (RLS) issue')
        console.error('❌ The user does not have permission to access the jobs table')
      }
      
      if (jobsError.code === '42P01') {
        console.error('❌ The jobs table does not exist')
        console.error('❌ Please run the database migrations')
      }
      
      return
    }
    console.log('✅ Jobs table access successful')

    // Test 3: Check jobs data
    console.log('\n🔍 Test 3: Check jobs data...')
    const { data: actualJobs, error: actualJobsError } = await supabase
      .from('jobs')
      .select('invoice_number, customer_name, date_recorded')
      .limit(5)
    
    if (actualJobsError) {
      console.error('❌ Jobs data access failed:', actualJobsError)
      return
    }
    
    console.log('✅ Jobs data access successful')
    console.log('📊 Number of jobs found:', actualJobs?.length || 0)
    
    if (actualJobs && actualJobs.length > 0) {
      console.log('📊 Sample jobs:')
      actualJobs.forEach((job: any, index: number) => {
        console.log(`  Job ${index + 1}:`, {
          invoice: job.invoice_number,
          customer: job.customer_name,
          date: job.date_recorded
        })
      })
      
      // Check for NULL invoice numbers
      const nullInvoices = actualJobs.filter((job: any) => job.invoice_number === null)
      console.log(`📊 Jobs with NULL invoice numbers: ${nullInvoices.length}`)
    }

    // Test 4: Check technicians table
    console.log('\n🔍 Test 4: Check technicians table...')
    const { data: techs, error: techsError } = await supabase
      .from('technicians')
      .select('*')
      .limit(5)
    
    if (techsError) {
      console.error('❌ Technicians table access failed:', techsError)
      return
    }
    
    console.log('✅ Technicians table access successful')
    console.log('📊 Number of technicians found:', techs?.length || 0)
    
    if (techs && techs.length > 0) {
      console.log('📊 Sample technicians:')
      techs.forEach((tech: any, index: number) => {
        console.log(`  Tech ${index + 1}:`, {
          code: tech.technician_code,
          name: tech.name,
          email: tech.email,
          role: tech.role
        })
      })
    }

    // Test 5: List all columns in jobs table
    console.log('\n🔍 Test 5: List all columns in jobs table...')
    const { data: columns, error: columnsError } = await supabase.rpc('pg_catalog.pg_table_def', { tablename: 'jobs' })
    if (columnsError || !columns) {
      console.log('Could not use pg_table_def, falling back to information_schema.columns')
      // Fallback: query information_schema.columns
      const { data: infoColumns, error: infoColumnsError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'jobs')
      if (infoColumnsError) {
        console.error('❌ Could not fetch columns:', infoColumnsError)
      } else {
        console.log('📋 jobs table columns:')
        infoColumns.forEach((col: any) => {
          console.log(`- ${col.column_name} (${col.data_type})${col.is_nullable === 'NO' ? ' NOT NULL' : ''}${col.column_default ? ' DEFAULT ' + col.column_default : ''}`)
        })
      }
    } else {
      console.log('📋 jobs table columns:')
      columns.forEach((col: any) => {
        console.log(`- ${col.column}`)
      })
    }

    console.log('\n🎉 Database diagnosis completed successfully!')
    
  } catch (error) {
    console.error('❌ Unexpected error during diagnosis:', error)
  }
}

diagnoseDatabase().catch(console.error) 