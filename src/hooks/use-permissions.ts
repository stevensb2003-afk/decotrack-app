
"use client";

import { useAuth } from './use-auth';

export function usePermissions() {
    const { user } = useAuth();

    if (!user) {
        return {
            isSuperAdmin: false,
            isAdmin: false,
            isHR: false,
            isManager: false,
            isEmployee: false,
            canEditEmployeeData: false,
            canManageSystemUsers: false,
            canRunPayroll: false, // Example for future use
            canManageSchedules: false,
        };
    }

    const isSuperAdmin = user.email === 'decoinnova24@gmail.com';
    const isAdmin = user.role === 'admin' || isSuperAdmin;
    const isHR = user.role === 'hr';
    const isManager = user.role === 'Manager';

    return {
        isSuperAdmin,
        isAdmin,
        isHR,
        isManager,
        isEmployee: user.role === 'employee',
        
        // Combined permissions for easier use in components
        canEditEmployeeData: isAdmin || isHR,
        canManageSystemUsers: isAdmin,
        canRunPayroll: isAdmin,
        canManageSchedules: isAdmin || isHR,
    };
}
