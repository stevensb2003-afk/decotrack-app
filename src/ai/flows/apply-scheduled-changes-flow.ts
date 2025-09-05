
'use server';
/**
 * @fileOverview A Genkit flow to apply scheduled employee data changes.
 * 
 * - applyScheduledChangesFlow - Finds and applies all pending changes with an effective date in the past.
 */

import { ai } from '@/ai/genkit';
import { collection, getDocs, query, where, Timestamp, doc, writeBatch, orderBy } from 'firebase/firestore';
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
    
    // The query requires filtering by status and ordering by effectiveDate.
    // To allow Firestore to use its automatic indexing, we can add a matching orderBy on the equality filter field.
    const q = query(
      collection(db, 'scheduledChanges'),
      where('status', '==', 'pending'),
      orderBy('status'), // Added to help Firestore with indexing
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
        // This is not efficient, but for the sake of the demo we get it directly.
        // A better approach would be to have location data denormalized or cached.
        const locationDocSnapshot = await getDoc(locationDocRef);
        if(locationDocSnapshot.exists()) {
            const locationData = locationDocSnapshot.data();
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
