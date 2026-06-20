"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { QuizAttempt } from "@/types";
import EvaluationReport from "@/components/quizzes/EvaluationReport";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { putOfflineItem, getOfflineItem } from "@/lib/indexedDb";

export default function QuizEvaluationPage() {
  const params = useParams();
  const attemptId = params.attemptId as string;

  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!attemptId) return;

    const fetchAttempt = async () => {
      try {
        const docRef = doc(db, "quizAttempts", attemptId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetchedAttempt = { id: docSnap.id, ...docSnap.data() } as QuizAttempt;
          setAttempt(fetchedAttempt);
          try {
            await putOfflineItem("attempts", fetchedAttempt);
          } catch (e) {
            console.warn("Failed to cache quiz attempt offline in IndexedDB:", e);
          }
          
          // Fetch parent quiz to get question texts
          try {
            const quizDocRef = doc(db, "quizzes", fetchedAttempt.quizId);
            const quizDocSnap = await getDoc(quizDocRef);
            if (quizDocSnap.exists()) {
              const fetchedQuiz = { id: quizDocSnap.id, ...quizDocSnap.data() };
              setQuiz(fetchedQuiz);
              await putOfflineItem("quizzes", fetchedQuiz);
            } else {
              const cachedQuiz = await getOfflineItem("quizzes", fetchedAttempt.quizId);
              if (cachedQuiz) setQuiz(cachedQuiz);
            }
          } catch (quizErr) {
            console.warn("Failed to fetch parent quiz, checking cache:", quizErr);
            const cachedQuiz = await getOfflineItem("quizzes", fetchedAttempt.quizId);
            if (cachedQuiz) setQuiz(cachedQuiz);
          }
        } else {
          // Check local IndexedDB fallback
          const cached = await getOfflineItem("attempts", attemptId);
          if (cached) {
            setAttempt(cached);
            const cachedQuiz = await getOfflineItem("quizzes", cached.quizId);
            if (cachedQuiz) setQuiz(cachedQuiz);
          } else {
            setError("This quiz attempt records could not be found.");
          }
        }
      } catch (err) {
        console.error("Failed to load attempt, checking offline cache:", err);
        try {
          const cached = await getOfflineItem("attempts", attemptId);
          if (cached) {
            setAttempt(cached);
            const cachedQuiz = await getOfflineItem("quizzes", cached.quizId);
            if (cachedQuiz) setQuiz(cachedQuiz);
          } else {
            setError("Error loading quiz attempt details. You appear to be offline and this content is not cached.");
          }
        } catch (dbErr) {
          setError("Error loading quiz attempt details.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAttempt();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="py-12 text-center text-body-medium text-on-surface-variant/70">
        Evaluating quiz responses and generating feedback...
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="py-12 text-center flex flex-col gap-3 items-center text-on-surface">
        <AlertCircle className="w-8 h-8 text-error" />
        <p className="text-body-medium text-error font-semibold">{error || "Attempt not found."}</p>
        <Link
          href="/dashboard"
          className="text-primary hover:underline font-medium flex items-center gap-1 text-body-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return <EvaluationReport attempt={attempt} quiz={quiz} />;
}
