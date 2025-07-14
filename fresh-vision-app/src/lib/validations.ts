import { z } from 'zod'

// Job validation schemas
export const jobSchema = z.object({
  zip_code_for_job: z.string().min(5, 'Zip code must be at least 5 characters').max(10, 'Zip code must be at most 10 characters').optional(),
  city: z.string().min(1, 'City is required').max(100, 'City must be at most 100 characters').optional(),
  state: z.string().length(2, 'State must be 2 characters').optional(),
  date_recorded: z.string().min(1, 'Date is required').optional(),
  technician: z.string().min(1, 'Technician is required').max(10, 'Technician code must be at most 10 characters'),
  customer_name: z.string().min(1, 'Customer name is required').max(200, 'Customer name must be at most 200 characters').optional(),
  consumer_name_if_not_customer: z.string().max(200, 'Consumer name must be at most 200 characters').optional(),
  invoice_number: z.string().max(20, 'Invoice number must be at most 20 characters').optional(),
  merchandise_sold: z.number().min(0, 'Merchandise sold must be non-negative').optional(),
  parts_sold: z.number().min(0, 'Parts sold must be non-negative').optional(),
  service_call_amount: z.number().min(0, 'Service call amount must be non-negative').optional(),
  other_labor: z.number().min(0, 'Other labor must be non-negative').optional(),
  sales_tax: z.number().min(0, 'Sales tax must be non-negative').optional(),
  total_amount: z.number().min(0, 'Total amount must be non-negative').optional(),
  paycode: z.number().int().optional(),
  dept: z.string().max(10, 'Department must be at most 10 characters').optional(),
  tax_portion1: z.number().min(0, 'Tax portion 1 must be non-negative').optional(),
  tax_portion2: z.number().min(0, 'Tax portion 2 must be non-negative').optional(),
  exempt_materials: z.number().min(0, 'Exempt materials must be non-negative').optional(),
  exempt_labor: z.number().min(0, 'Exempt labor must be non-negative').optional(),
  exempt_total: z.number().min(0, 'Exempt total must be non-negative').optional(),
  other_data: z.string().optional(),
  tax_scheme: z.string().max(50, 'Tax scheme must be at most 50 characters').optional(),
  tax_jurisdiction: z.string().max(50, 'Tax jurisdiction must be at most 50 characters').optional(),
  po_dispatch_id: z.string().max(50, 'PO dispatch ID must be at most 50 characters').optional(),
  merch_cost: z.number().min(0, 'Merchandise cost must be non-negative').optional(),
  parts_cost: z.number().min(0, 'Parts cost must be non-negative').optional(),
  type_serviced: z.string().max(100, 'Type serviced must be at most 100 characters').optional(),
  make_serviced: z.string().max(50, 'Make serviced must be at most 50 characters').optional(),
  tp_money_rcvd: z.string().max(50, 'TP money received must be at most 50 characters').optional(),
  is_oem_client: z.boolean().optional(),
  dt_of_prior_py_cd2_entry: z.string().optional(),
})

export const jobCreateSchema = jobSchema

export const jobUpdateSchema = jobSchema.partial()

// Technician validation schemas
export const technicianSchema = z.object({
  technician_code: z.string().min(1, 'Technician code is required').max(10, 'Technician code must be at most 10 characters'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters').optional(),
  email: z.string().email('Invalid email address').max(255, 'Email must be at most 255 characters').optional(),
  role: z.enum(['technician', 'admin']).default('technician'),
  is_active: z.boolean().default(true),
})

export const technicianCreateSchema = technicianSchema

export const technicianUpdateSchema = technicianSchema.partial()

// Authentication schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  technician_code: z.string().min(1, 'Technician code is required').max(10, 'Technician code must be at most 10 characters'),
  name: z.string().min(1, 'Name is required').max(200, 'Name must be at most 200 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

// Search and filter schemas
export const jobSearchSchema = z.object({
  query: z.string().optional(),
  technician: z.string().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  type_serviced: z.string().optional(),
  make_serviced: z.string().optional(),
  min_amount: z.number().min(0).optional(),
  max_amount: z.number().min(0).optional(),
  is_oem_client: z.boolean().optional(),
})

export const technicianSearchSchema = z.object({
  query: z.string().optional(),
  role: z.enum(['technician', 'admin']).optional(),
  is_active: z.boolean().optional(),
})

// Date range schema
export const dateRangeSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
})

// Export types
export type Job = z.infer<typeof jobSchema>
export type JobCreate = z.infer<typeof jobCreateSchema>
export type JobUpdate = z.infer<typeof jobUpdateSchema>

export type Technician = z.infer<typeof technicianSchema>
export type TechnicianCreate = z.infer<typeof technicianCreateSchema>
export type TechnicianUpdate = z.infer<typeof technicianUpdateSchema>

export type LoginForm = z.infer<typeof loginSchema>
export type RegisterForm = z.infer<typeof registerSchema>

export type JobSearch = z.infer<typeof jobSearchSchema>
export type TechnicianSearch = z.infer<typeof technicianSearchSchema>
export type DateRange = z.infer<typeof dateRangeSchema>
export type Pagination = z.infer<typeof paginationSchema> 