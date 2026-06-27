"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Quiz } from "@/types";
import QuizRunner from "@/components/quizzes/QuizRunner";
import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";
import { putOfflineItem, getOfflineItem } from "@/lib/indexedDb";

export default function ActiveQuizPage() {
  const params = useParams();
  const id = params.id as string;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    const fetchQuiz = async () => {
      try {
        const docRef = doc(db, "quizzes", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetchedQuiz = { id: docSnap.id, ...docSnap.data() } as Quiz;
          setQuiz(fetchedQuiz);
          try {
            await putOfflineItem("quizzes", fetchedQuiz);
          } catch (e) {
            console.warn("Failed to cache quiz offline in IndexedDB:", e);
          }
        } else {
          // Check local IndexedDB fallback
          const cached = await getOfflineItem("quizzes", id);
          if (cached) {
            setQuiz(cached);
          } else {
            setError("The quiz document could not be found.");
          }
        }
      } catch (err) {
        console.error("Failed to load active quiz, checking offline cache:", err);
        try {
          const cached = await getOfflineItem("quizzes", id);
          if (cached) {
            setQuiz(cached);
          } else {
            setError("Error loading quiz content. You appear to be offline and this content is not cached.");
          }
        } catch (dbErr) {
          setError("Error loading quiz content.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6 pb-12 text-on-surface animate-pulse">
        <div className="flex flex-col items-center">
          <div className="h-8 w-64 bg-surface-variant rounded mb-2"></div>
          <div className="h-4 w-48 bg-surface-variant rounded mt-1"></div>
        </div>
        <div className="bg-surface p-6 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-5 mt-4">
          <div className="h-4 w-32 bg-surface-variant rounded mb-2"></div>
          <div className="h-6 w-full bg-surface-variant rounded mb-4"></div>
          <div className="flex flex-col gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-[52px] w-full bg-surface-variant rounded-md"></div>)}
          </div>
        </div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="py-12 text-center flex flex-col gap-3 items-center text-on-surface">
        <AlertCircle className="w-8 h-8 text-error" />
        <p className="text-body-medium text-error font-semibold">{error || "Quiz not found."}</p>
        <Link
          href="/dashboard"
          className="text-primary hover:underline font-medium flex items-center gap-1 text-body-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-12 text-on-surface">
      <div className="text-center">
        <h2 className="text-headline-small font-semibold text-primary truncate max-w-sm mx-auto">
          {quiz.title}
        </h2>
        <p className="text-body-small text-on-surface-variant/80 mt-1 capitalize">
          Difficulty: {quiz.difficulty} &bull; Type: {quiz.questionType === "mcq" ? "Multiple Choice" : quiz.questionType}
        </p>
      </div>

      <QuizRunner quiz={quiz} />
    </div>
  );
}
