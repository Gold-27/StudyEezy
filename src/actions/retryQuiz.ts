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
 * Server action to generate a new quiz composed of fresh questions covering failed concepts from a previous attempt.
 */
export async function retryQuizAction(attemptId: string) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) {
    return { success: false, error: "Database connection unavailable." };
  }

  try {
    // 1. Fetch previous attempt details
    const attemptDoc = await adminDb.collection("quizAttempts").doc(attemptId).get();
    if (!attemptDoc.exists) {
      return { success: false, error: "Previous attempt records not found." };
    }

    const attemptData = attemptDoc.data();
    if (!attemptData || !attemptData.answers) {
      return { success: false, error: "No answer records available in this attempt." };
    }

    // 2. Fetch original quiz details
    const originalQuizDoc = await adminDb.collection("quizzes").doc(attemptData.quizId).get();
    if (!originalQuizDoc.exists) {
      return { success: false, error: "Original quiz reference not found." };
    }

    const originalQuizData = originalQuizDoc.data();
    if (!originalQuizData) {
      return { success: false, error: "Original quiz data is empty." };
    }

    // 3. Filter only failed questions
    const failedAnswers = attemptData.answers.filter((ans: any) => !ans.correct || (ans.scoreFraction !== undefined && ans.scoreFraction < 0.7));
    if (failedAnswers.length === 0) {
      return { success: false, error: "Congratulations! You did not fail any questions. No retake needed." };
    }

    // Find original questions matching the failed ids
    const failedQuestions = originalQuizData.questions.filter((q: any) =>
      failedAnswers.some((ans: any) => ans.questionId === q.id)
    );

    // 4. Query DeepSeek to rephrase questions covering the same concepts
    const systemPrompt = `You are a study tutor generating revision re-evaluations.
Your task is to take the failed questions provided and generate similar, newly phrased questions testing the exact same concepts.
Do NOT repeat the exact same questions. Re-write them with different wordings, numbers, or contexts.
Your output MUST be a valid JSON array of objects. Do not include markdown blocks like \`\`\`json. Each question object must have:
- "id": A unique short string (e.g. "rq1", "rq2")
- "type": Same type as the original question ("mcq", "shortAnswer", "theory")
- "question": The new rephrased question text
- "options": (Required ONLY for "mcq") An array of exactly 4 choices
- "answer": The correct answer (For "theory" questions, provide a grading rubric or key concepts standard)
- "explanation": (Optional) The detailed conceptual explanation for why this is correct`;

    const userPrompt = `Failed Questions List to Rephrase:
${JSON.stringify(failedQuestions)}`;

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.4);

    // Clean JSON response
    const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const newQuestions = JSON.parse(cleanedResponse);

    if (!Array.isArray(newQuestions)) {
      throw new Error("Invalid output formatting. Expected JSON array.");
    }

    const newQuizId = crypto.randomUUID();
    const retryTitle = `Retake: Failed Concepts - ${originalQuizData.title}`;

    // 5. Write the retry quiz to database
    await adminDb.collection("quizzes").doc(newQuizId).set({
      id: newQuizId,
      userId,
      materialId: originalQuizData.materialId,
      title: retryTitle,
      questionType: originalQuizData.questionType,
      difficulty: originalQuizData.difficulty,
      totalQuestions: newQuestions.length,
      questions: newQuestions,
      createdAt: Timestamp.now(),
    });

    return {
      success: true,
      quizId: newQuizId,
    };
  } catch (error: any) {
    console.error("Failed to generate retry quiz:", error);
    return {
      success: false,
      error: error.message || "Unable to generate retry quiz. Please try again.",
    };
  }
}
