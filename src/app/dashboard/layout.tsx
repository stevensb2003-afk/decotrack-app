
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getEmployeeByEmail } from '@/services/employeeService';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const checkAuthAndProfile = async () => {
            if (authLoading) {
                return;
            }

            if (!user) {
                router.replace('/login');
                setIsCheckingProfile(false);
                return;
            }
            
            try {
                const emp = await getEmployeeByEmail(user.email);

                if (emp) {
                    const isSetupPage = pathname === '/dashboard/setup-profile';
                    if (!emp.profileComplete && emp.role !== 'Manager' && emp.role !== 'admin' && !isSetupPage) {
                        router.replace('/dashboard/setup-profile');
                    } 
                    else if (emp.profileComplete && isSetupPage) {
                        router.replace('/dashboard');
                    }
                } else if (user.role !== 'admin') {
                    console.error("Employee profile not found for authenticated user:", user.email);
                }
            } catch (error) {
                console.error("Error fetching employee profile in layout:", error);
            } finally {
                setIsCheckingProfile(false);
            }
        };

        checkAuthAndProfile();
    }, [user, authLoading, router, pathname, isMounted]);

    if (!isMounted || authLoading || isCheckingProfile) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    return <>{children}</>;
}
