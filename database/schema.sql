-- Create jobs table based on your CSV data structure
CREATE TABLE jobs (
    id SERIAL PRIMARY KEY,
    zip_code_for_job VARCHAR(10),
    city VARCHAR(100),
    state VARCHAR(2),
    date_recorded DATE,
    technician VARCHAR(10),
    customer_name VARCHAR(200),
    consumer_name_if_not_customer VARCHAR(200),
    invoice_number VARCHAR(20),
    merchandise_sold DECIMAL(10,2) DEFAULT 0,
    parts_sold DECIMAL(10,2) DEFAULT 0,
    service_call_amount DECIMAL(10,2) DEFAULT 0,
    other_labor DECIMAL(10,2) DEFAULT 0,
    sales_tax DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) DEFAULT 0,
    paycode INTEGER,
    dept VARCHAR(10),
    tax_portion1 DECIMAL(10,2) DEFAULT 0,
    tax_portion2 DECIMAL(10,2) DEFAULT 0,
    exempt_materials DECIMAL(10,2) DEFAULT 0,
    exempt_labor DECIMAL(10,2) DEFAULT 0,
    exempt_total DECIMAL(10,2) DEFAULT 0,
    other_data TEXT,
    tax_scheme VARCHAR(50),
    tax_jurisdiction VARCHAR(50),
    po_dispatch_id VARCHAR(50),
    merch_cost DECIMAL(10,2) DEFAULT 0,
    parts_cost DECIMAL(10,2) DEFAULT 0,
    type_serviced VARCHAR(100),
    make_serviced VARCHAR(50),
    tp_money_rcvd VARCHAR(50),
    is_oem_client BOOLEAN DEFAULT FALSE,
    dt_of_prior_py_cd2_entry DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create technicians table for user management
CREATE TABLE technicians (
    id SERIAL PRIMARY KEY,
    technician_code VARCHAR(10) UNIQUE NOT NULL,
    name VARCHAR(200),
    email VARCHAR(255) UNIQUE,
    role VARCHAR(20) DEFAULT 'technician', -- 'technician' or 'admin'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create part cost requests table for technician requests
CREATE TABLE part_cost_requests (
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

-- Create RLS policies for data security
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE technicians ENABLE ROW LEVEL SECURITY;
ALTER TABLE part_cost_requests ENABLE ROW LEVEL SECURITY;

-- Policy for technicians to only see their own data
CREATE POLICY "Technicians can view own jobs" ON jobs
    FOR SELECT USING (
        technician = (
            SELECT technician_code 
            FROM technicians 
            WHERE email = auth.email()
        )
    );

-- Policy for admins to see all data
CREATE POLICY "Admins can view all jobs" ON jobs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM technicians 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

-- Policy for technicians table
CREATE POLICY "Users can view technicians" ON technicians
    FOR SELECT USING (true);

-- Policy for part cost requests - technicians can view their own requests
CREATE POLICY "Technicians can view own part cost requests" ON part_cost_requests
    FOR SELECT USING (
        technician_id = (
            SELECT id::VARCHAR 
            FROM technicians 
            WHERE email = auth.email()
        )
    );

-- Policy for part cost requests - admins can view all requests
CREATE POLICY "Admins can view all part cost requests" ON part_cost_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM technicians 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

-- Policy for technicians to insert their own requests
CREATE POLICY "Technicians can insert own part cost requests" ON part_cost_requests
    FOR INSERT WITH CHECK (
        technician_id = (
            SELECT id::VARCHAR 
            FROM technicians 
            WHERE email = auth.email()
        )
    );

-- Policy for admins to update part cost requests
CREATE POLICY "Admins can update part cost requests" ON part_cost_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM technicians 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_jobs_technician ON jobs(technician);
CREATE INDEX idx_jobs_date_recorded ON jobs(date_recorded);
CREATE INDEX idx_jobs_total_amount ON jobs(total_amount);
CREATE INDEX idx_jobs_type_serviced ON jobs(type_serviced);
CREATE INDEX idx_jobs_make_serviced ON jobs(make_serviced);
CREATE INDEX idx_part_cost_requests_job_id ON part_cost_requests(job_id);
CREATE INDEX idx_part_cost_requests_technician_id ON part_cost_requests(technician_id);
CREATE INDEX idx_part_cost_requests_status ON part_cost_requests(status);

-- Create a view for dashboard metrics
CREATE OR REPLACE VIEW job_metrics AS
SELECT 
    technician,
    DATE_TRUNC('month', date_recorded) as month,
    COUNT(*) as total_jobs,
    SUM(total_amount) as total_sales,
    SUM(parts_cost) as total_parts_cost,
    SUM(total_amount - parts_cost) as total_labor,
    AVG(total_amount) as avg_sale_per_job,
    AVG(total_amount - parts_cost) as avg_labor_per_job,
    COUNT(CASE WHEN total_amount IN (74.95, 89.45) THEN 1 END) as service_call_count,
    ROUND(
        COUNT(CASE WHEN total_amount IN (74.95, 89.45) THEN 1 END)::DECIMAL / 
        COUNT(*)::DECIMAL * 100, 2
    ) as service_call_percentage,
    CASE 
        WHEN SUM(total_amount) > 0 THEN
            ROUND(SUM(parts_cost) / SUM(total_amount) * 100, 2)
        ELSE 0 
    END as part_cost_to_sales_ratio,
    CASE 
        WHEN SUM(total_amount) > 0 THEN
            ROUND(SUM(total_amount - parts_cost) / SUM(total_amount) * 100, 2)
        ELSE 0 
    END as labor_to_sales_ratio
FROM jobs 
GROUP BY technician, DATE_TRUNC('month', date_recorded);

-- Function to calculate payout
CREATE OR REPLACE FUNCTION calculate_payout(
    total_sales DECIMAL,
    parts_cost DECIMAL,
    is_oem BOOLEAN
) RETURNS DECIMAL AS $$
BEGIN
    IF is_oem THEN
        RETURN (total_sales - parts_cost) * 0.065 + parts_cost;
    ELSE
        RETURN (total_sales - parts_cost) * 0.5 + parts_cost;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update job parts cost when request is approved
CREATE OR REPLACE FUNCTION update_job_parts_cost()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
        -- Update the job's parts cost
        UPDATE jobs 
        SET 
            parts_cost = NEW.requested_parts_cost,
            total_amount = total_amount - OLD.current_parts_cost + NEW.requested_parts_cost,
            updated_at = NOW()
        WHERE id = NEW.job_id;
        
        -- Update the request with approval details
        NEW.approved_at = NOW();
        NEW.updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update job when part cost request is approved
CREATE TRIGGER trigger_update_job_parts_cost
    AFTER UPDATE ON part_cost_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_job_parts_cost(); 