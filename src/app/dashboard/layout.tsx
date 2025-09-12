

"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getEmployeeByEmail } from '@/services/employeeService';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, firebaseUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!firebaseUser) return;

        const checkProfile = async () => {
             try {
                const emp = await getEmployeeByEmail(firebaseUser.email!);
                if (emp) {
                    const isSetupPage = pathname === '/dashboard/setup-profile';
                    if (!emp.profileComplete && user?.role !== 'admin' && user?.role !== 'Manager' && !isSetupPage) {
                        router.replace('/dashboard/setup-profile');
                    } 
                    else if (emp.profileComplete && isSetupPage) {
                        router.replace('/dashboard');
                    }
                } else if (user?.role !== 'admin') {
                    console.error("Employee profile not found for authenticated user:", firebaseUser.email);
                }
            } catch (error) {
                console.error("Error fetching employee profile in layout:", error);
            }
        };

        checkProfile();
    }, [user, firebaseUser, router, pathname]);

    return <>{children}</>;
}
