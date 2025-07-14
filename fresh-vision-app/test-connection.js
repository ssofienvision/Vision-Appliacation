require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Anon Key in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .limit(1);
    if (error) {
      throw error;
    }
    console.log('Connection successful! Sample data:', data);
  } catch (err) {
    console.error('Connection failed:', err.message || err);
    process.exit(1);
  }
}

testConnection(); 