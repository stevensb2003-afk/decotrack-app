import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp } from 'firebase/firestore';
import { updateEmployee, Employee } from './employeeService';
import { applyScheduledChangesFlow } from '@/ai/flows/apply-scheduled-changes-flow';

export type ScheduledChange = {
  id: string;
  employeeId: string;
  fieldName: keyof Employee;
  newValue: any;
  effectiveDate: Timestamp;
  status: 'pending' | 'applied' | 'cancelled';
};

const scheduledChangesCollection = collection(db, 'scheduledChanges');

export const createScheduledChange = async (changeData: Omit<ScheduledChange, 'id'>) => {
  return await addDoc(scheduledChangesCollection, changeData);
};

export const getScheduledChangesForEmployee = async (employeeId: string): Promise<ScheduledChange[]> => {
  const q = query(scheduledChangesCollection, where("employeeId", "==", employeeId), where("status", "in", ["pending", "applied"]));
  const snapshot = await getDocs(q);
  const changes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));
  changes.sort((a, b) => b.effectiveDate.toMillis() - a.effectiveDate.toMillis());
  return changes;
};

export const applyScheduledChanges = async (): Promise<{ appliedChangesCount: number }> => {
    return await applyScheduledChangesFlow();
};
