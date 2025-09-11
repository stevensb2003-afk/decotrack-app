
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getEmployeeByEmail, Employee } from '@/services/employeeService';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);

    useEffect(() => {
        const checkAuthAndProfile = async () => {
            if (authLoading) {
                // Wait until firebase auth state is resolved
                return;
            }

            if (!user) {
                router.replace('/login');
                setIsCheckingProfile(false);
                return;
            }
            
            // User is authenticated, now check profile
            const emp = await getEmployeeByEmail(user.email);
            setEmployee(emp);

            if (emp) {
                const isSetupPage = pathname === '/dashboard/setup-profile';
                // Redirect to setup if profile is incomplete and user is not privileged
                if (!emp.profileComplete && emp.role !== 'Manager' && emp.role !== 'admin' && !isSetupPage) {
                    router.replace('/dashboard/setup-profile');
                } 
                // Redirect away from setup if profile is already complete
                else if (emp.profileComplete && isSetupPage) {
                    router.replace('/dashboard');
                }
            } else if (user.role !== 'admin') {
                // Handle case where user is in auth but not in employee DB (and is not an admin)
                console.error("Employee profile not found for authenticated user:", user.email);
                // Maybe redirect to an error page or logout
            }

            setIsCheckingProfile(false);
        };

        checkAuthAndProfile();
    }, [user, authLoading, router, pathname]);

    const isLoading = authLoading || isCheckingProfile;

    // By rendering the children but conditionally showing content, we avoid changing the hook execution order.
    return (
        <>
            {isLoading ? (
                <div className="flex h-screen w-full items-center justify-center bg-background">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            ) : (
                children
            )}
        </>
    );
}
