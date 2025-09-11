
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

/**
 * A callable function to migrate Firestore user documents to use Firebase Auth UIDs as document IDs.
 * It also creates users in Firebase Auth if they don't exist.
 */
export const migrateUsersToAuth = functions.https.onRequest(async (req, res) => {
  const db = admin.firestore();
  const auth = admin.auth();
  const batch = db.batch();

  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    const usersSnapshot = await db.collection("systemUsers").get();

    if (usersSnapshot.empty) {
      res.status(200).send("No users in Firestore to migrate.");
      return;
    }

    // Use Promise.all to process users concurrently
    await Promise.all(usersSnapshot.docs.map(async (doc) => {
      const oldDocId = doc.id;
      const userData = doc.data();
      const email = userData.email;

      if (!email) {
        errors.push(`Document ${oldDocId} is missing an email.`);
        errorCount++;
        return;
      }

      try {
        let userRecord;
        // 1. Get user from Auth or create them if they don't exist.
        try {
          userRecord = await auth.getUserByEmail(email);
        } catch (error: any) {
          if (error.code === "auth/user-not-found") {
            const displayName = `${userData.firstName || ""} ${userData.lastName || ""}`.trim();
            userRecord = await auth.createUser({
              email: email,
              displayName: displayName,
              // Users will need to use "forgot password" flow.
            });
            console.log(`Created user in Auth: ${email} (UID: ${userRecord.uid})`);
          } else {
            throw error; // Re-throw other errors
          }
        }

        const newUid = userRecord.uid;

        // 2. If the Firestore doc ID is already the correct UID, do nothing.
        if (oldDocId === newUid) {
          console.log(`User ${email} already has correct UID. Skipping.`);
          successCount++;
          return;
        }

        // 3. Create a new document with the correct UID as the ID.
        const newDocRef = db.collection("systemUsers").doc(newUid);
        batch.set(newDocRef, {
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            role: userData.role
        });

        // 4. Delete the old document.
        const oldDocRef = db.collection("systemUsers").doc(oldDocId);
        batch.delete(oldDocRef);

        console.log(`Migrating ${email}: ${oldDocId} -> ${newUid}`);
        successCount++;
      } catch (error: any) {
        console.error(`Failed to process user ${email}:`, error);
        errors.push(`Error with ${email}: ${error.message}`);
        errorCount++;
      }
    }));

    // Commit all batched writes
    await batch.commit();

    res.status(200).send(
      `Migration completed.<br/>` +
      `Successfully processed/migrated: ${successCount}.<br/>` +
      `Errors: ${errorCount}.<br/><br/>` +
      (errors.length > 0 ? `Detailed errors:<br/>${errors.join("<br/>")}` : "")
    );
  } catch (error) {
    console.error("General error during migration:", error);
    if (error instanceof Error) {
      res.status(500).send(`An unexpected error occurred: ${error.message}`);
    } else {
      res.status(500).send("An unknown error occurred.");
    }
  }
});
