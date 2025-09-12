"use client";

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, User as FirebaseUser } from "firebase/auth";
import { getUserByEmail, SystemUser } from '@/services/userService';
import { app } from '@/lib/firebase';

// ... (Interfaz y Contexto sin cambios)
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
  const [isMounted, setIsMounted] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  // EFECTO #1: Configurar el oyente de autenticación UNA SOLA VEZ
  useEffect(() => {
    setIsMounted(true);

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setFirebaseUser(fbUser);
        const systemUser = await getUserByEmail(fbUser.email!);
        setUser(systemUser);
      } else {
        setFirebaseUser(null);
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []); // <-- Array vacío para que se ejecute solo una vez al montar.

  // EFECTO #2: Manejar las redirecciones basadas en el estado.
  useEffect(() => {
    if (loading || !isMounted) return; // No hacer nada si aún está cargando o no está montado.

    const isAuthPage = pathname === '/login' || pathname === '/forgot-password' || pathname === '/';

    // Si el usuario está logueado y en una página de autenticación, redirigir al dashboard.
    if (firebaseUser && isAuthPage) {
      router.replace('/dashboard');
    }

    // Si el usuario NO está logueado y está en una ruta protegida, redirigir al login.
    if (!firebaseUser && pathname.startsWith('/dashboard')) {
      router.replace('/login');
    }

    // Aquí iría la lógica del perfil incompleto también
    if (user && !user.profileComplete && pathname !== '/dashboard/setup-profile') {
        router.replace('/dashboard/setup-profile');
    }

  }, [firebaseUser, user, loading, isMounted, pathname, router]); // Este efecto SÍ se ejecuta cuando el estado o la ruta cambian.


  const login = async (email: string, pass: string) => {
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (!isMounted) {
    return null; 
  }
  
  const showLoader = loading; // Podemos simplificar esto, ya que las redirecciones manejan el resto.

  return (
    <AuthContext.Provider value={{ user, firebaseUser, login, logout, loading }}>
      {showLoader ? (
        <div className="fixed inset-0 z-50 flex h-screen w-full items-center justify-center bg-background">
          <div className="h-16 w-16 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};


// ... (El resto del código sin cambios) ...
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