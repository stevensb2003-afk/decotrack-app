"use client";

import { useAuth } from '@/hooks/use-auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { LogOut, User, Building, PanelLeft, Sun, Moon } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import DashboardSidebar from './sidebar';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { getEmployeeByEmail, Employee } from '@/services/employeeService';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const { setTheme, theme } = useTheme();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // This state is just to satisfy the prop of DashboardSidebar, it won't be used on mobile
  const [_, setAdminView] = useState('overview');
  const [employee, setEmployee] = useState<Employee | null>(null);
  const router = useRouter();


  useEffect(() => {
    const fetchEmployee = async () => {
      if (user?.email) {
        const emp = await getEmployeeByEmail(user.email);
        setEmployee(emp);
      }
    };
    fetchEmployee();
  }, [user]);

  const getInitials = (name: string = '') => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleProfileClick = () => {
    router.push('/dashboard/profile');
  };

  return (
    <header className="flex h-16 items-center border-b bg-card px-4 md:px-6 w-full shrink-0">
      <div className="md:hidden">
        {user?.role === 'admin' && (
           <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="outline">
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <DashboardSidebar onNavigate={(view) => {
                  setAdminView(view);
                  setMobileSidebarOpen(false);
                }} />
            </SheetContent>
          </Sheet>
        )}
      </div>
      <div className="flex w-full items-center justify-between md:justify-end gap-4">
        <div className="hidden md:flex items-center gap-2 font-semibold text-foreground">
           <Image src="/logo_azul.png" alt="DecoTrack Logo" width={24} height={24} className="dark:hidden" />
           <Image src="/logo_blanco.png" alt="DecoTrack Logo" width={24} height={24} className="hidden dark:block" />
           <span>DecoTrack</span>
        </div>

        <div className="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
            </Button>
            
            {employee && <p className="text-sm font-medium hidden sm:block">{employee.name}</p>}

            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar>
                    <AvatarImage data-ai-hint="profile avatar" src={employee?.avatarUrl} />
                    <AvatarFallback>{getInitials(employee?.name)}</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                    <p className="font-semibold">{employee?.name || 'My Account'}</p>
                    <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleProfileClick}>
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
