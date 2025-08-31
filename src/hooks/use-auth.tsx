
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getUserByEmail, SystemUser } from '@/services/userService';

interface AuthContextType {
  user: SystemUser | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProviderClient = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (!loading) {
      if (user && (pathname === '/login' || pathname === '/forgot-password' || pathname === '/')) {
        router.replace('/dashboard');
      } else if (!user && pathname !== '/login' && pathname !== '/forgot-password') {
         router.replace('/login');
      }
    }
  }, [user, loading, pathname, router]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const systemUser = await getUserByEmail(email);

      if (systemUser && systemUser.password === pass) {
        localStorage.setItem('user', JSON.stringify(systemUser));
        setUser(systemUser);
        router.push('/dashboard');
      } else {
        throw new Error("Invalid credentials");
      }
    } catch (error) {
      console.error("Error during login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
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
    return <AuthProviderClient>{children}</AuthProviderClient>
}


export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
