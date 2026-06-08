"use server";

import { cookies } from "next/headers";
import { adminDb } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

/**
 * Sets session cookies after authentication state changes on the client.
 */
export async function setAuthSession(token: string | null, emailVerified: boolean) {
  const cookieStore = await cookies();
  if (token) {
    cookieStore.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });
    cookieStore.set("email_verified", emailVerified ? "true" : "false", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
  } else {
    cookieStore.delete("session_token");
    cookieStore.delete("email_verified");
  }
}

/**
 * Clears session cookies on logout.
 */
export async function clearAuthSession() {
  const cookieStore = await cookies();
  cookieStore.delete("session_token");
  cookieStore.delete("email_verified");
}

/**
 * Creates user profile document in Firestore database upon initial sign up.
 */
export async function createUserProfile(uid: string, name: string, email: string) {
  if (!adminDb) {
    console.warn("Firestore Admin database not initialized. Simulating user profile creation.");
    return { success: true };
  }

  try {
    const userRef = adminDb.collection("users").doc(uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      await userRef.set({
        id: uid,
        name,
        email,
        emailVerified: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    }
    return { success: true };
  } catch (error: any) {
    console.error("Failed to create user profile in firestore:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Updates firestore profile and session cookies once email verification is successful.
 */
export async function updateUserVerification(uid: string) {
  if (!adminDb) {
    console.warn("Firestore Admin database not initialized. Simulating email verification update.");
    const cookieStore = await cookies();
    cookieStore.set("email_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return { success: true };
  }
  
  try {
    const userRef = adminDb.collection("users").doc(uid);
    await userRef.update({
      emailVerified: true,
      updatedAt: Timestamp.now(),
    });
    
    const cookieStore = await cookies();
    cookieStore.set("email_verified", "true", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    return { success: true };
  } catch (error) {
    console.error("Failed to update user verification state:", error);
    return { success: false };
  }
}
