-- Migration script to add parts_ordered_by column to part_cost_requests table
-- This tracks whether parts were ordered by technician or office for payout calculations

-- Add parts_ordered_by column if it doesn't exist
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

-- Update existing records to have default value
UPDATE part_cost_requests 
SET parts_ordered_by = 'technician' 
WHERE parts_ordered_by IS NULL;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_part_cost_requests_parts_ordered_by 
ON part_cost_requests(parts_ordered_by);

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'part_cost_requests' 
AND column_name = 'parts_ordered_by'; 