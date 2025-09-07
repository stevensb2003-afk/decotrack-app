"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import HRDashboard from '@/components/dashboard/hr-dashboard';
import ManagementDashboard from '@/components/dashboard/management-dashboard';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';
import { APIProvider } from '@vis.gl/react-google-maps';

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminView, setAdminView] = useState('overview');

  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'Manager':
        return <ManagementDashboard />;
      case 'admin':
        return <AdminDashboard currentView={adminView} />;
      default:
        return <div>Invalid role or loading...</div>;
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className={`flex min-h-screen w-full bg-muted/40 ${isAdmin ? '' : 'flex-col'}`}>
        {isAdmin && (
          <div className="hidden md:flex">
            <DashboardSidebar onNavigate={setAdminView} />
          </div>
        )}
        <div className={`flex flex-col flex-1 ${isAdmin ? 'overflow-hidden' : ''}`}>
          <DashboardHeader />
          <main className={`flex-1 p-4 sm:p-6 ${isAdmin ? 'overflow-auto' : ''}`}>
            {renderDashboardByRole()}
          </main>
        </div>
      </div>
    </APIProvider>
  );
}
