import { createClient } from '@supabase/supabase-js'

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing required environment variables')
  console.log('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey)

async function createAdminUser(): Promise<void> {
  console.log('Starting admin user creation process...')
  
  const adminEmail = 'sofien.smaali@gmail.com' // Change this to your email
  const adminPassword = 'AdminPassword123!' // Change this to a secure password
  
  try {
    // Check if user already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser.users.find(user => user.email === adminEmail)
    
    if (userExists) {
      console.log(`✅ User ${adminEmail} already exists in auth`)
    } else {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true
      })
      
      if (authError) {
        console.error(`❌ Error creating auth user:`, authError.message)
        return
      }
      
      console.log(`✅ Created auth user for ${adminEmail}`)
    }
    
    // Check if technician record exists
    const { data: existingTech } = await supabase
      .from('technicians')
      .select('*')
      .eq('email', adminEmail)
      .single()
    
    if (existingTech) {
      // Update existing technician to admin role
      const { error: updateError } = await supabase
        .from('technicians')
        .update({ role: 'admin' })
        .eq('email', adminEmail)
      
      if (updateError) {
        console.error(`❌ Error updating technician to admin:`, updateError.message)
        return
      }
      
      console.log(`✅ Updated ${adminEmail} to admin role`)
    } else {
      // Create new technician record with admin role
      const { error: insertError } = await supabase
        .from('technicians')
        .insert({
          technician_code: 'ADMIN',
          name: 'Admin User',
          email: adminEmail,
          role: 'admin',
          is_active: true
        })
      
      if (insertError) {
        console.error(`❌ Error creating admin technician record:`, insertError.message)
        return
      }
      
      console.log(`✅ Created admin technician record for ${adminEmail}`)
    }
    
    console.log('🎉 Admin user creation completed successfully!')
    console.log(`📧 Email: ${adminEmail}`)
    console.log(`🔑 Password: ${adminPassword}`)
    console.log('⚠️  Please change the password after first login!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error instanceof Error ? error.message : 'Unknown error')
  }
}

createAdminUser().catch(console.error) 