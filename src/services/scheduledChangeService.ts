
import { db, applyDbPrefix } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, doc, query, where, Timestamp, writeBatch, getDoc } from 'firebase/firestore';
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

const scheduledChangesCollection = collection(db, applyDbPrefix('scheduledChanges'));

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
    const changeDocRef = doc(collection(db, applyDbPrefix('scheduledChanges')));
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
    const changeDoc = doc(db, applyDbPrefix('scheduledChanges'), changeId);
    await updateDoc(changeDoc, { status: 'cancelled' });
}

export const applyScheduledChanges = async (): Promise<{ appliedChangesCount: number }> => {
    const nowTimestamp = Timestamp.now();
    
    const q = query(
      collection(db, applyDbPrefix('scheduledChanges')),
      where('status', '==', 'pending'),
      where('effectiveDate', '<=', nowTimestamp)
    );

    const snapshot = await getDocs(q);
    const changesToApply = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));

    if (changesToApply.length === 0) {
        return { appliedChangesCount: 0 };
    }

    const batch = writeBatch(db);

    for (const change of changesToApply) {
      const employeeDocRef = doc(db, applyDbPrefix('employees'), change.employeeId);
      
      let updateData: { [key: string]: any } = {
        [change.fieldName]: change.newValue,
      };
      
      if (change.fieldName === 'locationId' && typeof change.newValue === 'string') {
        const locationDocRef = doc(db, applyDbPrefix('locations'), change.newValue);
        try {
            const locationDocSnapshot = await getDoc(locationDocRef);
            if (locationDocSnapshot.exists()) {
                const locationData = locationDocSnapshot.data();
                if (locationData) {
                    updateData.locationName = locationData.name;
                    updateData.managerName = locationData.managerName || 'N/A';
                }
            }
        } catch (e) {
            console.error(`Could not fetch location ${change.newValue} for employee ${change.employeeId}. Location-dependent fields might be stale.`);
        }
      }
      
       if (change.fieldName === 'firstName' || change.fieldName === 'lastName') {
          const employeeDoc = await getDoc(employeeDocRef);
          if (employeeDoc.exists()) {
              const currentData = employeeDoc.data() as Employee;
              const newFirstName = change.fieldName === 'firstName' ? change.newValue : currentData.firstName;
              const newLastName = change.fieldName === 'lastName' ? change.newValue : currentData.lastName;
              updateData.fullName = `${newFirstName} ${newLastName}`.trim();
          }
      }

      batch.update(employeeDocRef, updateData);
      
      const changeDocRef = doc(db, applyDbPrefix('scheduledChanges'), change.id);
      batch.update(changeDocRef, { status: 'applied' });
    }

    await batch.commit();
    
    return { appliedChangesCount: changesToApply.length };
};
