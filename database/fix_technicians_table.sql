-- First, let's see what the current technicians table structure looks like
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'technicians'
ORDER BY ordinal_position;

-- Check if technicians table exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'technicians') THEN
        RAISE NOTICE 'Creating technicians table...';
        
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
        
        ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
        
        CREATE POLICY "Users can view technicians" ON technicians
            FOR SELECT USING (true);
            
        RAISE NOTICE 'Technicians table created successfully.';
    ELSE
        RAISE NOTICE 'Technicians table exists. Checking structure...';
        
        -- Check if id column exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'id') THEN
            RAISE NOTICE 'Adding id column to technicians table...';
            
            -- First, let's see what the current primary key is
            IF EXISTS (SELECT FROM information_schema.table_constraints WHERE table_name = 'technicians' AND constraint_type = 'PRIMARY KEY') THEN
                -- Drop existing primary key constraint
                EXECUTE 'ALTER TABLE technicians DROP CONSTRAINT ' || 
                    (SELECT constraint_name FROM information_schema.table_constraints 
                     WHERE table_name = 'technicians' AND constraint_type = 'PRIMARY KEY');
            END IF;
            
            -- Add id column
            ALTER TABLE technicians ADD COLUMN id SERIAL;
            
            -- Make id the primary key
            ALTER TABLE technicians ADD PRIMARY KEY (id);
            
            RAISE NOTICE 'Id column added and set as primary key.';
        ELSE
            RAISE NOTICE 'Id column already exists.';
        END IF;
        
        -- Add other missing columns
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'role') THEN
            ALTER TABLE technicians ADD COLUMN role VARCHAR(20) DEFAULT 'technician';
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'is_active') THEN
            ALTER TABLE technicians ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'created_at') THEN
            ALTER TABLE technicians ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'updated_at') THEN
            ALTER TABLE technicians ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        END IF;
        
        -- Enable RLS if not already enabled
        IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'technicians' AND rowsecurity = true) THEN
            ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
        END IF;
        
        -- Create basic policy if it doesn't exist
        IF NOT EXISTS (SELECT FROM pg_policies WHERE tablename = 'technicians' AND policyname = 'Users can view technicians') THEN
            CREATE POLICY "Users can view technicians" ON technicians
                FOR SELECT USING (true);
        END IF;
    END IF;
END $$;

-- Show the final structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'technicians'
ORDER BY ordinal_position; 