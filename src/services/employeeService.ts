
import { db } from '@/lib/firebase';
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
    };
    const docRef = await addDoc(employeesCollection, dataToCreate);
    return docRef.id;
};

export const updateEmployee = async (employeeId: string, data: Partial<Omit<Employee, 'id'>>) => {
    const employeeDoc = doc(db, 'employees', employeeId);
    
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
    const employeeDocRef = doc(db, 'employees', employeeId);
    const employeeDoc = await getDoc(employeeDocRef);
    if (!employeeDoc.exists()) {
        return null;
    }
    let snapshotData = { ...employeeDoc.data() } as Employee;

    const allChanges = await getScheduledChangesForEmployee(employeeId);
    
    // Filter for changes that were effective AFTER the date we are looking for
    // and sort them from most recent to oldest.
    const changesToRevert = allChanges
        .filter(c => c.effectiveDate.toDate() > asOf && c.status === 'applied')
        .sort((a, b) => b.effectiveDate.toMillis() - a.effectiveDate.toMillis());

    if (changesToRevert.length === 0) {
        return snapshotData; // Return current data if no reversions are needed
    }

    // This is a simplified reversion logic. A more robust system might store the oldValue.
    // For now, we find the "previous" value by looking at the next change in the revert list.
    for (let i = 0; i < changesToRevert.length; i++) {
        const changeToRevert = changesToRevert[i];
        
        let oldValue: any = undefined;

        // Find the next most recent change for the same field to get the "old" value.
        const previousChangeForField = changesToRevert
            .slice(i + 1)
            .find(c => c.fieldName === changeToRevert.fieldName);

        if (previousChangeForField) {
            oldValue = previousChangeForField.newValue;
        } else {
            // If no previous change, we need to get the original value.
            // This is a complex problem. For this implementation, we will assume we can't revert the first ever change.
            // A truly auditable system would store `oldValue` in the change document itself.
            // Let's assume for now that reverting to "undefined" or an empty state is acceptable if original is unknown.
            const originalDocData = (await getDoc(doc(db, 'employees', employeeId))).data();
            if(originalDocData) {
                 oldValue = originalDocData[changeToRevert.fieldName];
            }
        }
        
        if (oldValue !== undefined) {
             (snapshotData as any)[changeToRevert.fieldName] = oldValue;
        }
    }

    // Recalculate fullName if firstName or lastName was reverted
    if (changesToRevert.some(c => c.fieldName === 'firstName' || c.fieldName === 'lastName')) {
        snapshotData.fullName = `${snapshotData.firstName} ${snapshotData.lastName}`.trim();
    }


    return snapshotData;
};

