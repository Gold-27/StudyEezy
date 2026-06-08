"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth, adminStorage } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { parseDocumentText } from "@/services/documentParser";
import { performOCR } from "@/services/ocr";

/**
 * Recovers current user uid from token sessions, with safe dev fallbacks.
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
    console.error("Session verification failed:", error);
    if (process.env.NODE_ENV === "development") {
      return "dev-user-123";
    }
    return null;
  }
}

/**
 * Server action to process uploaded files, extract text content, save to storage, and save document profile metadata in Firestore.
 */
export async function uploadStudyMaterial(formData: FormData) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  const file = formData.get("file") as File;
  const title = (formData.get("title") as string) || (file ? file.name : "Untitled Material");

  if (!file) {
    return { success: false, error: "No document file provided." };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  let fileType: "pdf" | "doc" | "docx" | "image" | null = null;

  if (extension === "pdf") fileType = "pdf";
  else if (extension === "docx") fileType = "docx";
  else if (extension === "doc") fileType = "doc";
  else if (["png", "jpg", "jpeg", "webp"].includes(extension || "")) fileType = "image";

  if (!fileType) {
    return { success: false, error: "Unsupported format. Please upload PDF, DOC, DOCX or image files." };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text content depending on file category
    let extractedText = "";
    if (fileType === "image") {
      extractedText = await performOCR(buffer);
    } else {
      extractedText = await parseDocumentText(buffer, fileType);
    }

    if (!extractedText.trim()) {
      return { success: false, error: "Unable to extract any text from this file. Please check file content." };
    }

    const materialId = crypto.randomUUID();
    let fileUrl = "";

    // Save to Firebase Storage
    if (adminStorage) {
      const bucket = adminStorage.bucket();
      const storagePath = `users/${userId}/materials/${materialId}.${extension}`;
      const blob = bucket.file(storagePath);
      
      await blob.save(buffer, {
        metadata: { contentType: file.type },
      });
      
      fileUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(storagePath)}?alt=media`;
    } else {
      console.warn("Storage Admin uninitialized. Simulated file url created.");
      fileUrl = `mock://storage/users/${userId}/materials/${materialId}.${extension}`;
    }

    // Save metadata to Firestore db
    if (adminDb) {
      await adminDb.collection("studyMaterials").doc(materialId).set({
        id: materialId,
        userId,
        title,
        fileType,
        fileUrl,
        extractedText,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } else {
      console.warn("Firestore Admin uninitialized. DB entry bypassed.");
    }

    return {
      success: true,
      material: {
        id: materialId,
        title,
        fileType,
        fileUrl,
        extractedText,
      },
    };
  } catch (error: any) {
    console.error("Server Action upload failed:", error);
    return { success: false, error: error.message || "Unable to upload study material. Please try again." };
  }
}
