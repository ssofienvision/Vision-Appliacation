"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { jobsService, technicianService, type Technician, type DashboardMetrics, type SalesData, type JobTypeData } from '@/lib/database';
import Sidebar from '@/components/Sidebar';
import KPIDashboard from '@/components/KPIDashboard';
import DateFilter from '@/components/DateFilter';
import { SalesOverTimeChart, ServiceCallPieChart, JobTypeSalesChart } from '@/components/charts';
import { SalesByStateChart } from '@/components/charts';
import JobList from '@/components/JobList';
import PayoutCalculator from '@/components/PayoutCalculator';
import { LogOut } from 'lucide-react';

export default function TechDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Technician | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('thisMonth');
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalJobs: 0,
    totalSales: 0,
    totalTechnicians: 0,
    avgSalePerJob: 0,
    serviceCallPercentage: 0,
    totalLabor: 0,
    totalParts: 0,
    jobsThisMonth: 0,
    salesThisMonth: 0,
    avgLaborPerJob: 0,
    invoiceCount: 0,
    salesByState: [],
    returnCustomerCount: 0,
    returnCustomerPercentage: 0,
    totalPartProfit: 0,
    avgPartProfit: 0,
    serviceCallCount: 0,
    totalServiceCallSales: 0,
    serviceCallToTotalSalesRatio: 0,
    // Additional metrics
    partsSalesRatio: 0,
    laborSalesRatio: 0,
    totalPayout: 0,
    oemJobsCount: 0,
    nonOemJobsCount: 0,
    oemSales: 0,
    nonOemSales: 0
  });
  const [jobs, setJobs] = useState<any[]>([]);
  const [salesOverTime, setSalesOverTime] = useState<SalesData[]>([]);
  const [jobTypeSummary, setJobTypeSummary] = useState<JobTypeData[]>([]);

  useEffect(() => {
    initializeUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadDashboardData();
    }
  }, [currentUser, selectedPeriod]);

  const initializeUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      const technician = await technicianService.getCurrentTechnician();
      setCurrentUser(technician);
      if (technician?.role === 'admin') {
        router.push('/dashboard');
        return;
      }
    } catch (error) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const dateFilters = getDateFilters();
      const filters: any = { ...dateFilters, technician: currentUser?.technician_code };
      const [metricsData, jobsData, salesData, jobTypeData] = await Promise.all([
        jobsService.getDashboardMetrics(filters),
        jobsService.getJobs(filters), // Remove the 100 limit to get all jobs
        jobsService.getSalesOverTime(filters),
        jobsService.getJobTypeSummary(filters)
      ]);
      setMetrics(metricsData);
      setJobs(jobsData);
      setSalesOverTime(salesData);
      setJobTypeSummary(jobTypeData);
    } catch (error) {
      // handle error
    } finally {
      setLoading(false);
    }
  };

  const getDateFilters = () => {
    const now = new Date();
    let startDate, endDate;
    switch (selectedPeriod) {
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'lastMonth':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case 'thisYear':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      case 'lastYear':
        startDate = new Date(now.getFullYear() - 1, 0, 1);
        endDate = new Date(now.getFullYear() - 1, 11, 31);
        break;
      default:
        return {};
    }
    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar userRole={currentUser?.role} />
      <div className="flex-1 ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-14 sm:h-16">
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Technician Dashboard</h1>
                <p className="text-xs sm:text-sm text-gray-600">
                  Welcome, {currentUser?.name}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 text-xs sm:text-sm text-gray-700 hover:text-gray-900 transition-colors"
              >
                <LogOut className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {/* Only period filter */}
          <div className="mb-4">
            <DateFilter selectedPeriod={selectedPeriod} setSelectedPeriod={setSelectedPeriod} />
          </div>
          {/* Metrics, charts, job list, payout calculator */}
          <KPIDashboard metrics={metrics} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <SalesOverTimeChart data={salesOverTime} />
            <ServiceCallPieChart serviceCallPercentage={metrics.serviceCallPercentage || 0} />
          </div>
          <div className="mt-6">
            <JobTypeSalesChart data={jobTypeSummary} />
          </div>
          <div className="mt-6">
            <SalesByStateChart data={metrics.salesByState || []} />
          </div>
          <div className="mt-6">
            <JobList jobs={jobs} />
          </div>
          <div className="mt-6">
            <PayoutCalculator jobs={jobs} />
          </div>
        </main>
      </div>
    </div>
  );
} 