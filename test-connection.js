require('dotenv').config({ path: '.env.local' });

const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing Supabase Connection...\n');

// Check environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('Environment Variables:');
console.log('✅ Supabase URL:', supabaseUrl ? 'Set' : '❌ Missing');
console.log('✅ Supabase Anon Key:', supabaseAnonKey ? 'Set' : '❌ Missing');
console.log('');

if (!supabaseUrl || !supabaseAnonKey) {
  console.log('❌ Missing required environment variables!');
  console.log('Please check your .env.local file.');
  process.exit(1);
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test connection
async function testConnection() {
  try {
    console.log('🔗 Testing database connection...');
    
    // First, let's try to get table information
    console.log('📋 Checking available tables...');
    
    // Try to fetch from jobs table without specifying columns
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    
    if (jobsError) {
      console.log('❌ Jobs table error:');
      console.log('Error:', jobsError.message);
      console.log('Code:', jobsError.code);
    } else {
      console.log('✅ Jobs table accessible');
      console.log('📊 Jobs columns:', jobsData && jobsData.length > 0 ? Object.keys(jobsData[0]) : 'No data');
    }
    
    // Try technicians table
    const { data: techData, error: techError } = await supabase
      .from('technicians')
      .select('*')
      .limit(1);
    
    if (techError) {
      console.log('❌ Technicians table error:');
      console.log('Error:', techError.message);
      console.log('Code:', techError.code);
    } else {
      console.log('✅ Technicians table accessible');
      console.log('📊 Technicians columns:', techData && techData.length > 0 ? Object.keys(techData[0]) : 'No data');
    }
    
  } catch (err) {
    console.log('❌ Connection test failed:');
    console.log('Error:', err.message);
  }
}

testConnection(); 