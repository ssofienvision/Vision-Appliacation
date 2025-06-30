-- Add parts_cost column to jobs table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'parts_cost') THEN
        ALTER TABLE jobs ADD COLUMN parts_cost DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Create part cost requests table
CREATE TABLE IF NOT EXISTS part_cost_requests (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL,
    technician_id VARCHAR(50) NOT NULL,
    current_parts_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    requested_parts_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
    notes TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    admin_notes TEXT,
    approved_by VARCHAR(50),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint to jobs table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'part_cost_requests_job_id_fkey'
    ) THEN
        ALTER TABLE part_cost_requests 
        ADD CONSTRAINT part_cost_requests_job_id_fkey 
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE part_cost_requests ENABLE ROW LEVEL SECURITY;

-- Create policies (simplified without auth.email() for now)
CREATE POLICY "Allow all operations for now" ON part_cost_requests
    FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_part_cost_requests_job_id ON part_cost_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_part_cost_requests_technician_id ON part_cost_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_part_cost_requests_status ON part_cost_requests(status);

-- Function to update job parts cost when request is approved
CREATE OR REPLACE FUNCTION update_job_parts_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        UPDATE jobs 
        SET 
            parts_cost = NEW.requested_parts_cost,
            total_amount = total_amount - OLD.current_parts_cost + NEW.requested_parts_cost,
            updated_at = NOW()
        WHERE id = NEW.job_id;
        
        NEW.approved_at = NOW();
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_job_parts_cost ON part_cost_requests;
CREATE TRIGGER trigger_update_job_parts_cost
    AFTER UPDATE ON part_cost_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_job_parts_cost(); 