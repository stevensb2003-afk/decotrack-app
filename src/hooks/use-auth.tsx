
"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { getUserByEmail, SystemUser } from '@/services/userService';
import { app } from '@/lib/firebase';

interface AuthContextType {
  user: SystemUser | null;
  firebaseUser: FirebaseUser | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const auth = getAuth(app);

const AuthProviderClient = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setIsMounted(true);
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const systemUser = await getUserByEmail(fbUser.email!);
        setUser(systemUser);
        
        if (pathname === '/login' || pathname === '/forgot-password' || pathname === '/') {
          router.replace('/dashboard');
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        if (pathname !== '/login' && pathname !== '/forgot-password') {
          router.replace('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const login = async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  const showLoader = !isMounted || loading;

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, loading }}>
      {showLoader && (
        <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-background">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      )}
      <div className={showLoader ? 'opacity-0' : 'opacity-100 transition-opacity'}>
        {children}
      </div>
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
