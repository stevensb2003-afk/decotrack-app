
'use server';
import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { createEmployee, Employee } from './employeeService';

export type Role = 'employee' | 'hr' | 'Manager' | 'admin';

export type SystemUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  password?: string; // Should be handled securely, this is for demo
};

const usersCollection = collection(db, applyDbPrefix('systemUsers'));

const toSystemUser = (doc: any): SystemUser => {
    const data = doc.data();
    return {
        id: doc.id,
        ...data,
    } as SystemUser;
}

export const getAllUsers = async (): Promise<SystemUser[]> => {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(toSystemUser);
};

const createDefaultAdminIfNeeded = async () => {
    const adminEmail = "decoinnova24@gmail.com";
    const q = query(usersCollection, where("email", "==", adminEmail));
    const adminSnapshot = await getDocs(q);

    if (adminSnapshot.empty) {
        console.log("No admin found. Creating default admin...");
        const newUser = {
            firstName: "Admin",
            lastName: "",
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
            profileComplete: true, // Admin profile is complete by default
        });

        return { ...newUser, id: docRef.id };
    }
    return toSystemUser(adminSnapshot.docs[0]);
};


export const getUserByEmail = async (email: string): Promise<SystemUser | null> => {
    if (email.toLowerCase() === "decoinnova24@gmail.com") {
        return await createDefaultAdminIfNeeded();
    }

    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const docData = snapshot.docs[0];
    return toSystemUser(docData);
};


export const createUser = async (userData: Omit<SystemUser, 'id'>) => {
  const userPayload = {
    ...userData,
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
        profileComplete: false,
      });
    }
  return docRef.id;
};

export const updateUserRole = async (userId: string, newRole: Role) => {
  const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
  await updateDoc(userDoc, { role: newRole });
};

export const updateUserPassword = async (userId: string, newPassword: string) => {
    const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
    await updateDoc(userDoc, { password: newPassword });
}

export const deleteUser = async (userId: string) => {
  const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
  await deleteDoc(userDoc);
};
