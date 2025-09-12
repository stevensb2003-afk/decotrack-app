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
                return; // Wait for the main auth state to settle
            }

            if (!firebaseUser) {
                // Auth is done, and there's no user. Let AuthProvider handle redirection.
                setIsCheckingProfile(false);
                return;
            }
            
            if (user) {
                 try {
                    const emp = await getEmployeeByEmail(user.email);
                    if (emp) {
                        const isSetupPage = pathname === '/dashboard/setup-profile';
                        // Redirect to setup if profile is not complete and we are not there already
                        if (!emp.profileComplete && user.role !== 'admin' && user.role !== 'Manager' && !isSetupPage) {
                            router.replace('/dashboard/setup-profile');
                        } 
                        // Redirect away from setup if profile is already complete
                        else if (emp.profileComplete && isSetupPage) {
                            router.replace('/dashboard');
                        }
                    } else if (user.role !== 'admin') {
                        // This case might happen if a user exists in Auth but not in the 'employees' collection
                        console.error("Employee profile not found for authenticated user:", user.email);
                    }
                } catch (error) {
                    console.error("Error fetching employee profile in layout:", error);
                }
            }
            // Finished all checks
            setIsCheckingProfile(false);
        };

        checkAuthAndProfile();
    }, [user, loading, firebaseUser, router, pathname]);

    // Determine if we should show the loader.
    const showLoader = loading || isCheckingProfile;

    // Always render the children, but control visibility with CSS.
    // This ensures a consistent hook order on every render.
    return (
        <>
            {showLoader && (
                <div className="flex h-screen w-full items-center justify-center bg-background">
                    <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
                </div>
            )}
            <div className={showLoader ? 'opacity-0 h-0 overflow-hidden' : 'opacity-100 transition-opacity'}>
                {children}
            </div>
        </>
    );
}
