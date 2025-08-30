import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

export type ChangeRequest = {
  id: string;
  employeeId: string;
  employeeName: string;
  fieldName: string;
  oldValue: string;
  newValue: string;
  status: 'pending' | 'approved' | 'rejected';
};

const requestsCollection = collection(db, 'changeRequests');

export const createChangeRequest = async (requestData: Omit<ChangeRequest, 'id'>) => {
  await addDoc(requestsCollection, requestData);
};

export const getPendingChangeRequests = async (): Promise<ChangeRequest[]> => {
  const q = query(requestsCollection, where("status", "==", "pending"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangeRequest));
};

export const updateChangeRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
  const requestDoc = doc(db, 'changeRequests', requestId);
  await updateDoc(requestDoc, { status });
};

export const getPendingRequestForEmployee = async (employeeId: string): Promise<boolean> => {
    const q = query(
        requestsCollection, 
        where("employeeId", "==", employeeId),
        where("status", "==", "pending")
    );
    const snapshot = await getDocs(q);
    return !snapshot.empty;
}
