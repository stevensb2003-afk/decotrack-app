import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore';

export type TimeOffReason = 
    | 'Vacaciones'
    | 'Incapacidad por enfermedad'
    | 'Licencia de maternidad'
    | 'Licencia de paternidad'
    | 'Licencia por adoción'
    | 'Permiso para cita médica'
    | 'Licencia por duelo'
    | 'Licencia por Matrimonio';

export type TimeOffRequest = {
    id: string;
    employeeId: string;
    employeeName: string;
    reason: TimeOffReason;
    startDate: Timestamp;
    endDate: Timestamp;
    hours?: number; // For medical appointments
    status: 'pending' | 'approved' | 'rejected';
    comments?: string;
    attachmentUrl?: string; // For medical certificates
    requestedAt: Timestamp;
};

export type VacationBank = {
    id: string;
    employeeId: string;
    balance: number; // in days
    lastAccrualYear: number;
    lastAccrualMonth: number;
};

const requestsCollection = collection(db, 'timeOffRequests');
const vacationBankCollection = collection(db, 'vacationBank');


export const createTimeOffRequest = async (requestData: Omit<TimeOffRequest, 'id' | 'requestedAt' | 'status'>) => {
    const newRequest = {
        ...requestData,
        status: 'pending',
        requestedAt: Timestamp.now()
    }
    return await addDoc(requestsCollection, newRequest);
};

export const getTimeOffRequests = async (status?: TimeOffRequest['status']): Promise<TimeOffRequest[]> => {
    let q = query(requestsCollection);
    if(status) {
        q = query(requestsCollection, where("status", "==", status));
    }
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeOffRequest));
};

export const getEmployeeTimeOffRequests = async (employeeId: string): Promise<TimeOffRequest[]> => {
    const q = query(requestsCollection, where("employeeId", "==", employeeId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeOffRequest));
};

export const updateTimeOffRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
    const requestDoc = doc(db, 'timeOffRequests', requestId);
    await updateDoc(requestDoc, { status });
};

export const getVacationBank = async (employeeId: string): Promise<VacationBank | null> => {
    const q = query(vacationBankCollection, where("employeeId", "==", employeeId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        // Create a new bank if it doesn't exist
        const newBank = {
            employeeId,
            balance: 0,
            lastAccrualYear: new Date().getFullYear(),
            lastAccrualMonth: new Date().getMonth(),
        };
        const docRef = await addDoc(vacationBankCollection, newBank);
        return { id: docRef.id, ...newBank };
    }
    const docData = snapshot.docs[0];
    return { id: docData.id, ...docData.data() } as VacationBank;
};

export const updateVacationBank = async (bankId: string, data: Partial<Omit<VacationBank, 'id'>>) => {
    const bankDoc = doc(db, 'vacationBank', bankId);
    await updateDoc(bankDoc, data);
};
