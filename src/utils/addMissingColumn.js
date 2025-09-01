// Utility script to add missing estimated_drive_time column
// Run this by importing and calling in a React component temporarily

import { supabase } from '@/lib/supabase';

export async function addEstimatedDriveTimeColumn() {
  try {
    console.log('Adding estimated_drive_time column to journeys table...');
    
    const { data, error } = await supabase.rpc('add_column_if_not_exists', {
      table_name: 'journeys',
      column_name: 'estimated_drive_time',
      column_type: 'INTEGER'
    });
    
    if (error) {
      // If the RPC doesn't exist, try direct SQL
      console.log('RPC not available, trying direct SQL...');
      
      const { data: sqlData, error: sqlError } = await supabase
        .from('journeys')
        .select('estimated_drive_time')
        .limit(1);
      
      if (sqlError && sqlError.message.includes('does not exist')) {
        console.error('Column does not exist and cannot be added programmatically.');
        console.error('Please run this SQL in Supabase SQL Editor:');
        console.error('ALTER TABLE journeys ADD COLUMN IF NOT EXISTS estimated_drive_time INTEGER;');
        return false;
      } else {
        console.log('Column already exists!');
        return true;
      }
    }
    
    console.log('Column added successfully!');
    return true;
    
  } catch (error) {
    console.error('Error adding column:', error);
    return false;
  }
}