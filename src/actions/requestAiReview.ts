"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { queryDeepSeek } from "@/services/deepseek";

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
    if (process.env.NODE_ENV === "development") {
      return "dev-user-123";
    }
    return null;
  }
}

/**
 * Server action to evaluate a peer answer using DeepSeek and record the review card.
 */
export async function requestAiReviewAction(
  roomId: string,
  questionId: string,
  answerId: string
) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) return { success: false, error: "Database connection unavailable." };

  try {
    // 1. Check if AI review already exists to optimize token consumption
    const existingReviewSnap = await adminDb
      .collection("aiReviews")
      .where("answerId", "==", answerId)
      .limit(1)
      .get();

    if (!existingReviewSnap.empty) {
      return {
        success: true,
        review: existingReviewSnap.docs[0].data(),
      };
    }

    // 2. Load question and answer messages text
    const questionDoc = await adminDb.collection("studyRoomMessages").doc(questionId).get();
    const answerDoc = await adminDb.collection("studyRoomMessages").doc(answerId).get();

    if (!questionDoc.exists || !answerDoc.exists) {
      return { success: false, error: "Question or answer message not found." };
    }

    const questionText = questionDoc.data()?.content || "";
    const answerText = answerDoc.data()?.content || "";

    // 3. Setup prompt instructions for DeepSeek Review Mode
    const systemPrompt = `You are the StudyEezy AI Reviewer.
Your role is to evaluate a peer answer submitted in a study room against a specific question.
Do NOT automatically reply to the question yourself. Grade the answer constructively.
Your output must be a valid raw JSON object. Do not include markdown blocks like \`\`\`json. The JSON must exactly match this structure:
{
  "score": number (evaluation score between 1 and 10),
  "strengths": string[] (bullet points of correct concepts explained),
  "missingConcepts": string[] (bullet points of omitted concepts or information),
  "improvements": string[] (bullet points of practical recommendations to improve the response),
  "modelAnswer": string (the ideal model answer that fully satisfies the question)
}`;

    const userPrompt = `Evaluate the answer below:
Question: ${questionText}
Peer Answer: ${answerText}`;

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.3);

    // Clean JSON response
    const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const reviewData = JSON.parse(cleanedResponse);

    const reviewId = crypto.randomUUID();
    const review = {
      id: reviewId,
      roomId,
      questionId,
      answerId,
      score: reviewData.score || 0,
      strengths: reviewData.strengths || [],
      missingConcepts: reviewData.missingConcepts || [],
      improvements: reviewData.improvements || [],
      modelAnswer: reviewData.modelAnswer || "Ideal Answer",
      createdAt: Timestamp.now(),
    };

    // 4. Save review document to Firestore
    await adminDb.collection("aiReviews").doc(reviewId).set(review);

    return {
      success: true,
      review,
    };
  } catch (error: any) {
    console.error("AI Review execution failed:", error);
    return {
      success: false,
      error: error.message || "Failed to complete AI review. Please retry.",
    };
  }
}
