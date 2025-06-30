import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Create admin client with service role key
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function setupAuth() {
  console.log('🔍 Setting up authentication for existing technicians...')
  
  try {
    // Get all technicians from the database
    const { data: technicians, error: fetchError } = await supabaseAdmin
      .from('technicians')
      .select('*')
    
    if (fetchError) {
      console.error('❌ Error fetching technicians:', fetchError)
      return
    }
    
    console.log(`📊 Found ${technicians?.length || 0} technicians in database`)
    
    if (!technicians || technicians.length === 0) {
      console.log('❌ No technicians found in database')
      return
    }
    
    // Check which technicians already have auth accounts
    for (const tech of technicians) {
      if (!tech.email) {
        console.log(`⚠️  Skipping technician ${tech.name} (${tech.technician_code}) - no email`)
        continue
      }
      
      console.log(`\n🔍 Checking auth for: ${tech.email}`)
      
      try {
        // Try to get user by email
        const { data: { users }, error: userError } = await supabaseAdmin.auth.admin.listUsers()
        
        if (userError) {
          console.error(`❌ Error checking user ${tech.email}:`, userError)
          continue
        }
        
        const existingUser = users?.find(user => user.email === tech.email)
        
        if (existingUser) {
          console.log(`✅ User already exists: ${tech.email}`)
          console.log(`   User ID: ${existingUser.id}`)
          console.log(`   Email confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`)
        } else {
          console.log(`❌ No auth account found for: ${tech.email}`)
          console.log(`   You need to create a user account in Supabase Auth for this email`)
          console.log(`   Or use the Supabase dashboard to invite this user`)
        }
        
      } catch (error) {
        console.error(`❌ Error checking auth for ${tech.email}:`, error)
      }
    }
    
    console.log('\n📋 Summary:')
    console.log('To enable login for technicians, you need to:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Navigate to Authentication > Users')
    console.log('3. Click "Invite user" for each technician email')
    console.log('4. Or manually create users with the emails from the technicians table')
    console.log('\nAlternative: Use the Supabase CLI to create users programmatically')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

setupAuth().catch(console.error) 