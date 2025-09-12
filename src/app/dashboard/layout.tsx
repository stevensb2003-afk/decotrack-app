
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getEmployeeByEmail } from '@/services/employeeService';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const { user, loading, firebaseUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);

    useEffect(() => {
        const checkAuthAndProfile = async () => {
            if (loading) {
                return;
            }

            if (!firebaseUser) {
                router.replace('/login');
                setIsCheckingProfile(false);
                return;
            }
            
            if (user) { // user is the SystemUser from firestore
                 try {
                    const emp = await getEmployeeByEmail(user.email);

                    if (emp) {
                        const isSetupPage = pathname === '/dashboard/setup-profile';
                        if (!emp.profileComplete && user.role !== 'admin' && user.role !== 'Manager' && !isSetupPage) {
                            router.replace('/dashboard/setup-profile');
                        } 
                        else if (emp.profileComplete && isSetupPage) {
                            router.replace('/dashboard');
                        }
                    } else if (user.role !== 'admin') {
                        // This case can happen if a user exists in auth/systemUsers but not in employees collection yet
                        console.error("Employee profile not found for authenticated user:", user.email);
                    }
                } catch (error) {
                    console.error("Error fetching employee profile in layout:", error);
                }
            }
            setIsCheckingProfile(false);
        };

        checkAuthAndProfile();
    }, [user, loading, firebaseUser, router, pathname]);

    if (loading || isCheckingProfile) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }

    return <>{children}</>;
}
