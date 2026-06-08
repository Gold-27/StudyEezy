"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { queryDeepSeek } from "@/services/deepseek";
import { UserAnswer } from "@/types";

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
 * Server action to grade quiz submission, leveraging DeepSeek for evaluation and saving reports in Firestore.
 */
export async function submitQuizAction(
  quizId: string,
  userResponses: { questionId: string; userAnswer: string }[]
) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) {
    return { success: false, error: "Database connection unavailable." };
  }

  try {
    // 1. Retrieve the parent quiz questions
    const quizDoc = await adminDb.collection("quizzes").doc(quizId).get();
    if (!quizDoc.exists) {
      return { success: false, error: "Quiz not found." };
    }

    const quizData = quizDoc.data();
    if (!quizData || !quizData.questions) {
      return { success: false, error: "Quiz questions not found." };
    }

    // 2. Query DeepSeek to grade subjective/short answers and compile feedback report card
    const systemPrompt = `You are an expert grading evaluator for StudyEezy.
Analyze the user's responses against the correct answers/rubrics provided in the quiz questions.
For multiple-choice (mcq) and shortAnswer types, grade strictly (1 for correct, 0 for incorrect).
For theory types, evaluate the response subjectively, assigning a fractional score (0.0 to 1.0) and detailing strengths or omitted concepts.
Your output must be a valid raw JSON object. Do not include markdown blocks like \`\`\`json. The JSON must exactly match this structure:
{
  "score": number (sum of correct items, counting Theory fractional grades),
  "percentage": number (score divided by total questions * 100),
  "grade": string (A, B, C, D, or F),
  "answers": [
    {
      "questionId": string,
      "userAnswer": string,
      "correctAnswer": string,
      "correct": boolean (true if scoreFraction >= 0.7, else false),
      "scoreFraction": number (0.0 to 1.0),
      "explanation": string (rubric review explaining strengths and missing items)
    }
  ],
  "weakTopics": string[],
  "recommendations": string[]
}`;

    const userPrompt = `Quiz Context:
Questions: ${JSON.stringify(quizData.questions)}
User Submissions: ${JSON.stringify(userResponses)}`;

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.2);

    // Clean JSON response
    const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const evaluation = JSON.parse(cleanedResponse);

    const attemptId = crypto.randomUUID();

    // 3. Save Attempt report to Firestore
    await adminDb.collection("quizAttempts").doc(attemptId).set({
      id: attemptId,
      userId,
      quizId,
      score: evaluation.score,
      percentage: evaluation.percentage,
      grade: evaluation.grade,
      answers: evaluation.answers as UserAnswer[],
      weakTopics: evaluation.weakTopics || [],
      recommendations: evaluation.recommendations || [],
      submittedAt: Timestamp.now(),
    });

    return {
      success: true,
      attemptId,
      report: evaluation,
    };
  } catch (error: any) {
    console.error("Quiz evaluation failed:", error);
    return {
      success: false,
      error: error.message || "Failed to submit and evaluate quiz. Please try again.",
    };
  }
}
