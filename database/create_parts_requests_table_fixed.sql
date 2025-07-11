-- Create parts_requests table for parts inventory (Fixed version)
CREATE TABLE IF NOT EXISTS parts_requests (
    id SERIAL PRIMARY KEY,
    sd_invoice_number VARCHAR(20),
    request_id INTEGER,
    requested_qty INTEGER DEFAULT 1,
    requested_date DATE,
    requesting_tech VARCHAR(10),
    customer_name VARCHAR(200),
    machine_type VARCHAR(100),
    machine_make VARCHAR(50),
    machine_model VARCHAR(50),
    machine_serial VARCHAR(100),
    part_description TEXT,
    request_instructions TEXT,
    request_notes TEXT,
    part_number VARCHAR(100),
    vendor VARCHAR(100),
    vendor_inquiry_date DATE,
    contact_person VARCHAR(100),
    contact_method VARCHAR(50),
    quoted_wholesale DECIMAL(10,2),
    quoted_retail DECIMAL(10,2),
    availability VARCHAR(100),
    order_instructions TEXT,
    po_number VARCHAR(50),
    date_order_confirmed DATE,
    date_shipment_expected DATE,
    date_received DATE,
    invoice_cost DECIMAL(10,2),
    purchase_invoice_number VARCHAR(50),
    sell_for_price DECIMAL(10,2),
    hold_location VARCHAR(100),
    purchase_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE parts_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for parts_requests table
CREATE POLICY "Technicians can view own parts requests" ON parts_requests
    FOR SELECT USING (
        requesting_tech = (
            SELECT technician_code 
            FROM technicians 
            WHERE email = auth.email()
        )
    );

CREATE POLICY "Admins can view all parts requests" ON parts_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM technicians 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can insert parts requests" ON parts_requests
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM technicians 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update parts requests" ON parts_requests
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM technicians 
            WHERE email = auth.email() 
            AND role = 'admin'
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_parts_requests_sd_invoice_number ON parts_requests(sd_invoice_number);
CREATE INDEX idx_parts_requests_requesting_tech ON parts_requests(requesting_tech);
CREATE INDEX idx_parts_requests_requested_date ON parts_requests(requested_date);
CREATE INDEX idx_parts_requests_customer_name ON parts_requests(customer_name);

-- Create an index on jobs invoice_number for better join performance
CREATE INDEX IF NOT EXISTS idx_jobs_invoice_number ON jobs(invoice_number);

-- Show the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'parts_requests' 
ORDER BY ordinal_position; 