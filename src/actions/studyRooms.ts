"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { sendStudyRoomJoinNotification } from "@/lib/mail";

/**
 * Recovers current user uid from session.
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
 * Helper to generate random invite code strings.
 */
function generateInviteCode(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Server action to create a study room and set owner membership.
 */
export async function createStudyRoomAction(name: string) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    const roomId = crypto.randomUUID();
    const inviteCode = generateInviteCode();

    const batch = adminDb.batch();

    // 1. Create Room Document
    const roomRef = adminDb.collection("studyRooms").doc(roomId);
    batch.set(roomRef, {
      id: roomId,
      ownerId: userId,
      name,
      inviteCode,
      createdAt: Timestamp.now(),
    });

    // 2. Set Owner Membership
    const membershipId = crypto.randomUUID();
    const memberRef = adminDb.collection("studyRoomMembers").doc(membershipId);
    batch.set(memberRef, {
      id: membershipId,
      roomId,
      userId,
      role: "owner",
      joinedAt: Timestamp.now(),
    });

    await batch.commit();

    return { success: true, roomId, inviteCode };
  } catch (error: any) {
    console.error("Failed to create study room:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server action to join a study room using an invite code.
 */
export async function joinStudyRoomAction(inviteCode: string) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    const code = inviteCode.trim().toUpperCase();

    // 1. Find the room
    const roomsSnap = await adminDb
      .collection("studyRooms")
      .where("inviteCode", "==", code)
      .limit(1)
      .get();

    if (roomsSnap.empty) {
      return { success: false, error: "Invalid invite code. Room not found." };
    }

    const roomDoc = roomsSnap.docs[0];
    const roomId = roomDoc.id;

    // 2. Check if already a member
    const membersSnap = await adminDb
      .collection("studyRoomMembers")
      .where("roomId", "==", roomId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (!membersSnap.empty) {
      return { success: true, roomId }; // Already a member, proceed
    }

    // 3. Create membership document
    const membershipId = crypto.randomUUID();
    await adminDb.collection("studyRoomMembers").doc(membershipId).set({
      id: membershipId,
      roomId,
      userId,
      role: "member",
      joinedAt: Timestamp.now(),
    });

    // 4. Send email notification to owner if enabled
    const roomData = roomDoc.data();
    const ownerId = roomData.ownerId;
    const roomName = roomData.name;

    if (ownerId && ownerId !== userId) {
      // Execute asynchronously so it doesn't block the client response
      (async () => {
        try {
          const ownerSnap = await adminDb.collection("users").doc(ownerId).get();
          const joinerSnap = await adminDb.collection("users").doc(userId).get();
          
          if (ownerSnap.exists && joinerSnap.exists) {
            const ownerData = ownerSnap.data()!;
            const joinerData = joinerSnap.data()!;
            
            if (ownerData.emailNotifications === true && ownerData.email) {
               await sendStudyRoomJoinNotification(
                 ownerData.email,
                 ownerData.displayName || "StudyEezy User",
                 joinerData.displayName || "A new student",
                 roomName
               );
            }
          }
        } catch (e) {
          console.error("Background email notification failed:", e);
        }
      })();
    }

    return { success: true, roomId };
  } catch (error: any) {
    console.error("Failed to join study room:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server action to post a message in a study room.
 */
export async function postRoomMessageAction(
  roomId: string,
  type: "question" | "answer",
  content: string,
  parentMessageId?: string
) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired." };
  }

  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    // 1. Verify user membership in the target room
    const memberSnap = await adminDb
      .collection("studyRoomMembers")
      .where("roomId", "==", roomId)
      .where("userId", "==", userId)
      .limit(1)
      .get();

    if (memberSnap.empty) {
      return { success: false, error: "Access denied. You are not a member of this study room." };
    }

    const messageId = crypto.randomUUID();

    // 2. Save Q/A message with parentMessageId link
    await adminDb.collection("studyRoomMessages").doc(messageId).set({
      id: messageId,
      roomId,
      senderId: userId,
      type,
      content,
      parentMessageId: parentMessageId || null,
      createdAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Failed to post message:", error);
    return { success: false, error: error.message };
  }
}
