
// This file is being kept for potential future use but is currently not used
// by the main application flow, which now uses scheduledChangeService.
// If you need to re-enable a manual approval flow, you can integrate this service again.
import { db, applyDbPrefix } from '@/lib/firebase';
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

const requestsCollection = collection(db, applyDbPrefix('changeRequests'));

export const createChangeRequest = async (requestData: Omit<ChangeRequest, 'id'>) => {
  await addDoc(requestsCollection, requestData);
};

export const getPendingChangeRequests = async (): Promise<ChangeRequest[]> => {
  const q = query(requestsCollection, where("status", "==", "pending"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChangeRequest));
};

export const updateChangeRequestStatus = async (requestId: string, status: 'approved' | 'rejected') => {
  const requestDoc = doc(db, applyDbPrefix('changeRequests'), requestId);
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
