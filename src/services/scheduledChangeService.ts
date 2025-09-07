
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp, writeBatch } from 'firebase/firestore';
import { updateEmployee, Employee } from './employeeService';

export type ScheduledChange = {
  id: string;
  employeeId: string;
  fieldName: keyof Employee;
  newValue: any;
  effectiveDate: Timestamp;
  status: 'pending' | 'applied' | 'cancelled';
  batchId?: string; // To group changes with the same effective date
};

const scheduledChangesCollection = collection(db, 'scheduledChanges');

export const createScheduledChange = async (employeeId: string, change: {fieldName: keyof Employee, newValue: any}, effectiveDate: Date) => {
  const changeData: Omit<ScheduledChange, 'id'> = {
    employeeId,
    fieldName: change.fieldName,
    newValue: change.newValue,
    effectiveDate: Timestamp.fromDate(effectiveDate),
    status: 'pending',
  };
  return await addDoc(scheduledChangesCollection, changeData);
};

export const createScheduledChanges = async (employeeId: string, changes: {fieldName: keyof Employee, newValue: any}[], effectiveDate: Date) => {
  const batch = writeBatch(db);
  const batchId = doc(collection(db, 'scheduledChanges')).id; // Generate a unique ID for the batch
  const effectiveTimestamp = Timestamp.fromDate(effectiveDate);

  changes.forEach(change => {
    const changeDocRef = doc(collection(db, 'scheduledChanges'));
    const changeData: Omit<ScheduledChange, 'id'> = {
      employeeId,
      fieldName: change.fieldName,
      newValue: change.newValue,
      effectiveDate: effectiveTimestamp,
      status: 'pending',
      batchId,
    };
    batch.set(changeDocRef, changeData);
  });

  return await batch.commit();
};

export const getAllScheduledChanges = async (status: 'pending' | 'applied' | 'cancelled' = 'pending'): Promise<ScheduledChange[]> => {
  const q = query(scheduledChangesCollection, where("status", "==", status));
  const snapshot = await getDocs(q);
  const changes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));
  changes.sort((a,b) => a.effectiveDate.toMillis() - b.effectiveDate.toMillis());
  return changes;
}

export const getScheduledChangesForEmployee = async (employeeId: string): Promise<ScheduledChange[]> => {
  const q = query(scheduledChangesCollection, where("employeeId", "==", employeeId));
  const snapshot = await getDocs(q);
  const changes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));
  changes.sort((a, b) => b.effectiveDate.toMillis() - a.effectiveDate.toMillis());
  return changes;
};

export const cancelScheduledChange = async (changeId: string) => {
    const changeDoc = doc(db, 'scheduledChanges', changeId);
    await updateDoc(changeDoc, { status: 'cancelled' });
}

export const applyScheduledChanges = async (): Promise<{ appliedChangesCount: number }> => {
    // This function now calls the same API endpoint as the cron job for consistency.
    // The endpoint is responsible for the actual logic.
    try {
        const response = await fetch('/api/cron/apply-changes', { method: 'GET' });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to apply changes via API.');
        }
        const result = await response.json();
        return { appliedChangesCount: result.appliedChangesCount || 0 };
    } catch (error) {
        console.error("Error calling apply-changes API from service:", error);
        // Return 0 if the API call fails
        return { appliedChangesCount: 0 };
    }
};
