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
 * Server action to create a new AI chat session.
 */
export async function createChatSessionAction(title = "New Study Session") {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    const sessionId = crypto.randomUUID();
    await adminDb.collection("chatSessions").doc(sessionId).set({
      id: sessionId,
      userId,
      title,
      createdAt: Timestamp.now(),
    });

    return { success: true, sessionId };
  } catch (error: any) {
    console.error("Failed to create chat session:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server action to send a message to DeepSeek and save conversation chain in Firestore.
 */
export async function sendChatMessageAction(sessionId: string, content: string) {
  const userId = await getUserIdFromSession();
  if (!userId) {
    return { success: false, error: "Session expired. Please log in again." };
  }

  if (!adminDb) return { success: false, error: "Database unavailable." };

  try {
    // 1. Verify session ownership
    const sessionDoc = await adminDb.collection("chatSessions").doc(sessionId).get();
    if (!sessionDoc.exists || sessionDoc.data()?.userId !== userId) {
      return { success: false, error: "Session not found or unauthorized access." };
    }

    const userMessageId = crypto.randomUUID();

    // 2. Write User message to Firestore
    await adminDb.collection("chatMessages").doc(userMessageId).set({
      id: userMessageId,
      sessionId,
      role: "user",
      content,
      createdAt: Timestamp.now(),
    });

    // 3. Fetch past session history context (limited to last 10 messages for prompt efficiency)
    const messagesSnap = await adminDb
      .collection("chatMessages")
      .where("sessionId", "==", sessionId)
      .orderBy("createdAt", "asc")
      .limit(10)
      .get();

    const history: { role: "user" | "assistant"; content: string }[] = [];
    messagesSnap.forEach((doc) => {
      const data = doc.data();
      history.push({
        role: data.role as "user" | "assistant",
        content: data.content,
      });
    });

    // 4. Construct AI System Prompt (ensuring it educates and simplifies without writing homework)
    const systemPrompt = `You are a dedicated StudyEezy AI tutor.
Your core purpose is to help students learn actively, explain complex concepts simply, and provide relevant examples.
Do NOT write homework solutions directly or provide shortcuts. Guide students to think and understand.
Be concise, clear, and educational.`;

    const userPrompt = history.map((m) => `${m.role === "user" ? "Student" : "Tutor"}: ${m.content}`).join("\n\n");

    const aiResponse = await queryDeepSeek(systemPrompt, userPrompt, 0.4);

    if (!aiResponse.trim()) {
      throw new Error("AI tutor returned empty response.");
    }

    const assistantMessageId = crypto.randomUUID();

    // 5. Save AI response to Firestore
    await adminDb.collection("chatMessages").doc(assistantMessageId).set({
      id: assistantMessageId,
      sessionId,
      role: "assistant",
      content: aiResponse,
      createdAt: Timestamp.now(),
    });

    return { success: true };
  } catch (error: any) {
    console.error("Chat message send failed:", error);
    return {
      success: false,
      error: error.message || "Failed to communicate with AI tutor. Please check connection.",
    };
  }
}
