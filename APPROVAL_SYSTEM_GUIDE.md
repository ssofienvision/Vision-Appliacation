# Part Cost Approval System Guide

## Overview

The Part Cost Approval System allows technicians to request changes to part costs for jobs, and admins to review and approve these changes. The system also tracks whether parts were ordered by the technician or the office, which affects payout calculations.

## Key Features

### 1. Part Cost Requests
- Technicians can submit requests to change part costs for jobs
- Each request includes:
  - Current parts cost
  - Requested parts cost
  - Notes explaining the change
  - Status (pending, approved, rejected)

### 2. Admin Approval Process
- Admins can review all pending part cost requests
- During approval, admins can specify:
  - Whether parts were ordered by technician or office
  - Admin notes explaining the decision
- Once approved, the job's parts cost is automatically updated

### 3. Payout Integration
- Approved part cost changes affect payout calculations
- Parts ordered by technicians are reimbursed in payouts
- Parts ordered by office are not reimbursed
- The system automatically updates job totals when requests are approved

## Database Schema

### part_cost_requests Table
```sql
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
    parts_ordered_by VARCHAR(20) DEFAULT 'technician' CHECK (parts_ordered_by IN ('technician', 'office')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## How to Use

### For Technicians

1. **Submit a Part Cost Request**
   - Navigate to the job details
   - Click "Request Part Cost Change"
   - Enter the current and requested part costs
   - Add notes explaining the change
   - Submit the request

2. **Track Request Status**
   - View pending requests in your dashboard
   - Check approval status and admin notes
   - See updated job totals after approval

### For Admins

1. **Review Pending Requests**
   - Navigate to Admin → Part Requests
   - View all pending part cost change requests
   - See job details, technician info, and cost differences

2. **Approve or Reject Requests**
   - Click "Review" on any pending request
   - Select whether parts were ordered by technician or office
   - Add optional admin notes
   - Click "Approve" or "Reject"

3. **Monitor Approved Requests**
   - View approved requests and their impact on payouts
   - See parts ordered by information
   - Track approval history

## Payout Calculation Logic

### Commission Calculation
- **OEM Jobs**: (Total Sales - Parts Cost) × 6.5% + Parts Cost
- **Non-OEM Jobs**: (Total Sales - Parts Cost) × 50% + Parts Cost

### Parts Reimbursement
- **Technician-Ordered Parts**: Fully reimbursed in payout
- **Office-Ordered Parts**: Not reimbursed (already covered by company)

### Final Payout Formula
```
Total Payout = Commission + Technician-Ordered Parts
```

## Database Migration

To add the new `parts_ordered_by` column to existing databases:

1. **Run the migration script**:
   ```bash
   # Option 1: Run SQL directly in your database
   psql -d your_database -f database/add_parts_ordered_by_column.sql
   
   # Option 2: Use the Node.js script
   npx ts-node scripts/run-migration.ts
   ```

2. **Verify the migration**:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'part_cost_requests' 
   AND column_name = 'parts_ordered_by';
   ```

## Security and Permissions

### Row Level Security (RLS)
- Technicians can only view their own part cost requests
- Admins can view and update all part cost requests
- Jobs are filtered based on technician role

### Access Control
- Only authenticated users can access the system
- Admin functions require admin role
- Technician functions require technician role

## Troubleshooting

### Common Issues

1. **Migration Fails**
   - Ensure you have proper database permissions
   - Check that the part_cost_requests table exists
   - Verify the column doesn't already exist

2. **Payout Calculations Incorrect**
   - Check that part cost requests are approved
   - Verify parts_ordered_by is set correctly
   - Ensure job parts_cost is updated after approval

3. **Requests Not Showing**
   - Check user permissions and role
   - Verify RLS policies are working
   - Ensure requests are in the correct status

### Support

For technical issues or questions about the approval system, please contact the development team or refer to the database logs for detailed error information.

## Future Enhancements

Potential improvements to consider:
- Email notifications for request status changes
- Bulk approval functionality
- Advanced filtering and search
- Audit trail for all changes
- Integration with external parts ordering systems 