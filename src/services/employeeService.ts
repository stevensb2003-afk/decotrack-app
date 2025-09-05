import { db, storage } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where } from 'firebase/firestore';
import { Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export type License = {
    type: string;
    number: string;
    country: string;
    expirationDate: Timestamp;
    attachmentUrl?: string;
};

export type Employee = {
    id: string;
    name: string;
    email: string;
    role: 'Cajero' | 'Chofer' | 'Vendedor' | 'Recursos Humanos' | 'Contabilidad' | 'Marketing' | 'Manager' | 'admin' | 'employee';
    idType: 'ID Nacional' | 'Pasaporte' | 'Cédula Extranjero' | 'DIMEX';
    idNumber: string;
    idAttachmentUrl?: string;
    cellphoneNumber: string;
    licensePermission: boolean;
    licenses: License[];
    status: 'Active' | 'LOA' | 'Terminated';
    salary: number; // Stored as a number
    nationality: string;
    birthDate: Timestamp;
    hireDate: Timestamp;
    employmentType: 'Full time' | 'Part time' | 'Practicant' | 'n/a';
    salaryType: 'Hourly' | 'Salary' | 'Profesional Services';
    avatarUrl?: string;
    locationId?: string;
    locationName?: string;
    managerName?: string;
};

const employeesCollection = collection(db, 'employees');

export const uploadFile = async (file: File, path: string): Promise<string> => {
    const storageRef = ref(storage, path);
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
};

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
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as Employee;
};

export const createEmployee = async (employeeData: Omit<Employee, 'id'>) => {
    // Ensure licenses is always an array
    const dataToCreate = {
        ...employeeData,
        licenses: employeeData.licenses || [],
        avatarUrl: '',
    };
    const docRef = await addDoc(employeesCollection, dataToCreate);
    return docRef.id;
};

export const updateEmployee = async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const employeeDoc = doc(db, 'employees', employeeId);
    await updateDoc(employeeDoc, data);
};
