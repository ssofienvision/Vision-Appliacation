# Database Migration Guide for Part Cost Requests

## Step 1: Fix Database Structure Issues

First, run the structure check and fix script:

```sql
-- Copy and paste the contents of database/check_and_fix_structure.sql
-- This will check and fix any issues with the technicians table
```

## Step 2: Add Part Cost Requests Functionality

After the structure is fixed, run the part cost requests migration:

```sql
-- Copy and paste the contents of database/migration_part_cost_requests.sql
-- This will add the new part_cost_requests table and related functionality
```

## Step 3: Verify the Migration

Run this query to verify everything is set up correctly:

```sql
-- Check if all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_name IN ('jobs', 'technicians', 'part_cost_requests');

-- Check if all required columns exist
SELECT 
    table_name, 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name IN ('jobs', 'technicians', 'part_cost_requests')
    AND column_name IN ('id', 'parts_cost', 'technician_id', 'status')
ORDER BY table_name, column_name;

-- Check if policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename = 'part_cost_requests';
```

## Step 4: Test the Setup

### Test Technician Flow:
1. Log in as a technician
2. Go to Jobs page
3. Click "Edit Job" on any job
4. Change part cost and add notes
5. Submit request

### Test Admin Flow:
1. Log in as admin
2. Go to `/admin/part-requests`
3. Review pending requests
4. Approve or reject requests

## Troubleshooting

### If you get "column does not exist" errors:

1. **Check if technicians table exists:**
```sql
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'technicians'
);
```

2. **If it doesn't exist, create it:**
```sql
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
CREATE POLICY "Users can view technicians" ON technicians FOR SELECT USING (true);
```

3. **Add some test data:**
```sql
INSERT INTO technicians (technician_code, name, email, role) VALUES
('TECH001', 'John Doe', 'john@example.com', 'technician'),
('ADMIN001', 'Admin User', 'admin@example.com', 'admin');
```

### If you get RLS policy errors:

The policies reference `auth.email()` which requires Supabase Auth. If you're not using Supabase Auth, you'll need to modify the policies or disable RLS temporarily for testing.

## Common Issues and Solutions

1. **"column id referenced in foreign key constraint does not exist"**
   - Run the `check_and_fix_structure.sql` script first
   - Make sure the technicians table has an `id` column

2. **"relation part_cost_requests does not exist"**
   - Run the `migration_part_cost_requests.sql` script
   - Check that the table was created successfully

3. **"function update_job_parts_cost() does not exist"**
   - The function should be created by the migration script
   - If not, run the function creation part of the migration manually

4. **RLS policy errors**
   - Make sure you're logged in with Supabase Auth
   - Check that the user exists in the technicians table
   - Verify the email matches between auth and technicians table 