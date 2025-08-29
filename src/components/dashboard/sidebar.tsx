"use client";

import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { cn } from '@/lib/utils';
import { Building, LayoutDashboard, Users, BarChart, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function DashboardSidebar({ onNavigate }: { onNavigate: (view: string) => void }) {
  const { logout } = useAuth();
  const [activeView, setActiveView] = useState('overview');

  const navItems = [
    { view: 'overview', label: 'Overview', icon: LayoutDashboard },
    { view: 'employees', label: 'Employees', icon: Users },
    { view: 'reports', label: 'Reports', icon: BarChart },
    { view: 'users', label: 'User Management', icon: Settings },
  ];
  
  const handleNavigation = (view: string) => {
      setActiveView(view);
      onNavigate(view);
  }

  return (
    <aside className="w-64 flex-col border-r bg-card flex">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
          <Building className="h-6 w-6 text-primary" />
          <span className="">DecoTrack</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-auto py-4">
        <div className="flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <Button
              key={item.view}
              variant={activeView === item.view ? 'secondary': 'ghost'}
              onClick={() => handleNavigation(item.view)}
              className="w-full justify-start gap-3"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Button>
          ))}
        </div>
      </nav>
      <div className="mt-auto p-4 border-t">
        <Button variant="ghost" className="w-full justify-start gap-3" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Logout
        </Button>
      </div>
    </aside>
  );
}
