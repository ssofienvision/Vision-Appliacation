# Vision Application - Service Management Dashboard

A comprehensive service management dashboard built with Next.js, TypeScript, Tailwind CSS, and Supabase. This application provides tools for managing technician jobs, tracking performance, and analyzing business metrics.

## Features

### 🔐 Authentication & Authorization
- Secure login system with Supabase Auth
- Role-based access control (Admin/Technician)
- Automatic session management

### 📊 Dashboard
- Real-time KPI metrics
- Interactive charts and visualizations
- Date range filtering
- Technician-specific views for non-admin users

### 🛠️ Job Management
- Comprehensive job tracking
- Customer information management
- Parts and labor cost tracking
- Invoice management
- OEM client identification

### 👥 Technician Management
- Technician profiles and performance tracking
- Role-based permissions
- Sales and job statistics per technician

### 📈 Analytics
- Sales over time analysis
- Service call percentage tracking
- Job type performance analysis
- Appliance type and brand insights

### 📱 Responsive Design
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interface

## Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Charts**: Custom chart components with D3.js
- **Icons**: Lucide React
- **State Management**: React hooks and context

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Vision-Appliacation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.local.template .env.local
   ```
   
   Fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
   ```

4. **Set up the database**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor
   - Run the contents of `database/schema.sql`
   - This will create all necessary tables, views, and policies

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

#### `technicians`
- `technician_code` (Primary Key)
- `name`
- `email`
- `role` (admin/technician)
- `created_at`
- `updated_at`

#### `jobs`
- `id` (Primary Key)
- `customer_name`
- `total_amount`
- `date_recorded`
- `technician` (Foreign Key to technicians.technician_code)
- `type_serviced`
- `make_serviced`
- `invoice_number`
- `parts_cost`
- `is_oem_client`
- `created_at`
- `updated_at`

### Views

#### `job_metrics`
Aggregated monthly metrics for dashboard analytics.

### Row Level Security (RLS)

- Technicians can only view their own jobs
- Admins can view all data
- Public read access to technician profiles

## Demo Credentials

For testing purposes, you can use these demo accounts:

- **Admin**: `admin@example.com` / `password123`
- **Technician**: `tech1@example.com` / `password123`

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── analytics/         # Analytics page
│   ├── appliances/        # Appliance analysis page
│   ├── dashboard/         # Main dashboard
│   ├── jobs/             # Jobs management page
│   ├── login/            # Authentication page
│   └── layout.tsx        # Root layout
├── components/           # Reusable components
│   ├── charts/          # Chart components
│   ├── ui/              # UI components
│   └── ...              # Other components
├── hooks/               # Custom React hooks
├── lib/                 # Utilities and configurations
│   ├── database.ts      # Database service layer
│   ├── supabase.ts      # Supabase client
│   └── utils.ts         # Utility functions
└── types/               # TypeScript type definitions
```

## Key Components

### Dashboard Components
- `KPIDashboard`: Displays key performance indicators
- `DateFilter`: Time period selection
- `TechnicianFilter`: Technician selection (admin only)
- `MobileNav`: Mobile navigation tabs

### Chart Components
- `SalesOverTimeChart`: Monthly sales trends
- `ServiceCallPieChart`: Service call percentage
- `JobTypeSalesChart`: Job type performance

### Data Components
- `JobList`: Sortable and searchable job table
- `PayoutCalculator`: Technician payout calculations

## API Endpoints

The application uses Supabase's built-in API with the following main operations:

### Jobs
- `GET /jobs` - Fetch jobs with filters
- `GET /job_metrics` - Get aggregated metrics

### Technicians
- `GET /technicians` - Fetch all technicians
- `GET /technicians?email=eq.{email}` - Get current user

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Other Platforms

The application can be deployed to any platform that supports Next.js:
- Netlify
- Railway
- DigitalOcean App Platform
- AWS Amplify

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation in the code comments
- Review the Supabase documentation for backend questions

## Roadmap

- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Advanced reporting
- [ ] Integration with accounting software
- [ ] Customer portal
- [ ] Scheduling system
- [ ] Inventory management