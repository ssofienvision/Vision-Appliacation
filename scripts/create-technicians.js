const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Create Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This should be in your .env.local file
)

const technicians = [
  { email: 'sofien.smaali@gmail.com', name: 'Sofien Smaali' },
  { email: 'thesalmamokni@gmail.com', name: 'Salma Mokni' },
  { email: 'khlil.mjb@gmail.com', name: 'Kal Majdoub' },
  { email: 'lamjed76@gmail.com', name: 'Jed Sbai' },
  { email: 'Mekki.kmk@gmail.com', name: 'Khaled Makki' },
  { email: 'shoaibnazira2222@gmail.com', name: 'Shoaib B' },
  { email: 'bargaoui1984@gmail.com', name: 'Seif Bargaoui' },
  { email: 'katrouaymen@gmail.com', name: 'Aymen Katrou' },
  { email: 'anajibakrami@gmail.com', name: 'Abdul Akrami' },
  { email: 'ged798@gmail.com', name: 'Gideon Tesfai' },
  { email: 'fehmiraafet@gmail.com', name: 'Raafet Fehmi' },
  { email: 'tesfaisimon12@gmail.com', name: 'Simon Tesfai' }
]

async function createUsers() {
  console.log('Starting user creation process...')
  
  for (const tech of technicians) {
    try {
      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: tech.email,
        password: 'TempPassword123!', // They should change this
        email_confirm: true
      })
      
      if (authError) {
        console.error(`❌ Error creating auth user for ${tech.name}:`, authError.message)
        continue
      }
      
      console.log(`✅ Created auth user for ${tech.name} (${tech.email})`)
      
      // Create technician record in technicians table
      const technicianCode = tech.name.toLowerCase().replace(/\s+/g, '_')
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .insert({
          technician_code: technicianCode,
          name: tech.name,
          email: tech.email,
          role: 'technician',
          is_active: true
        })
        .select()
      
      if (techError) {
        console.error(`❌ Error creating technician record for ${tech.name}:`, techError.message)
      } else {
        console.log(`✅ Created technician record for ${tech.name}`)
      }
      
    } catch (error) {
      console.error(`❌ Unexpected error for ${tech.name}:`, error.message)
    }
  }
  
  console.log('User creation process completed!')
}

// Check if service role key is available
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in environment variables')
  console.log('Please add your Supabase service role key to .env.local file')
  process.exit(1)
}

createUsers().catch(console.error) 