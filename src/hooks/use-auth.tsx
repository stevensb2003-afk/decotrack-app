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
    const checkAuthStatus = () => {
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const parsedUser: SystemUser = JSON.parse(storedUser);
          setUser(parsedUser);
          if (pathname === '/login') {
            router.replace('/dashboard');
          }
        } else {
          if (pathname !== '/login') {
            router.replace('/login');
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        // If there's an error, default to logging out.
        localStorage.removeItem('user');
        if (pathname !== '/login') {
          router.replace('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []); // Empty dependency array ensures this runs only once on mount

  const login = async (email: string) => {
    setLoading(true);
    try {
      const systemUser = await getUserByEmail(email);

      if (systemUser) {
        localStorage.setItem('user', JSON.stringify(systemUser));
        setUser(systemUser);
        router.push('/dashboard');
      } else {
          console.error("Login failed: User not found");
          // This part will be handled by the toast in the LoginForm
      }
    } catch (error) {
      console.error("Error during login:", error);
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
