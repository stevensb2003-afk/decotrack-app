
'use server';
/**
 * @fileOverview A Genkit flow to apply scheduled employee data changes.
 * 
 * - applyScheduledChangesFlow - Finds and applies all pending changes with an effective date in the past.
 */

import { ai } from '@/ai/genkit';
import { collection, getDocs, query, where, Timestamp, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Employee } from '@/services/employeeService';
import { ScheduledChange } from '@/services/scheduledChangeService';
import { z } from 'genkit';

const ApplyChangesOutputSchema = z.object({
    appliedChangesCount: z.number(),
    message: z.string(),
});

export const applyScheduledChangesFlow = ai.defineFlow(
  {
    name: 'applyScheduledChangesFlow',
    outputSchema: ApplyChangesOutputSchema,
  },
  async () => {
    const nowTimestamp = Timestamp.now();
    
    const q = query(
      collection(db, 'scheduledChanges'),
      where('status', '==', 'pending'),
      where('effectiveDate', '<=', nowTimestamp)
    );

    const snapshot = await getDocs(q);
    const changesToApply = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));

    if (changesToApply.length === 0) {
      return { appliedChangesCount: 0, message: "No pending changes to apply." };
    }

    console.log(`Found ${changesToApply.length} changes to apply.`);
    const batch = writeBatch(db);

    for (const change of changesToApply) {
      const employeeDocRef = doc(db, 'employees', change.employeeId);
      
      let updateData: Partial<Employee> = {
        [change.fieldName]: change.newValue,
      };
      
      if (change.fieldName === 'locationId' && typeof change.newValue === 'string') {
        const locationDocRef = doc(db, 'locations', change.newValue);
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

      batch.update(employeeDocRef, updateData);
      const changeDocRef = doc(db, 'scheduledChanges', change.id);
      batch.update(changeDocRef, { status: 'applied' });
    }

    await batch.commit();

    return { appliedChangesCount: changesToApply.length, message: `Successfully applied ${changesToApply.length} changes.` };
  }
);
