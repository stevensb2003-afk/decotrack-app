"use client";

import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import AdminDashboard from '@/components/dashboard/admin-dashboard';
import EmployeeDashboard from '@/components/dashboard/employee-dashboard';
import HRDashboard from '@/components/dashboard/hr-dashboard';
import ManagementDashboard from '@/components/dashboard/management-dashboard';
import DashboardSidebar from '@/components/dashboard/sidebar';
import DashboardHeader from '@/components/dashboard/header';

export default function DashboardPage() {
  const { user } = useAuth();
  const [adminView, setAdminView] = useState('overview');

  const renderDashboardByRole = () => {
    switch (user?.role) {
      case 'employee':
        return <EmployeeDashboard />;
      case 'hr':
        return <HRDashboard />;
      case 'management':
        return <ManagementDashboard />;
      case 'admin':
        return <AdminDashboard currentView={adminView} />;
      default:
        return <div>Invalid role or loading...</div>;
    }
  };

  if (user?.role === 'admin') {
    return (
      <div className="flex min-h-screen w-full bg-muted/40">
        <DashboardSidebar onNavigate={setAdminView} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <DashboardHeader />
          <main className="flex-1 overflow-auto p-4 sm:p-6">
            {renderDashboardByRole()}
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen w-full bg-muted/40">
      <DashboardHeader />
      <main className="flex-1 p-4 sm:p-6">
        {renderDashboardByRole()}
      </main>
    </div>
  );
}
