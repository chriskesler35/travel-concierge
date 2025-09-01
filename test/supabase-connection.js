// Test Supabase Connection
// Run this with: node test/supabase-connection.js

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vovebfcgnmngmmoiqfci.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvdmViZmNnbm1uZ21tb2lxZmNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2OTQ2NTQsImV4cCI6MjA3MjI3MDY1NH0.xvGIeVdCBptHFBeQiAO7pZ5ux5CHUG-B8ECS7yH7WR4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🧪 Testing Supabase Connection...\n');
  
  try {
    // Test 1: Check if we can connect
    console.log('1️⃣ Testing basic connection...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('airports')
      .select('count', { count: 'exact', head: true });
    
    if (healthError) {
      console.log('❌ Connection failed:', healthError.message);
      return;
    }
    console.log('✅ Connection successful!');
    
    // Test 2: Check if tables exist
    console.log('\n2️⃣ Checking if tables exist...');
    const tables = ['journeys', 'feedback', 'user_usage_stats', 'airports', 'discount_codes'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
        if (error) {
          console.log(`❌ Table '${table}' not found or not accessible`);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' error:`, err.message);
      }
    }
    
    // Test 3: Check sample data
    console.log('\n3️⃣ Checking sample data...');
    const { data: airports, error: airportError } = await supabase
      .from('airports')
      .select('iata_code, name, city')
      .limit(5);
    
    if (airportError) {
      console.log('❌ Could not fetch airports:', airportError.message);
    } else {
      console.log(`✅ Found ${airports.length} sample airports:`);
      airports.forEach(airport => {
        console.log(`   • ${airport.iata_code} - ${airport.name}, ${airport.city}`);
      });
    }
    
    // Test 4: Test authentication (this will fail without login, which is expected)
    console.log('\n4️⃣ Testing authentication state...');
    const { data: user, error: authError } = await supabase.auth.getUser();
    
    if (user.user) {
      console.log('✅ User is authenticated:', user.user.email);
    } else {
      console.log('ℹ️  No user authenticated (this is expected)');
    }
    
    console.log('\n🎉 Connection test completed!');
    
  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
  }
}

// Run the test
testConnection();