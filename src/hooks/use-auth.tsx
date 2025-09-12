
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

const AuthProviderClient = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<SystemUser | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  // CAMBIO 1: Añadimos un estado para saber si el componente está montado en el cliente.
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // CAMBIO 2: Marcamos que ya estamos en el cliente.
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
  }, []); // El array de dependencias debe estar vacío.

  const login = async (email: string, pass: string) => {
    setLoading(true);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
  };

  // CAMBIO 3: No renderizamos nada hasta que el componente esté montado.
  // Esto asegura que el servidor (que no renderiza nada porque isMounted es false por defecto)
  // y el primer render del cliente (donde isMounted aún es false) sean idénticos.
  if (!isMounted) {
    return null;
  }

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, loading }}>
      {loading ? (
        <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-background">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  return <AuthProviderClient>{children}</AuthProviderClient>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
