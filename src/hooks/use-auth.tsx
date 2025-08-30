"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUserByEmail, SystemUser } from '@/services/userService';

type Role = 'employee' | 'hr' | 'management' | 'admin' | null;

interface AuthContextType {
  user: SystemUser | null;
  login: (email: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderClient = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
       if (pathname === '/login') {
         router.replace('/dashboard');
       }
    } else if (pathname !== '/login') {
      router.replace('/login');
    }
    setLoading(false);
  }, [pathname, router]);

  const login = async (email: string) => {
    setLoading(true);
    const systemUser = await getUserByEmail(email);

    if (systemUser) {
      localStorage.setItem('user', JSON.stringify(systemUser));
      setUser(systemUser);
      router.push('/dashboard');
    } else {
        // Handle user not found
        console.error("Login failed: User not found");
        // We'll need a toast message here later
    }
    setLoading(false);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

   return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [isClient, setIsClient] = useState(false)
 
    useEffect(() => {
        setIsClient(true)
    }, [])

    if (!isClient) {
        return null;
    }
    
    return <AuthProviderClient>{children}</AuthProviderClient>
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
