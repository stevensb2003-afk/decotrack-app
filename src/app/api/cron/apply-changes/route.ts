
import { NextRequest, NextResponse } from 'next/server';
import { collection, getDocs, query, where, Timestamp, doc, writeBatch, getDoc } from 'firebase/firestore';
import { db, applyDbPrefix } from '@/lib/firebase';
import { Employee } from '@/services/employeeService';
import { ScheduledChange } from '@/services/scheduledChangeService';

export const dynamic = 'force-dynamic'; // Ensures the route is not cached

export const GET = async (req: NextRequest) => {
  try {
    console.log(`Cron job triggered at ${new Date().toISOString()}. Applying scheduled changes...`);

    const nowTimestamp = Timestamp.now();
    
    const q = query(
      collection(db, applyDbPrefix('scheduledChanges')),
      where('status', '==', 'pending'),
      where('effectiveDate', '<=', nowTimestamp)
    );

    const snapshot = await getDocs(q);
    const changesToApply = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ScheduledChange));

    if (changesToApply.length === 0) {
        const message = "No pending changes to apply at this time.";
        console.log(message);
        return NextResponse.json({ success: true, message, appliedChangesCount: 0 });
    }

    console.log(`Found ${changesToApply.length} changes to apply.`);
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
    
    const successMessage = `Job finished. Successfully applied ${changesToApply.length} changes.`;
    console.log(successMessage);
    
    return NextResponse.json({
      success: true,
      message: successMessage,
      appliedChangesCount: changesToApply.length,
    });

  } catch (error) {
    console.error('Error running scheduled changes cron job:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new NextResponse(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
