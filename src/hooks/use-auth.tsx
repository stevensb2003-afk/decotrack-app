"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type Role = 'employee' | 'hr' | 'management' | 'admin' | null;

interface AuthContextType {
  user: { email: string; role: Role } | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<{ email: string; role: Role } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    try {
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
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem('user');
      if (pathname !== '/login') {
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [pathname, router]);

  const login = (email: string, role: Role) => {
    const userData = { email, role };
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    router.push('/dashboard');
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    router.push('/login');
  };

  if(loading) {
     return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
