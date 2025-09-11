
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
        const checkAuthAndProfile = async () => {
            if (authLoading) {
                return;
            }

            if (!user) {
                router.replace('/login');
                setIsCheckingProfile(false);
                return;
            }
            
            // Avoid running this logic on the server or before mount
            if (isMounted) {
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
            }

            setIsCheckingProfile(false);
        };

        checkAuthAndProfile();
    }, [user, authLoading, router, pathname, isMounted]);

    const isLoading = authLoading || isCheckingProfile;
    const showLoader = !isMounted || isLoading;

    return (
        <>
            {showLoader && (
                <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-background">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            )}
            <div className={showLoader ? 'opacity-0' : 'opacity-100 transition-opacity'}>
                {children}
            </div>
        </>
    );
}
