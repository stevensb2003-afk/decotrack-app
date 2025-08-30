import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where } from 'firebase/firestore';

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

export const getUserByEmail = async (email: string): Promise<SystemUser | null> => {
    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as SystemUser;
};


export const createUser = async (userData: Omit<SystemUser, 'id'>) => {
  const docRef = await addDoc(usersCollection, userData);
  return docRef.id;
};

export const updateUserRole = async (userId: string, newRole: Role) => {
  const userDoc = doc(db, 'systemUsers', userId);
  await updateDoc(userDoc, { role: newRole });
};