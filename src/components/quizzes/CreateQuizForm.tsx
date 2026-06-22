"use client";
// Force HMR reload

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { createQuizAction } from "@/actions/createQuiz";
import { HelpCircle, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CreateQuizForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get("materialId");

  const [materialTitle, setMaterialTitle] = useState("Loading document...");
  const [questionType, setQuestionType] = useState<"mcq" | "shortAnswer" | "theory" | "mixed">("mixed");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard" | "mixed">("medium");
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [customCount, setCustomCount] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!materialId) {
      setError("No study material selected. Please select a file from your library first.");
      setMaterialTitle("No Document");
      return;
    }

    const fetchMaterial = async () => {
      try {
        const docRef = doc(db, "studyMaterials", materialId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setMaterialTitle(docSnap.data().title || "Untitled Material");
        } else {
          setError("The selected study material could not be found.");
        }
      } catch (err) {
        console.error("Failed to load material:", err);
        setError("Error loading study material info.");
      }
    };

    fetchMaterial();
  }, [materialId]);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!materialId) return;

    const finalCount = questionCount === -1 ? parseInt(customCount) : questionCount;
    if (isNaN(finalCount) || finalCount < 1 || finalCount > 50) {
      setError("Please specify a valid question count between 1 and 50.");
      return;
    }

    setError(null);
    startTransition(async () => {
      const result = await createQuizAction(
        materialId,
        questionType,
        difficulty,
        finalCount
      );
      if (result.success && result.quiz) {
        router.push(`/dashboard/quizzes/${result.quiz.id}`);
      } else {
        setError(result.error || "Quiz generation failed.");
      }
    });
  };

  const countOptions = [5, 10, 20, 30] as const;

  return (
    <div className="flex flex-col gap-6 text-on-surface">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/materials" className="-ml-1.5 mt-1 shrink-0 transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant hover:text-primary" />
        </Link>
        <div>
          <h2 className="text-headline-small font-semibold">Generate Quiz</h2>
          <p className="text-body-small text-on-surface-variant/80">Source: {materialTitle}</p>
        </div>
      </div>

      {error && (
        <div className="p-3 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {materialId && !error && (
        <form onSubmit={handleGenerate} className="flex flex-col gap-5 bg-surface p-5 rounded-lg border border-outline/10 shadow-1">
          {/* Question Type */}
          <div>
            <label className="block text-title-medium font-semibold mb-2">Question Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "mixed", label: "Mixed Types" },
                { value: "mcq", label: "Multiple Choice" },
                { value: "shortAnswer", label: "Short Answer" },
                { value: "theory", label: "Theory" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setQuestionType(opt.value as any)}
                  className={`py-2 px-2 text-body-medium font-semibold rounded-md border transition-colors ${
                    questionType === opt.value
                      ? "bg-primary text-primary-on border-primary shadow-1"
                      : "bg-surface text-outline border-outline/30 hover:border-outline/50 hover:text-on-surface-variant"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-title-medium font-semibold mb-2">Difficulty Level</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { value: "easy", label: "Easy" },
                { value: "medium", label: "Medium" },
                { value: "hard", label: "Hard" },
                { value: "mixed", label: "Mixed" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDifficulty(opt.value as any)}
                  className={`py-2 px-1 text-body-medium font-semibold rounded-md border transition-colors ${
                    difficulty === opt.value
                      ? "bg-primary text-primary-on border-primary shadow-1"
                      : "bg-surface text-outline border-outline/30 hover:border-outline/50 hover:text-on-surface-variant"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div>
            <label className="block text-title-medium font-semibold mb-2">Number of Questions</label>
            <div className="grid grid-cols-4 gap-2 mb-3">
              {countOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`py-2 text-body-medium font-semibold rounded-md border transition-colors ${
                    questionCount === count
                      ? "bg-primary text-primary-on border-primary shadow-1"
                      : "bg-surface text-outline border-outline/30 hover:border-outline/50 hover:text-on-surface-variant"
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
            
            <label className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                name="countMode"
                checked={questionCount === -1}
                onChange={() => setQuestionCount(-1)}
                className="accent-primary"
              />
              <span className="text-body-medium font-semibold">Custom Count:</span>
              <input
                type="number"
                value={customCount}
                onChange={(e) => {
                  setCustomCount(e.target.value);
                  setQuestionCount(-1);
                }}
                placeholder="5"
                min="1"
                max="50"
                disabled={questionCount !== -1}
                onBlur={() => window.scrollTo(0, 0)}
                className="w-20 px-2 py-1 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary text-primary-on font-semibold rounded-md shadow-2 flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity mt-4"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating Assessment...
              </>
            ) : (
              <>
                <HelpCircle className="w-5 h-5" /> Generate Quiz
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
