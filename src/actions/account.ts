"use server";

import { adminDb, adminAuth, adminStorage } from "@/lib/firebaseAdmin";
import { cookies } from "next/headers";

/**
 * Perform a secure cascading delete of the user's account and all associated data.
 */
export async function deleteUserAccountAndData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;

  if (!token) {
    return { success: false, error: "Unauthorized" };
  }

  let uid = "";
  try {
    if (adminAuth) {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } else {
      // Fallback for local development if admin Auth isn't set up
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      uid = payload.user_id;
    }
  } catch (error) {
    return { success: false, error: "Invalid session" };
  }

  if (!uid) {
    return { success: false, error: "Could not determine user ID" };
  }

  try {
    // 1. Delete Storage Files (Materials)
    if (adminStorage) {
      try {
        const bucket = adminStorage.bucket();
        await bucket.deleteFiles({ prefix: `materials/${uid}/` });
      } catch (storageError) {
        console.error("Failed to delete storage files:", storageError);
      }
    }

    if (adminDb) {
      const db = adminDb; // Local const for TypeScript closure narrowing

      // 2. Collect all document references to delete
      const batchDeletePromises: Promise<FirebaseFirestore.WriteResult[]>[] = [];

      // Helper function to delete a query's results in batches
      const deleteQueryBatch = async (query: FirebaseFirestore.Query) => {
        const snapshot = await query.get();
        if (snapshot.size === 0) return;
        const batch = db.batch();
        snapshot.docs.forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      };

      // 3. Delete Study Materials
      await deleteQueryBatch(db.collection("studyMaterials").where("userId", "==", uid));

      // 4. Delete Summaries
      await deleteQueryBatch(db.collection("summaries").where("userId", "==", uid));

      // 5. Delete Flashcards
      await deleteQueryBatch(db.collection("flashcards").where("userId", "==", uid));

      // 6. Delete Quizzes and Attempts
      await deleteQueryBatch(db.collection("quizzes").where("userId", "==", uid));
      await deleteQueryBatch(db.collection("quizAttempts").where("userId", "==", uid));

      // 7. Delete Chat Sessions and their messages
      const sessionsSnap = await db.collection("chatSessions").where("userId", "==", uid).get();
      for (const sessionDoc of sessionsSnap.docs) {
        await deleteQueryBatch(db.collection("chatMessages").where("sessionId", "==", sessionDoc.id));
        await sessionDoc.ref.delete();
      }

      // 8. Handle Study Rooms
      // Remove memberships
      await deleteQueryBatch(db.collection("studyRoomMembers").where("userId", "==", uid));
      
      // Delete owned rooms (and cascade delete room memberships, messages, AI reviews)
      const ownedRoomsSnap = await db.collection("studyRooms").where("ownerId", "==", uid).get();
      for (const roomDoc of ownedRoomsSnap.docs) {
        await deleteQueryBatch(db.collection("studyRoomMembers").where("roomId", "==", roomDoc.id));
        await deleteQueryBatch(db.collection("studyRoomMessages").where("roomId", "==", roomDoc.id));
        await deleteQueryBatch(db.collection("aiReviews").where("roomId", "==", roomDoc.id));
        await roomDoc.ref.delete();
      }

      // 9. Finally, delete the User profile document
      await db.collection("users").doc(uid).delete();
    }

    // 10. Delete the User from Firebase Auth
    if (adminAuth) {
      await adminAuth.deleteUser(uid);
    }

    // 11. Clear session cookies
    cookieStore.delete("session_token");
    cookieStore.delete("email_verified");

    return { success: true };
  } catch (error: any) {
    console.error("Cascading delete failed:", error);
    return { success: false, error: error.message || "Failed to delete account data" };
  }
}
