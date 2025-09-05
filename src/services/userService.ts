
'use server';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { createEmployee, Employee } from './employeeService';

export type Role = 'employee' | 'hr' | 'Manager' | 'admin';

export type SystemUser = {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  role: Role;
  password?: string; // Should be handled securely, this is for demo
};

const usersCollection = collection(db, 'systemUsers');

const toSystemUser = (doc: any): SystemUser => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
        fullName: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
    } as SystemUser;
}

export const getAllUsers = async (): Promise<SystemUser[]> => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(toSystemUser);
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
            firstName: "Admin",
            lastName: "User",
            email: adminEmail,
            password: "admin123", // Set a default password
            role: "admin" as Role,
        };
        const docRef = await addDoc(usersCollection, {
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            password: newUser.password,
            role: newUser.role,
        });
        
        await createEmployee({
            firstName: newUser.firstName,
            lastName: newUser.lastName,
            email: newUser.email,
            role: newUser.role,
            idType: 'ID Nacional',
            idNumber: 'N/A',
            cellphoneNumber: 'N/A',
            licensePermission: false,
            licenses: [],
            status: 'Active',
            salary: 0,
            nationality: 'N/A',
            birthDate: Timestamp.now(),
            hireDate: Timestamp.now(),
            employmentType: 'n/a',
            salaryType: 'Salary',
        });

        return { ...newUser, fullName: 'Admin User', id: docRef.id };
    }
    return null;
};

export const getUserByEmail = async (email: string): Promise<SystemUser | null> => {
    const newAdmin = await createDefaultAdminIfNeeded(email);
    if(newAdmin && newAdmin.email.toLowerCase() === email.toLowerCase()) {
        return newAdmin;
    }

    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const docData = snapshot.docs[0];
    return toSystemUser(docData);
};


export const createUser = async (userData: Omit<SystemUser, 'id' | 'fullName'>) => {
  const userPayload = {
    ...userData,
    fullName: `${userData.firstName} ${userData.lastName}`.trim(),
  }
  const docRef = await addDoc(usersCollection, userPayload);
  if (userData.role !== 'admin') {
      await createEmployee({
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        role: userData.role as Employee['role'],
        idType: 'ID Nacional',
        idNumber: '',
        cellphoneNumber: '',
        licensePermission: false,
        licenses: [],
        status: 'Active',
        salary: 0,
        nationality: '',
        birthDate: Timestamp.now(),
        hireDate: Timestamp.now(),
        employmentType: 'n/a',
        salaryType: 'Salary',
      });
    }
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

export const deleteUser = async (userId: string) => {
  const userDoc = doc(db, 'systemUsers', userId);
  await deleteDoc(userDoc);
};
