
import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, getDocs, addDoc, updateDoc, doc, query, where, getDoc, Timestamp } from 'firebase/firestore';
import { ScheduledChange, getScheduledChangesForEmployee } from './scheduledChangeService';

export type License = {
    type: string;
    number: string;
    country: string;
    expirationDate: Timestamp;
};

export type Employee = {
    id: string;
    firstName: string;
    lastName: string;
    fullName: string;
    email: string;
    role: 'Cajero' | 'Chofer' | 'Vendedor' | 'Recursos Humanos' | 'Contabilidad' | 'Marketing' | 'Manager' | 'admin' | 'employee';
    idType: 'ID Nacional' | 'Pasaporte' | 'Cédula Extranjero' | 'DIMEX';
    idNumber: string;
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
    contractSigned?: boolean;
    CCSS?: boolean;
    profileComplete?: boolean;
};

const employeesCollection = collection(db, applyDbPrefix('employees'));

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

export const createEmployee = async (employeeData: Omit<Employee, 'id' | 'fullName'>) => {
    // Ensure licenses is always an array
    const dataToCreate = {
        ...employeeData,
        fullName: `${employeeData.firstName} ${employeeData.lastName}`.trim(),
        licenses: employeeData.licenses || [],
        avatarUrl: '',
        profileComplete: false, // Default for new employees
    };
    const docRef = await addDoc(employeesCollection, dataToCreate);
    return docRef.id;
};

export const updateEmployee = async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const employeeDoc = doc(db, applyDbPrefix('employees'), employeeId);
    
    const updateData = {...data};
    if ('firstName' in data || 'lastName' in data) {
        const currentDoc = await getDoc(employeeDoc);
        const currentData = currentDoc.data() as Employee;
        const firstName = data.firstName ?? currentData.firstName;
        const lastName = data.lastName ?? currentData.lastName;
        updateData.fullName = `${firstName} ${lastName}`.trim();
    }

    await updateDoc(employeeDoc, updateData);
};

export const getEmployeeSnapshot = async (employeeId: string, asOf: Date): Promise<Employee | null> => {
    const employeeDocRef = doc(db, applyDbPrefix('employees'), employeeId);
    const employeeDoc = await getDoc(employeeDocRef);
    if (!employeeDoc.exists()) {
        return null;
    }
    
    // NOTE: The original logic for historical snapshots was complex and prone to errors.
    // This simplified version returns the current state of the employee.
    // A robust audit trail system would require storing old values with each change record.
    const snapshotData = { ...employeeDoc.data() } as Employee;

    // To implement a true historical snapshot, you would need to:
    // 1. Get all 'applied' changes for the employee.
    // 2. Filter out changes that happened *after* the `asOf` date.
    // 3. Iteratively revert the data from the present state back to the `asOf` date.
    // This requires that each `ScheduledChange` also stores the `oldValue`.
    // Since that is not the case, we return the current data to avoid incorrect states.

    return snapshotData;
};
