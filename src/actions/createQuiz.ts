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
 * Server action to generate custom quizzes using DeepSeek and save to Firestore database.
 */
export async function createQuizAction(
  materialId: string,
  questionType: "mcq" | "shortAnswer" | "theory" | "mixed",
  difficulty: "easy" | "medium" | "hard" | "mixed",
  totalQuestions: number
) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) {
    return { success: false, error: "Database connection unavailable." };
  }

  try {
    // 1. Fetch source material text
    const docSnap = await adminDb.collection("studyMaterials").doc(materialId).get();
    if (!docSnap.exists) {
      return { success: false, error: "Study material document not found." };
    }

    const materialData = docSnap.data();
    if (!materialData || !materialData.extractedText) {
      return { success: false, error: "Study material contains no readable text." };
    }

    // 2. Build DeepSeek prompts
    const systemPrompt = `You are an expert assessment generator for the StudyEezy platform.
Generate a list of high-quality, educationally rigorous quiz questions based on the provided text.
Questions should focus on testing key concepts and comprehension, avoiding simple search-and-replace wordings.
Your output MUST be a valid JSON array of objects. Do not include markdown blocks like \`\`\`json. Each question object must have:
- "id": A unique short string (e.g. "q1", "q2")
- "type": One of "mcq", "shortAnswer", "theory"
- "question": The question text
- "options": (Required ONLY for "mcq") An array of exactly 4 choices
- "answer": The correct answer (For "theory" questions, provide a grading rubric or key concepts standard)
- "explanation": (Optional) The detailed conceptual explanation for why this is correct`;

    const userPrompt = `Generate a ${difficulty} difficulty quiz of exactly ${totalQuestions} questions of type ${questionType} based on the text below:

${materialData.extractedText}`;

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.4);

    // Clean JSON response
    const cleanedResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const questions = JSON.parse(cleanedResponse);

    if (!Array.isArray(questions)) {
      throw new Error("Invalid output formatting. Expected JSON array.");
    }

    const quizId = crypto.randomUUID();
    const title = `Quiz (${questionType} - ${difficulty}) - ${materialData.title}`;

    // 3. Save to database
    await adminDb.collection("quizzes").doc(quizId).set({
      id: quizId,
      userId,
      materialId,
      title,
      questionType,
      difficulty,
      totalQuestions: questions.length,
      questions,
      createdAt: Timestamp.now(),
    });

    return {
      success: true,
      quiz: {
        id: quizId,
        title,
        questionsCount: questions.length,
      },
    };
  } catch (error: any) {
    console.error("Quiz generation failed:", error);
    return {
      success: false,
      error: error.message || "Failed to generate quiz. Please try again.",
    };
  }
}
