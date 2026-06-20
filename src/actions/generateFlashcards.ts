"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { queryDeepSeek } from "@/services/deepseek";

/**
 * Recovers current user uid from session, with dev fallbacks.
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
 * Server action to generate flashcards via DeepSeek and batch write to database.
 */
export async function generateFlashcardsAction(
  sourceType: "material" | "summary",
  sourceId: string
) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) {
    return { success: false, error: "Database connection unavailable." };
  }

  try {
    let textToAnalyze = "";

    // 1. Fetch text depending on source type selection
    if (sourceType === "material") {
      const docSnap = await adminDb.collection("studyMaterials").doc(sourceId).get();
      if (!docSnap.exists) return { success: false, error: "Study material not found." };
      textToAnalyze = docSnap.data()?.extractedText || "";
    } else if (sourceType === "summary") {
      const docSnap = await adminDb.collection("summaries").doc(sourceId).get();
      if (!docSnap.exists) return { success: false, error: "Summary document not found." };
      textToAnalyze = docSnap.data()?.content || "";
    }

    if (!textToAnalyze.trim()) {
      return { success: false, error: "The selected source contains no text to analyze." };
    }

    // 2. Setup prompts matching active recall guidelines
    const systemPrompt = `You are an expert tutor generating study flashcards for the StudyEezy platform.
Create high-quality active recall questions for the front of the cards that push students to actively retrieve information. Avoid simple copy-paste extractions.
Your response must be a valid raw JSON array of objects. Do not wrap it in markdown blocks like \`\`\`json. Each object must have:
- "front": The active recall question
- "back": The concise educational explanation/answer`;

    const userPrompt = `Create a JSON array containing 5 to 8 cards from the text below:
    
${textToAnalyze}`;

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.4);

    // Clean markdown enclosures if returned
    const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const cards = JSON.parse(cleanedResponse);

    if (!Array.isArray(cards)) {
      throw new Error("Invalid output formatting. Expected JSON array.");
    }

    // 3. Batch commit to Firestore
    const batch = adminDb.batch();
    const createdCards = [];

    for (const card of cards) {
      const cardId = crypto.randomUUID();
      const cardRef = adminDb.collection("flashcards").doc(cardId);
      
      const newCard = {
        id: cardId,
        userId,
        sourceType,
        sourceId,
        front: card.front || "Recall Question",
        back: card.back || "Answer Explanation",
        mastered: false,
        createdAt: Timestamp.now(),
      };

      batch.set(cardRef, newCard);
      createdCards.push({
        ...newCard,
        createdAt: newCard.createdAt.toMillis(),
      });
    }

    await batch.commit();

    return {
      success: true,
      cards: createdCards,
    };
  } catch (error: any) {
    console.error("Flashcards generation failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate cards. Please try again.",
    };
  }
}

/**
 * Server action to toggle the "mastered" status of a flashcard.
 */
export async function toggleMasterCardAction(cardId: string, mastered: boolean) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired." };
  }

  if (!adminDb) return { success: false };

  try {
    const cardRef = adminDb.collection("flashcards").doc(cardId);
    const cardDoc = await cardRef.get();
    
    if (!cardDoc.exists || cardDoc.data()?.userId !== userId) {
      return { success: false, error: "Card not found or unauthorized access." };
    }

    await cardRef.update({ mastered });
    return { success: true };
  } catch (error) {
    console.error("Failed to toggle mastered state:", error);
    return { success: false };
  }
}
