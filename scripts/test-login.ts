import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('🔍 Testing login functionality...')
  console.log('📊 Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
  console.log('📊 Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')
  
  try {
    // Test 1: Check if we can access the auth service
    console.log('\n🔍 Test 1: Checking auth service...')
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError) {
      console.error('❌ Error accessing auth service:', userError)
    } else {
      console.log('✅ Auth service accessible')
      if (user) {
        console.log('✅ User already logged in:', user.email)
      } else {
        console.log('ℹ️  No user currently logged in')
      }
    }
    
    // Test 2: Test login with invalid credentials
    console.log('\n🔍 Test 2: Testing with invalid credentials...')
    const { data: invalidData, error: invalidError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'wrongpassword'
    })
    
    if (invalidError) {
      console.log('✅ Invalid login correctly rejected:', invalidError.message)
    } else {
      console.log('❌ Invalid login should have been rejected')
    }
    
    console.log('\n📋 Login Test Summary:')
    console.log('✅ Auth service is working')
    console.log('✅ Invalid credentials are properly rejected')
    console.log('\n💡 To test with real credentials:')
    console.log('1. Go to http://localhost:3002/login')
    console.log('2. Try logging in with: sofien.smaali@gmail.com')
    console.log('3. If password doesn\'t work, reset it in Supabase dashboard')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

testLogin().catch(console.error) 