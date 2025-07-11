# Import Fix Guide - Invoice Numbers and Zip Codes

## Issues Identified

1. **Missing Database Table**: The import is trying to use a `parts_requests` table that doesn't exist in the database
2. **Column Mapping Issues**: Invoice numbers and zip codes are showing as null due to poor column name matching
3. **Table Relationship**: Need to ensure `sd_invoice_number` in parts table matches `invoice_number` in jobs table

## Solutions

### 1. Create the Missing Parts Table

Run this SQL in your Supabase SQL editor:

```sql
-- Create parts_requests table for parts inventory
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

-- Create a foreign key relationship between jobs and parts_requests via invoice numbers
-- This will help ensure data integrity
ALTER TABLE parts_requests 
ADD CONSTRAINT fk_parts_requests_jobs_invoice 
FOREIGN KEY (sd_invoice_number) REFERENCES jobs(invoice_number) ON DELETE CASCADE;
```

### 2. Code Changes Made

The import functionality has been improved with:

1. **Better Column Mapping**: Enhanced the `getValue` function to try multiple variations of column names
2. **Debug Logging**: Added console logs to help identify which columns are being found
3. **Comprehensive Invoice Number Matching**: Now tries multiple variations like:
   - `invoice`, `invoicenumber`, `invoice_number`, `invoicenmbr`, `inv`, `invnum`
4. **Comprehensive Zip Code Matching**: Now tries multiple variations like:
   - `zipcode`, `zip_code`, `zipcodeforjob`, `zip`, `postal`, `postalcode`, `postal_code`

### 3. How to Test

1. **Run the SQL script** above in your Supabase SQL editor
2. **Try the import again** at http://localhost:3000/admin/import
3. **Check the browser console** for debug logs that show:
   - All headers found in the spreadsheet
   - Invoice-related headers
   - Zip-related headers
   - Values found for invoice numbers and zip codes

### 4. Expected Results

After these changes:
- Invoice numbers should be properly imported from both jobs and parts sheets
- Zip codes should be properly imported from the jobs sheet
- The `sd_invoice_number` in parts_requests will relate to `invoice_number` in jobs
- You can query related data using the invoice number as the relationship key

### 5. Verification Query

After importing, you can verify the relationship works with this query:

```sql
SELECT 
    j.invoice_number,
    j.customer_name as job_customer,
    p.sd_invoice_number,
    p.customer_name as parts_customer,
    p.part_description
FROM jobs j
LEFT JOIN parts_requests p ON j.invoice_number = p.sd_invoice_number
WHERE j.invoice_number IS NOT NULL
ORDER BY j.invoice_number;
```

## Troubleshooting

If invoice numbers or zip codes are still null:

1. **Check the console logs** to see what headers are actually in your spreadsheet
2. **Verify column names** in your Google Sheets - they might be named differently than expected
3. **Update the column mapping** in the code if needed based on the actual header names

The debug logs will show you exactly what column names are found and what values are being extracted. 