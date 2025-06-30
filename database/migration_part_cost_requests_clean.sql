CREATE TABLE IF NOT EXISTS part_cost_requests (
    id SERIAL PRIMARY KEY,
    job_id INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
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

ALTER TABLE part_cost_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'part_cost_requests' AND policyname = 'Technicians can view own part cost requests') THEN
        CREATE POLICY "Technicians can view own part cost requests" ON part_cost_requests
            FOR SELECT USING (
                technician_id = (
                    SELECT id::VARCHAR 
                    FROM technicians 
                    WHERE email = auth.email()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'part_cost_requests' AND policyname = 'Admins can view all part cost requests') THEN
        CREATE POLICY "Admins can view all part cost requests" ON part_cost_requests
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM technicians 
                    WHERE email = auth.email() 
                    AND role = 'admin'
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'part_cost_requests' AND policyname = 'Technicians can insert own part cost requests') THEN
        CREATE POLICY "Technicians can insert own part cost requests" ON part_cost_requests
            FOR INSERT WITH CHECK (
                technician_id = (
                    SELECT id::VARCHAR 
                    FROM technicians 
                    WHERE email = auth.email()
                )
            );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'part_cost_requests' AND policyname = 'Admins can update part cost requests') THEN
        CREATE POLICY "Admins can update part cost requests" ON part_cost_requests
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM technicians 
                    WHERE email = auth.email() 
                    AND role = 'admin'
                )
            );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_part_cost_requests_job_id ON part_cost_requests(job_id);
CREATE INDEX IF NOT EXISTS idx_part_cost_requests_technician_id ON part_cost_requests(technician_id);
CREATE INDEX IF NOT EXISTS idx_part_cost_requests_status ON part_cost_requests(status);

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

DROP TRIGGER IF EXISTS trigger_update_job_parts_cost ON part_cost_requests;
CREATE TRIGGER trigger_update_job_parts_cost
    AFTER UPDATE ON part_cost_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_job_parts_cost(); 