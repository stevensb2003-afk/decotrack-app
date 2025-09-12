
"use client";

import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getEmployeeByEmail } from '@/services/employeeService';

export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    // REGLA DE ORO: Todos los hooks se llaman en la parte superior, incondicionalmente.
    const { user, loading, firebaseUser } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckingProfile, setIsCheckingProfile] = useState(true);

    useEffect(() => {
        // La lógica que usa los hooks se ejecuta aquí, pero los hooks ya fueron llamados.
        const checkAuthAndProfile = async () => {
            if (loading) {
                // Aún esperando a que onAuthStateChanged termine.
                return;
            }

            if (!firebaseUser) {
                // Si no hay usuario de Firebase, no necesitamos hacer más comprobaciones.
                // El AuthProvider ya se encarga de redirigir.
                setIsCheckingProfile(false);
                return;
            }
            
            // Si tenemos un usuario del sistema (de Firestore)
            if (user) {
                 try {
                    const emp = await getEmployeeByEmail(user.email);

                    if (emp) {
                        const isSetupPage = pathname === '/dashboard/setup-profile';
                        // Redirigir si el perfil no está completo (y no es admin/manager)
                        if (!emp.profileComplete && user.role !== 'admin' && user.role !== 'Manager' && !isSetupPage) {
                            router.replace('/dashboard/setup-profile');
                        } 
                        // Redirigir si el perfil está completo pero intentan acceder a la página de setup
                        else if (emp.profileComplete && isSetupPage) {
                            router.replace('/dashboard');
                        }
                    } else if (user.role !== 'admin') {
                        console.error("Employee profile not found for authenticated user:", user.email);
                    }
                } catch (error) {
                    console.error("Error fetching employee profile in layout:", error);
                }
            }
            // Marcamos el chequeo como finalizado
            setIsCheckingProfile(false);
        };

        checkAuthAndProfile();
    }, [user, loading, firebaseUser, router, pathname]);

    // Lógica de renderizado condicional DESPUÉS de llamar a todos los hooks.
    if (loading || isCheckingProfile) {
        return (
             <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
        );
    }
    
    // Si no está cargando, renderizamos el contenido.
    return <>{children}</>;
}
