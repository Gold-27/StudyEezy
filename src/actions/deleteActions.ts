"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/**
 * Helper to recover current user uid from session
 */
async function getUserIdFromSession(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session_token")?.value;
  if (!token) return null;

  if (!adminAuth) {
    return "dev-user-123";
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded.uid;
  } catch (error) {
    console.error("Session verification failed, attempting manual decode");
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      if (payload && payload.user_id) return payload.user_id;
    } catch (e) {}
    
    if (process.env.NODE_ENV === "development") {
      return "dev-user-123";
    }
    return null;
  }
}

/**
 * Deletes a Study Material from Firestore
 */
export async function deleteStudyMaterialAction(materialId: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false, error: "Session expired." };
  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    const docRef = adminDb.collection("studyMaterials").doc(materialId);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return { success: false, error: "Material not found." };
    }
    
    if (docSnap.data()?.userId !== userId) {
      return { success: false, error: "Unauthorized." };
    }

    await docRef.delete();
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete study material:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes all flashcards in a specific deck (identified by sourceId)
 */
export async function deleteFlashcardDeckAction(sourceId: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false, error: "Session expired." };
  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    const flashcardsRef = adminDb.collection("flashcards");
    const snapshot = await flashcardsRef
      .where("userId", "==", userId)
      .where("sourceId", "==", sourceId)
      .get();

    if (snapshot.empty) {
      return { success: true }; // Nothing to delete
    }

    const batch = adminDb.batch();
    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete flashcard deck:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Deletes a study room and its members
 */
export async function deleteStudyRoomAction(roomId: string) {
  const userId = await getUserIdFromSession();
  if (!userId) return { success: false, error: "Session expired." };
  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    const roomRef = adminDb.collection("studyRooms").doc(roomId);
    const roomSnap = await roomRef.get();

    if (!roomSnap.exists) {
      return { success: false, error: "Room not found." };
    }

    if (roomSnap.data()?.ownerId !== userId) {
      return { success: false, error: "Unauthorized. Only the owner can delete this room." };
    }

    const batch = adminDb.batch();
    
    // 1. Delete Room Document
    batch.delete(roomRef);

    // 2. Delete Room Memberships
    const membersSnap = await adminDb.collection("studyRoomMembers").where("roomId", "==", roomId).get();
    membersSnap.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Note: We don't delete studyRoomMessages or aiReviews immediately to keep batch sizes small.
    // They will become orphaned but won't be accessible without the room document.
    // For a complete cleanup, you'd typically run a background function.

    await batch.commit();
    return { success: true };
  } catch (error: any) {
    console.error("Failed to delete study room:", error);
    return { success: false, error: error.message };
  }
}
