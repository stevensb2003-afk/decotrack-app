import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';

export type License = {
    type: string;
    number: string;
    country: string;
};

export type Employee = {
    id: string;
    name: string;
    email: string;
    role: string;
    idType: 'Cédula' | 'Pasaporte' | 'Residencia';
    idNumber: string;
    cellphoneNumber: string;
    licensePermission: boolean;
    licenses: License[];
    status: 'Active' | 'LOA' | 'Terminated';
    salary: number; // Stored as a number
};

const employeesCollection = collection(db, 'employees');

export const getAllEmployees = async (): Promise<Employee[]> => {
    const snapshot = await getDocs(employeesCollection);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee));
};

export const getEmployeeByEmail = async (email: string): Promise<Employee | null> => {
    const q = query(employeesCollection, where("email", "==", email));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return null;
    }
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Employee;
};

export const createEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    // Ensure licenses is always an array
    const dataToCreate = {
        ...employeeData,
        licenses: employeeData.licenses || [],
    };
    const docRef = await addDoc(employeesCollection, dataToCreate);
    return docRef.id;
};

export const updateEmployee = async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const employeeDoc = doc(db, 'employees', employeeId);
    await updateDoc(employeeDoc, data);
};
