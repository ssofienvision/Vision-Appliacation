'use client'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faBriefcase, faDollarSign, faWrench, faChartBar, faUsers, faBoxes } from '@fortawesome/free-solid-svg-icons';
import { useRouter, usePathname } from 'next/navigation';

interface SidebarProps {
  userRole?: string;
}

export default function Sidebar({ userRole = 'technician' }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: faChartLine, path: '/dashboard' },
    { id: 'tech-dashboard', label: 'Dashboard', icon: faChartLine, path: '/tech-dashboard' },
    { id: 'jobs', label: 'Jobs', icon: faBriefcase, path: '/jobs' },
    { id: 'parts', label: 'Parts Inventory', icon: faBoxes, path: '/parts' },
    { id: 'analytics', label: 'Analytics', icon: faChartBar, path: '/analytics' },
    { id: 'appliances', label: 'Appliances', icon: faWrench, path: '/appliances' },
    { id: 'clients', label: 'Clients', icon: faUsers, path: '/clients' },
    { id: 'payout', label: 'Payout', icon: faDollarSign, path: '/payout' },
  ];

  // Filter nav items based on user role
  const getFilteredNavItems = () => {
    if (userRole === 'admin') {
      // Admins see all pages except tech-dashboard
      return navItems.filter(item => item.id !== 'tech-dashboard');
    } else {
      // Technicians see limited pages (no analytics, no clients, no main dashboard)
      return navItems.filter(item => 
        item.id !== 'analytics' && 
        item.id !== 'clients' && 
        item.id !== 'dashboard'
      );
    }
  };

  const filteredNavItems = getFilteredNavItems();

  const handleNavigation = (item: any) => {
    router.push(item.path);
  };

  const isActive = (item: any) => {
    return pathname === item.path;
  };

  return (
    <div className="w-64 bg-white shadow-lg fixed h-full z-20 hidden lg:block">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">
          {userRole === 'admin' ? 'Admin Dashboard' : 'Tech Dashboard'}
        </h2>
        <p className="text-sm text-gray-500">
          {userRole === 'admin' ? 'Administrative Portal' : 'Field Technician Portal'}
        </p>
      </div>
      <nav className="mt-6 px-4">
        {filteredNavItems.map((item) => (
          <span
            key={item.id}
            className={`nav-item flex items-center px-4 py-3 mb-2 rounded-lg cursor-pointer transition-colors ${
              isActive(item)
                ? 'text-blue-600 bg-blue-50'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            }`}
            onClick={() => handleNavigation(item)}
          >
            <FontAwesomeIcon icon={item.icon} className="mr-3" />
            {item.label}
          </span>
        ))}
      </nav>
    </div>
  );
} 