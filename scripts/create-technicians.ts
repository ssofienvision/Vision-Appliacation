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

interface Technician {
  technician_code: string
  email: string
  name: string
}

const technicians: Technician[] = [
  { technician_code: 'OF', email: 'sofien.smaali@gmail.com', name: 'Sofien Smaali' },
  { technician_code: '99', email: 'thesalmamokni@gmail.com', name: 'Salma Mokni' },
  { technician_code: '10', email: 'khlil.mjb@gmail.com', name: 'Kal Majdoub' },
  { technician_code: '11', email: 'lamjed76@gmail.com', name: 'Jed Sbai' },
  { technician_code: '12', email: 'Mekki.kmk@gmail.com', name: 'Khaled makki' },
  { technician_code: '13', email: 'shoaibnazira2222@gmail.com', name: 'Shoaib B' },
  { technician_code: '14', email: 'bargaoui1984@gmail.com', name: 'Seif Bargaoui' },
  { technician_code: '15', email: 'katrouaymen@gmail.com', name: 'Aymen Katrou' },
  { technician_code: '16', email: 'anajibakrami@gmail.com', name: 'Abdul Akrami' },
  { technician_code: '17', email: 'ged798@gmail.com', name: 'Gideon Tesfai' },
  { technician_code: '18', email: 'fehmiraafet@gmail.com', name: 'Raafet Fehmi' },
  { technician_code: '20', email: 'tesfaisimon12@gmail.com', name: 'Simon Tesfai' }
]

async function createUsers(): Promise<void> {
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
      const { data: techData, error: techError } = await supabase
        .from('technicians')
        .insert({
          technician_code: tech.technician_code,
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
      console.error(`❌ Unexpected error for ${tech.name}:`, error instanceof Error ? error.message : 'Unknown error')
    }
  }
  
  console.log('User creation process completed!')
}

createUsers().catch(console.error) 