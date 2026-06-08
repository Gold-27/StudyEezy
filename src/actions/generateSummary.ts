"use server";

import { cookies } from "next/headers";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";
import { queryDeepSeek } from "@/services/deepseek";

/**
 * Retrieves the current logged in user UID with dev fallbacks.
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
 * Returns specific prompt instructions according to the chosen summary format.
 */
function getSummaryUserPrompt(text: string, type: "short" | "detailed" | "revision" | "keyConcepts" | "examPrep"): string {
  let instruction = "";
  switch (type) {
    case "short":
      instruction = "Create a concise Short Summary of the text below. Focus on presenting high-level core themes and summaries, ensuring it is very fast to read and easy to skim.";
      break;
    case "detailed":
      instruction = "Create a comprehensive, Detailed Summary of the text below. Provide deep explanations of each sub-topic, exhaustive concept coverages, and clear structured headers.";
      break;
    case "revision":
      instruction = "Create Revision Notes of the text below. Render the output using clean bullet points and list groups to enable quick scrolling and recall revision.";
      break;
    case "keyConcepts":
      instruction = "Identify and list all Key Concepts, definitions, and equations/formulas present in the text below. Provide clear, textbook-like explanations and principles for each term.";
      break;
    case "examPrep":
      instruction = "Create an Exam Prep Summary of the text below. Highlight high-yield topics, critical facts, potential examination questions, and key keywords frequently tested.";
      break;
  }
  return `${instruction}\n\nStudy Material Text:\n${text}`;
}

/**
 * Server action to generate summaries using DeepSeek completions and save to database.
 */
export async function generateSummaryAction(
  materialId: string,
  summaryType: "short" | "detailed" | "revision" | "keyConcepts" | "examPrep"
) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) {
    return { success: false, error: "Database connection unavailable." };
  }

  try {
    // 1. Fetch material content
    const materialDoc = await adminDb.collection("studyMaterials").doc(materialId).get();
    if (!materialDoc.exists) {
      return { success: false, error: "Study material not found." };
    }

    const materialData = materialDoc.data();
    if (!materialData || !materialData.extractedText) {
      return { success: false, error: "Study material has no extracted text. Run OCR first." };
    }

    // 2. Query DeepSeek
    const systemPrompt = "You are a specialized StudyEezy academic tutor. Synthesize study material text into highly structured, clear, and educational markdown documents. Write standard markdown, do not include introduction greetings, and prioritize conceptual clarity.";
    const userPrompt = getSummaryUserPrompt(materialData.extractedText, summaryType);

    const generatedContent = await queryDeepSeek(systemPrompt, userPrompt, 0.3);

    if (!generatedContent.trim()) {
      return { success: false, error: "AI summary generation returned empty content." };
    }

    // 3. Save to database
    const summaryId = crypto.randomUUID();
    const title = `Summary (${summaryType}) - ${materialData.title}`;

    await adminDb.collection("summaries").doc(summaryId).set({
      id: summaryId,
      userId,
      materialId,
      summaryType,
      title,
      content: generatedContent,
      createdAt: Timestamp.now(),
    });

    return {
      success: true,
      summary: {
        id: summaryId,
        title,
        content: generatedContent,
        summaryType,
      },
    };
  } catch (error: any) {
    console.error("Summary generation failed:", error);
    return {
      success: false,
      error: error.message || "Unable to generate summary. Please try again.",
    };
  }
}
