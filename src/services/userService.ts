
'use server';
import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp } from 'firebase/firestore';
import { createEmployee, Employee } from './employeeService';
// NOTE: Firebase Admin SDK should be used on a secure backend (e.g., Cloud Function)
// for production-level user management. The client-side `firebase/auth` is used here for simplicity.
import { getAuth, sendPasswordResetEmail } from 'firebase/auth'; 

export type Role = 'employee' | 'hr' | 'Manager' | 'admin';

export type SystemUser = {
  id: string; // This will now be the Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
};

const usersCollection = collection(db, applyDbPrefix('systemUsers'));
const auth = getAuth(); // For client-side operations

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

// This function should be replaced by a secure backend call in production
// It is simulated here for the dashboard functionality.
const createAuthUser = async (email: string): Promise<{uid: string, tempPass: string}> => {
    // In a real scenario, this would call a Cloud Function that uses the Admin SDK
    // to create a user and return the UID.
    console.warn("User creation simulation: In a real app, this should be a secure backend call.");
    const tempPass = Math.random().toString(36).slice(-8);
    // Simulate UID creation - in reality, this comes from Firebase Auth
    const uid = `simulated-uid-${Math.random().toString(36).substring(2, 15)}`;
    
    // In a real app, you'd send a welcome email with the temporary password or a setup link.
    // For now, we'll just log it.
    console.log(`Simulated: User created for ${email} with temporary password: ${tempPass}`);
    
    return { uid, tempPass };
};

export const getUserByEmail = async (email: string): Promise<SystemUser | null> => {
    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const docData = snapshot.docs[0];
    return toSystemUser(docData);
};


export const createUser = async (userData: Omit<SystemUser, 'id'>) => {
  // In a real app, this would be a Cloud Function
  console.warn("This is a simulated user creation. For production, use a secure backend function.");
  
  // 1. Check if user already exists in Firestore
  const q = query(usersCollection, where("email", "==", userData.email));
  const existingUser = await getDocs(q);
  if (!existingUser.empty) {
      throw new Error("A user with this email already exists.");
  }
  
  // 2. Simulate creating the user in Firebase Auth and getting a UID
  // This is where you would call your backend function.
  // const { uid } = await myBackend.createUser({ email: userData.email, password: someInitialPassword });
  // For now, we'll use a placeholder UID (the doc ID we'll create)
  const tempDocRef = doc(collection(db, 'systemUsers'));
  const uid = tempDocRef.id;

  // 3. Save user data to Firestore with the new UID
  const userPayload = {
    ...userData,
  }
  await addDoc(usersCollection, { id: uid, ...userPayload });

  // 4. Create corresponding employee profile
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

  // 5. Send a password reset email to the user to set their initial password
  await sendPasswordReset(userData.email);

  return uid;
};

export const updateUserRole = async (userId: string, newRole: Role) => {
  const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
  await updateDoc(userDoc, { role: newRole });
};

export const sendPasswordReset = async (email: string) => {
    return await sendPasswordResetEmail(auth, email);
}

export const deleteUser = async (userId: string) => {
  // This is a complex operation that should be handled in a backend function for security.
  // It requires deleting from Auth and then from Firestore.
  // We simulate the Firestore part here.
  console.warn("This is a simulated user deletion. It only removes the user from Firestore, not Firebase Auth.");
  const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
  await deleteDoc(userDoc);
  // In a real backend: admin.auth().deleteUser(userId);
};
