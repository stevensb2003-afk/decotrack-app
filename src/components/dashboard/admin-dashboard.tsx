"use client";

import ManagementDashboard from "./management-dashboard";
import HRDashboard from "./hr-dashboard";
import UserManagement from "./user-management";
import ReportsDashboard from "./reports-dashboard";
import TimeOffDashboard from "./time-off-dashboard";
import SchedulingDashboard from "./scheduling-dashboard";

type AdminDashboardProps = {
  currentView: string;
};

export default function AdminDashboard({ currentView }: AdminDashboardProps) {
  const renderView = () => {
    switch (currentView) {
      case 'employees':
        return <HRDashboard />;
      case 'time-off':
        return <TimeOffDashboard />;
      case 'scheduling':
        return <SchedulingDashboard />;
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
