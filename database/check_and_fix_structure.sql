-- Script to check and fix database structure issues

-- First, let's check if the technicians table exists and has the correct structure
DO $$
BEGIN
    -- Check if technicians table exists
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'technicians') THEN
        RAISE NOTICE 'Technicians table does not exist. Creating it...';
        
        CREATE TABLE technicians (
            id SERIAL PRIMARY KEY,
            technician_code VARCHAR(10) UNIQUE NOT NULL,
            name VARCHAR(200),
            email VARCHAR(255) UNIQUE,
            role VARCHAR(20) DEFAULT 'technician',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- Enable RLS
        ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
        
        -- Create basic policy
        CREATE POLICY "Users can view technicians" ON technicians
            FOR SELECT USING (true);
            
        RAISE NOTICE 'Technicians table created successfully.';
    ELSE
        RAISE NOTICE 'Technicians table already exists.';
        
        -- Check if id column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'id') THEN
            RAISE NOTICE 'Adding id column to technicians table...';
            ALTER TABLE technicians ADD COLUMN id SERIAL PRIMARY KEY;
        ELSE
            RAISE NOTICE 'Technicians table has id column.';
        END IF;
        
        -- Check if other required columns exist
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'role') THEN
            RAISE NOTICE 'Adding role column to technicians table...';
            ALTER TABLE technicians ADD COLUMN role VARCHAR(20) DEFAULT 'technician';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'is_active') THEN
            RAISE NOTICE 'Adding is_active column to technicians table...';
            ALTER TABLE technicians ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'created_at') THEN
            RAISE NOTICE 'Adding created_at column to technicians table...';
            ALTER TABLE technicians ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'updated_at') THEN
            RAISE NOTICE 'Adding updated_at column to technicians table...';
            ALTER TABLE technicians ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
    END IF;
END $$;

-- Check if jobs table has parts_cost column
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'parts_cost') THEN
        RAISE NOTICE 'Adding parts_cost column to jobs table...';
        ALTER TABLE jobs ADD COLUMN parts_cost DECIMAL(10,2) DEFAULT 0;
    ELSE
        RAISE NOTICE 'Jobs table already has parts_cost column.';
    END IF;
END $$;

-- Show current table structures
SELECT 
    table_name, 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('technicians', 'jobs', 'part_cost_requests')
ORDER BY table_name, ordinal_position; 