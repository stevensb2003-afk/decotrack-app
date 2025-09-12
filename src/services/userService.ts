
'use server';
import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, addDoc, updateDoc, query, where, deleteDoc, Timestamp, setDoc } from 'firebase/firestore';
import { createEmployee, Employee } from './employeeService';
// NOTE: Firebase Admin SDK should be used on a secure backend (e.g., Cloud Function)
// for production-level user management. The client-side `firebase/auth` is used here for simplicity.
import { getAuth, sendPasswordResetEmail, createUserWithEmailAndPassword } from 'firebase/auth';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/lib/firebase';

export type Role = 'employee' | 'hr' | 'Manager' | 'admin';

export type SystemUser = {
  id: string; // This will now be the Firebase Auth UID
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  profileComplete?: boolean;
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

export async function getAllUsers(): Promise<SystemUser[]> {
  const snapshot = await getDocs(usersCollection);
  return snapshot.docs.map(doc => ({id: doc.id, ...doc.data()}) as SystemUser);
};

export async function getUserByEmail(email: string): Promise<SystemUser | null> {
    const q = query(usersCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as SystemUser;
};


export async function createUser(userData: Omit<SystemUser, 'id'>) {
    // This is a placeholder for a secure backend function call.
    // In a real production app, you would use a Cloud Function that leverages the Firebase Admin SDK.
    console.warn("This is a simulated user creation for development. For production, use a secure backend function.");

    const q = query(usersCollection, where("email", "==", userData.email));
    const existingUser = await getDocs(q);
    if (!existingUser.empty) {
        throw new Error("A user with this email already exists in Firestore.");
    }

    try {
        // --- THIS PART IS INSECURE FOR PRODUCTION ---
        // In a real app, this would be a call to a Cloud Function.
        // We do it client-side here for simplicity in this dev environment.
        const tempPassword = Math.random().toString(36).slice(-8);
        const userCredential = await createUserWithEmailAndPassword(auth, userData.email, tempPassword);
        const uid = userCredential.user.uid;
        // --- END OF INSECURE PART ---

        // Save user data to Firestore using the REAL Auth UID as the document ID
        const userDocRef = doc(db, applyDbPrefix('systemUsers'), uid);
        await setDoc(userDocRef, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role,
        });

        // Create corresponding employee profile if not an admin
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

        // Send a password reset email for the user to set their initial password
        await sendPasswordReset(userData.email);

        return uid;

    } catch (error: any) {
        // Handle specific auth errors
        if (error.code === 'auth/email-already-in-use') {
            throw new Error('This email is already registered in Firebase Authentication.');
        }
        console.error("Error creating user:", error);
        throw new Error(error.message || "An unknown error occurred during user creation.");
    }
};

export async function updateUserRole(userId: string, newRole: Role) {
  const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
  await updateDoc(userDoc, { role: newRole });
};

export async function sendPasswordReset(email: string) {
    return await sendPasswordResetEmail(auth, email);
}

export async function deleteUser(userId: string) {
  // This is a complex operation that should be handled in a backend function for security.
  // It requires deleting from Auth and then from Firestore.
  // We simulate the Firestore part here.
  console.warn("This is a simulated user deletion. It only removes the user from Firestore, not Firebase Auth.");
  const userDoc = doc(db, applyDbPrefix('systemUsers'), userId);
  await deleteDoc(userDoc);
  // In a real backend: admin.auth().deleteUser(userId);
};
