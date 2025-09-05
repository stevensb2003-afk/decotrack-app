'use server';
/**
 * @fileOverview A Genkit flow to apply scheduled employee data changes.
 * 
 * - applyScheduledChangesFlow - Finds and applies all pending changes with an effective date in the past.
 */

import { ai } from '@/ai/genkit';
import { collection, getDocs, query, where, Timestamp, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Employee } from '@/services/employeeService';
import { ScheduledChange } from '@/services/scheduledChangeService';

export const applyScheduledChangesFlow = ai.defineFlow(
  {
    name: 'applyScheduledChangesFlow',
    outputSchema: ai.defineSchema<{ appliedChangesCount: number }>(),
  },
  async () => {
    const now = Timestamp.now();
    const q = query(
      collection(db, 'scheduledChanges'),
      where('status', '==', 'pending'),
      where('effectiveDate', '<=', now)
    );

    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      return { appliedChangesCount: 0 };
    }

    const changesToApply = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));
    const batch = writeBatch(db);

    for (const change of changesToApply) {
      const employeeDocRef = doc(db, 'employees', change.employeeId);
      
      let updateData: Partial<Employee> = {
        [change.fieldName]: change.newValue,
      };

      // If location is changing, we need to update locationName and managerName too
      if (change.fieldName === 'locationId') {
        const locationDocRef = doc(db, 'locations', change.newValue);
        const locationDoc = await getDocs(query(collection(db, 'locations'), where('__name__', '==', locationDocRef.id)));
        if(!locationDoc.empty) {
            const locationData = locationDoc.docs[0].data();
            updateData.locationName = locationData.name;
            updateData.managerName = locationData.managerName || 'N/A';
        }
      }

      batch.update(employeeDocRef, updateData);

      const changeDocRef = doc(db, 'scheduledChanges', change.id);
      batch.update(changeDocRef, { status: 'applied' });
    }

    await batch.commit();

    return { appliedChangesCount: changesToApply.length };
  }
);
