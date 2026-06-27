"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";
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

    const fetchAttempt = async (user: any) => {
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
            setError(`Error loading quiz attempt details. You appear to be offline and this content is not cached. (Details: ${err instanceof Error ? err.message : String(err)})`);
          }
        } catch (dbErr) {
          setError(`Error loading quiz attempt details. (Details: ${err instanceof Error ? err.message : String(err)})`);
        }
      } finally {
        setLoading(false);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        setError("You must be logged in to view this quiz attempt.");
        return;
      }
      fetchAttempt(user);
    });

    return () => unsubscribeAuth();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-12 text-on-surface animate-pulse max-w-3xl mx-auto w-full">
        <div className="flex flex-col items-center justify-center py-6 bg-surface p-6 rounded-lg border border-outline/10 shadow-1">
          <div className="w-32 h-32 rounded-full border-[8px] border-surface-variant mb-4"></div>
          <div className="h-8 w-32 bg-surface-variant rounded mb-2"></div>
          <div className="h-4 w-48 bg-surface-variant rounded"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-surface p-5 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-3">
            <div className="h-5 w-32 bg-success/20 rounded mb-2"></div>
            <div className="h-4 w-full bg-surface-variant rounded"></div>
            <div className="h-4 w-5/6 bg-surface-variant rounded"></div>
          </div>
          <div className="bg-surface p-5 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-3">
            <div className="h-5 w-32 bg-error/20 rounded mb-2"></div>
            <div className="h-4 w-full bg-surface-variant rounded"></div>
            <div className="h-4 w-4/5 bg-surface-variant rounded"></div>
          </div>
        </div>
        <div className="bg-surface p-5 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-4 mt-2">
          <div className="h-6 w-48 bg-surface-variant rounded mb-2"></div>
          {[1, 2].map(i => (
            <div key={i} className="flex flex-col gap-2 p-4 border border-outline/10 rounded-md">
              <div className="h-4 w-full bg-surface-variant rounded"></div>
              <div className="h-10 w-full bg-error-container/20 rounded mt-2"></div>
              <div className="h-10 w-full bg-success-container/20 rounded mt-1"></div>
            </div>
          ))}
        </div>
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
