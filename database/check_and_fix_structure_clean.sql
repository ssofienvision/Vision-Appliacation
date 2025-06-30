DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'technicians') THEN
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
    ELSE
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'technicians' AND column_name = 'id') THEN
            ALTER TABLE technicians ADD COLUMN id SERIAL PRIMARY KEY;
        END IF;
        
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
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'parts_cost') THEN
        ALTER TABLE jobs ADD COLUMN parts_cost DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$; 