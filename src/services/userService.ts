'use server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';
import { createEmployee } from './employeeService';

export type Role = 'employee' | 'hr' | 'management' | 'admin';

export type SystemUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  password?: string; // Should be handled securely, this is for demo
};

const usersCollection = collection(db, 'systemUsers');

export const getAllUsers = async (): Promise<SystemUser[]> => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemUser));
};

const createDefaultAdminIfNeeded = async (email: string): Promise<SystemUser | null> => {
    const adminEmail = "decoinnova24@gmail.com";
    if (email.toLowerCase() !== adminEmail) {
        return null;
    }

    const q = query(usersCollection, where("role", "==", "admin"));
    const adminSnapshot = await getDocs(q);

    if (adminSnapshot.empty) {
        console.log("No admin found. Creating default admin...");
        const newUser = {
            name: "Admin User",
            email: adminEmail,
            password: "admin123", // Set a default password
            role: "admin" as Role,
        };
        const docRef = await addDoc(usersCollection, newUser);
        
        return { ...newUser, id: docRef.id };
    }
    return null;
};

export const getUserByEmail = async (email: string): Promise<SystemUser | null> => {
    // One-time check to create a default admin if none exist
    const newAdmin = await createDefaultAdminIfNeeded(email);
    if(newAdmin) {
        return newAdmin;
    }

    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as SystemUser;
};


export const createUser = async (userData: Omit<SystemUser, 'id'>) => {
  const docRef = await addDoc(usersCollection, userData);
  return docRef.id;
};

export const updateUserRole = async (userId: string, newRole: Role) => {
  const userDoc = doc(db, 'systemUsers', userId);
  await updateDoc(userDoc, { role: newRole });
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
    const userDoc = doc(db, 'systemUsers', userId);
    await updateDoc(userDoc, { password: newPassword });
}
