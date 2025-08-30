"use client";

import ManagementDashboard from "./management-dashboard";
import HRDashboard from "./hr-dashboard";
import UserManagement from "./user-management";
import ReportsDashboard from "./reports-dashboard";

type AdminDashboardProps = {
  currentView: string;
};

export default function AdminDashboard({ currentView }: AdminDashboardProps) {
  const renderView = () => {
    switch (currentView) {
      case 'employees':
        return <HRDashboard />;
      case 'reports':
        return <ReportsDashboard />;
      case 'users':
        return <UserManagement />;
      case 'overview':
      default:
        return <ManagementDashboard />;
    }
  };

  return <div>{renderView()}</div>;
}
