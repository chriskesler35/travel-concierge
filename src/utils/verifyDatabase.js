import { supabase } from '@/lib/supabase';

export async function verifyDatabaseSetup() {
  console.log('🔍 Verifying Supabase Database Setup...\n');
  
  const results = {
    tables: {},
    sampleData: {},
    errors: []
  };

  // Tables to check
  const requiredTables = [
    'journeys',
    'feedback', 
    'discount_codes',
    'user_usage_stats',
    'airports',
    'conversation_history',
    'file_uploads'
  ];

  // Check each table exists
  for (const table of requiredTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        results.tables[table] = '❌ Error: ' + error.message;
        results.errors.push(`Table ${table}: ${error.message}`);
      } else {
        results.tables[table] = '✅ Exists';
      }
    } catch (err) {
      results.tables[table] = '❌ Failed';
      results.errors.push(`Table ${table}: ${err.message}`);
    }
  }

  // Check sample data
  try {
    const { data: airports, error: airportError } = await supabase
      .from('airports')
      .select('*')
      .limit(3);
    
    if (!airportError && airports) {
      results.sampleData.airports = `✅ ${airports.length} airports found`;
    } else {
      results.sampleData.airports = '❌ No airports found';
    }
  } catch (err) {
    results.sampleData.airports = '❌ Error checking airports';
  }

  try {
    const { data: codes, error: codeError } = await supabase
      .from('discount_codes')
      .select('*')
      .limit(3);
    
    if (!codeError && codes) {
      results.sampleData.discountCodes = `✅ ${codes.length} discount codes found`;
    } else {
      results.sampleData.discountCodes = '❌ No discount codes found';
    }
  } catch (err) {
    results.sampleData.discountCodes = '❌ Error checking discount codes';
  }

  // Print results
  console.log('📋 TABLE STATUS:');
  Object.entries(results.tables).forEach(([table, status]) => {
    console.log(`   ${table}: ${status}`);
  });

  console.log('\n📊 SAMPLE DATA:');
  Object.entries(results.sampleData).forEach(([data, status]) => {
    console.log(`   ${data}: ${status}`);
  });

  if (results.errors.length > 0) {
    console.log('\n⚠️ ERRORS FOUND:');
    results.errors.forEach(error => {
      console.log(`   - ${error}`);
    });
  } else {
    console.log('\n✅ Database setup verified successfully!');
  }

  return results;
}

// Export for use in components
export default verifyDatabaseSetup;