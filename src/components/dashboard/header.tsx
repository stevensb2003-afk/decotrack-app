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
import { LogOut, User, Building, PanelLeft } from 'lucide-react';
import Link from 'next/link';
import { Sheet, SheetContent, SheetTrigger } from '../ui/sheet';
import DashboardSidebar from './sidebar';
import { useState } from 'react';

export default function DashboardHeader() {
  const { user, logout } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  // This state is just to satisfy the prop of DashboardSidebar, it won't be used on mobile
  const [_, setAdminView] = useState('overview');


  const getInitials = (email: string = '') => {
    return email.charAt(0).toUpperCase();
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
        <div className="hidden md:flex items-center gap-2 font-semibold">
           <Building className="h-6 w-6 text-primary" />
           <span>DecoTrack</span>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" className="rounded-full">
              <Avatar>
                <AvatarImage data-ai-hint="profile avatar" src={`https://i.pravatar.cc/150?u=${user?.email}`} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
              <span className="sr-only">Toggle user menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
                <p className="font-semibold">My Account</p>
                <p className="text-xs text-muted-foreground font-normal">{user?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>
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
    </header>
  );
}
