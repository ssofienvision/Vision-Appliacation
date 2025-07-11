import { supabase } from '../src/lib/supabase'

async function runMigration() {
  console.log('Running migration to add parts_ordered_by column...')
  
  try {
    // Add parts_ordered_by column if it doesn't exist
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT FROM information_schema.columns 
                WHERE table_name = 'part_cost_requests' 
                AND column_name = 'parts_ordered_by'
            ) THEN
                ALTER TABLE part_cost_requests 
                ADD COLUMN parts_ordered_by VARCHAR(20) DEFAULT 'technician' CHECK (parts_ordered_by IN ('technician', 'office'));
                
                RAISE NOTICE 'Added parts_ordered_by column to part_cost_requests table';
            ELSE
                RAISE NOTICE 'parts_ordered_by column already exists in part_cost_requests table';
            END IF;
        END $$;
      `
    })

    if (alterError) {
      console.error('Error adding column:', alterError)
      return
    }

    // Update existing records to have default value
    const { error: updateError } = await supabase
      .from('part_cost_requests')
      .update({ parts_ordered_by: 'technician' })
      .is('parts_ordered_by', null)

    if (updateError) {
      console.error('Error updating existing records:', updateError)
    } else {
      console.log('Updated existing records with default value')
    }

    console.log('Migration completed successfully!')
  } catch (error) {
    console.error('Migration failed:', error)
  }
}

runMigration() 