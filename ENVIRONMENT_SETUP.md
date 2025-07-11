# Environment Setup Guide

## Current Status

The application requires Supabase environment variables to be configured. Without them, you'll see:

- ❌ **Connection errors** in the console
- ❌ **Empty data** in tables and charts  
- ❌ **Application errors** when trying to load data
- ❌ **Authentication failures**

## Setting Up Supabase Database Connection

To connect to a Supabase database:

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 2. Set Environment Variables

Create a `.env.local` file in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Optional: App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Run Database Migrations

Once connected to Supabase, run these SQL scripts in your Supabase SQL editor:

#### Create the base schema:
```sql
-- Run the main schema
-- Copy and paste the contents of database/schema.sql
```

#### Add the new parts_ordered_by column:
```sql
-- Run the migration
-- Copy and paste the contents of database/add_parts_ordered_by_column.sql
```

### 4. Restart the Development Server

```bash
npm run dev
```

## Testing the Approval System

### With Real Database

1. **Create test data**:
   - Use the import functionality to add jobs
   - Create part cost requests through the system
   - Test the full approval workflow

2. **Verify the system**:
   - Check that job parts costs update when requests are approved
   - Verify payout calculations reflect the new data
   - Test the parts ordered by functionality

3. **Test the approval process**:
   - Navigate to Admin → Part Requests
   - Click "Review" on pending requests
   - Select "Parts Ordered By" (Technician/Office)
   - Add admin notes
   - Click "Approve" or "Reject"

4. **Test the payout page**: 
   - Navigate to Payout page
   - See how approved requests affect payout calculations
   - Filter by month
   - View enhanced payout breakdown

## Troubleshooting

### CSS Issues

If CSS appears inconsistent:

1. **Clear browser cache**: Press `Ctrl+F5` (hard refresh)
2. **Check Tailwind**: Ensure Tailwind CSS is compiling properly
3. **Restart dev server**: Stop and restart `npm run dev`

### Part Requests Not Loading

1. **Check console errors**: Open browser dev tools (F12)
2. **Verify environment variables**: Ensure `.env.local` is set up correctly
3. **Check database connection**: Verify Supabase credentials

### Database Connection Issues

1. **Verify Supabase credentials**: Check your project URL and keys
2. **Check RLS policies**: Ensure proper Row Level Security is configured
3. **Run migrations**: Make sure all database tables exist
4. **Check table structure**: Verify the `part_cost_requests` table has the `parts_ordered_by` column

### Authentication Issues

1. **Check Supabase Auth**: Ensure authentication is enabled in your Supabase project
2. **Verify user creation**: Create admin users in the technicians table
3. **Check RLS policies**: Ensure users have proper permissions

## Database Schema

The application requires these main tables:

- **jobs**: Main job records with invoice data
- **technicians**: User accounts and technician information
- **part_cost_requests**: Part cost change requests with approval workflow

Key features:
- **parts_ordered_by**: Tracks whether parts were ordered by technician or office
- **Approval workflow**: Pending → Approved/Rejected with admin notes
- **Payout integration**: Approved requests affect technician payout calculations

## Next Steps

1. **Set up Supabase** project and environment variables
2. **Run migrations** to create the database structure
3. **Create admin users** in the technicians table
4. **Import real data** using the admin import functionality
5. **Test the approval workflow** with real data

The approval system is fully functional and ready for production use! 