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

async function createTestUser() {
  console.log('🔍 Creating test user for immediate login...')
  
  const testEmail = 'test@vision-app.com'
  const testPassword = 'TestPassword123!'
  
  try {
    // Check if test user already exists
    console.log(`\n🔍 Checking if test user exists: ${testEmail}`)
    const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (listError) {
      console.error('❌ Error listing users:', listError)
      return
    }
    
    const existingUser = users?.find(user => user.email === testEmail)
    
    if (existingUser) {
      console.log('✅ Test user already exists')
      console.log(`   User ID: ${existingUser.id}`)
      console.log(`   Email confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`)
      
      // Try to update the password
      console.log('\n🔍 Updating password for existing test user...')
      const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        existingUser.id,
        { password: testPassword }
      )
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError)
      } else {
        console.log('✅ Password updated successfully')
      }
    } else {
      // Create new test user
      console.log('\n🔍 Creating new test user...')
      const { data: createData, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true
      })
      
      if (createError) {
        console.error('❌ Error creating test user:', createError)
        return
      }
      
      console.log('✅ Test user created successfully')
      console.log(`   User ID: ${createData.user?.id}`)
    }
    
    // Add test user to technicians table
    console.log('\n🔍 Adding test user to technicians table...')
    const { data: techData, error: techError } = await supabaseAdmin
      .from('technicians')
      .upsert({
        technician_code: 'TEST',
        name: 'Test User',
        email: testEmail,
        role: 'admin',
        is_active: true
      }, { onConflict: 'email' })
    
    if (techError) {
      console.error('❌ Error adding to technicians table:', techError)
    } else {
      console.log('✅ Test user added to technicians table')
    }
    
    console.log('\n🎉 Test User Setup Complete!')
    console.log('📋 Login Credentials:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Password: ${testPassword}`)
    console.log('\n💡 You can now test login at: http://localhost:3002/login')
    console.log('   This user has admin privileges for testing.')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

createTestUser().catch(console.error) 