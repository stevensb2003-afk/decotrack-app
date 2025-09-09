
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getEmployeeByEmail, Employee } from '@/services/employeeService';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);

    useEffect(() => {
        const checkAuthAndProfile = async () => {
            if (loading) return;

            if (!user) {
                router.replace('/login');
                return;
            }
            
            // Fetch employee profile
            const emp = await getEmployeeByEmail(user.email);
            setEmployee(emp);

            if (emp) {
                const isSetupPage = pathname === '/dashboard/setup-profile';
                // Redirect to setup if profile is incomplete, user is not a manager/admin, and not already on setup page
                if (!emp.profileComplete && emp.role !== 'Manager' && emp.role !== 'admin' && !isSetupPage) {
                    router.replace('/dashboard/setup-profile');
                } 
                // Redirect away from setup if profile is already complete
                else if (emp.profileComplete && isSetupPage) {
                    router.replace('/dashboard');
                }
            }
            setIsCheckingProfile(false);
        };

        checkAuthAndProfile();
    }, [user, loading, router, pathname]);

    if (loading || isCheckingProfile) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }
    
    // If user is being redirected, don't render children to avoid flash of incorrect content
    if (employee && !employee.profileComplete && employee.role !== 'Manager' && employee.role !== 'admin' && pathname !== '/dashboard/setup-profile') {
        return null;
    }

    return <>{children}</>;
}
