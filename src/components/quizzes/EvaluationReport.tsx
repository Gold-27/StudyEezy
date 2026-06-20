"use client";

import React, { useTransition, useState } from "react";
import { QuizAttempt } from "@/types";
import { retryQuizAction } from "@/actions/retryQuiz";
import { useRouter } from "next/navigation";
import { Award, AlertCircle, BookOpen, RefreshCw, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

interface EvaluationReportProps {
  attempt: QuizAttempt;
  quiz?: any | null;
}

export default function EvaluationReport({ attempt, quiz }: EvaluationReportProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleRetake = () => {
    setError(null);
    startTransition(async () => {
      const result = await retryQuizAction(attempt.id);
      if (result.success && result.quizId) {
        router.push(`/dashboard/quizzes/${result.quizId}`);
      } else {
        setError(result.error || "Failed to generate retry quiz focusing on weak concepts.");
      }
    });
  };

  const getGradeColor = (grade: string) => {
    switch (grade.toUpperCase()) {
      case "A": return "text-success bg-success-container/10 border-success/30";
      case "B": return "text-success bg-success-container/5 border-success/20";
      case "C": return "text-primary bg-primary-container/10 border-primary/20";
      case "D": return "text-error bg-error-container/5 border-error/10";
      default: return "text-error bg-error-container/10 border-error/30";
    }
  };

  return (
    <div className="flex flex-col gap-6 text-on-surface w-full max-w-md mx-auto pb-12">
      {/* Score Summary Banner */}
      <section className="bg-surface p-5 rounded-lg border border-outline/10 shadow-1 text-center flex flex-col items-center gap-2">
        <Award className="w-10 h-10 text-primary mb-1" />
        <h3 className="text-title-medium font-semibold">Quiz Result Card</h3>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-display-small font-bold text-primary">{attempt.score}</span>
          <span className="text-body-medium text-on-surface-variant/80">/ {attempt.answers.length}</span>
        </div>
        <div className="flex gap-2 mt-2">
          <span className="px-3 py-1 bg-surface-variant border border-outline/20 rounded-full text-body-small font-bold">
            {attempt.percentage}% Correct
          </span>
          <span className={`px-3 py-1 border rounded-full text-body-small font-bold uppercase ${getGradeColor(attempt.grade)}`}>
            Grade {attempt.grade}
          </span>
        </div>
      </section>

      {error && (
        <div className="p-3 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Retake Weak Areas Trigger */}
      <button
        onClick={handleRetake}
        disabled={isPending}
        className="w-full py-3 bg-secondary text-secondary-on rounded-md shadow-2 font-semibold text-body-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
      >
        {isPending ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <>
            <RefreshCw className="w-4 h-4" /> Retake Failed Concepts
          </>
        )}
      </button>

      {/* Weak Topics & Recommendations */}
      {(attempt.weakTopics?.length > 0 || attempt.recommendations?.length > 0) && (
        <section className="bg-surface p-5 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-4">
          {attempt.weakTopics?.length > 0 && (
            <div>
              <h4 className="text-title-small font-semibold text-error mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Areas Requiring Revision
              </h4>
              <ul className="list-disc list-inside text-body-medium text-on-surface-variant/90 space-y-1 pl-1">
                {attempt.weakTopics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {attempt.recommendations?.length > 0 && (
            <div className="border-t border-outline/10 pt-3">
              <h4 className="text-title-small font-semibold text-primary mb-2 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4" /> Study Recommendations
              </h4>
              <ul className="list-disc list-inside text-body-medium text-on-surface-variant/90 space-y-1 pl-1">
                {attempt.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {/* Question Review List */}
      <section className="flex flex-col gap-4">
        <h4 className="text-title-small font-semibold text-on-background">Correction Review</h4>

        <div className="flex flex-col gap-4">
          {attempt.answers.map((ans, i) => (
            <div
              key={i}
              className={`p-5 rounded-lg border bg-surface shadow-1 flex flex-col gap-3 ${
                ans.correct ? "border-success/20" : "border-error/20"
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className="text-body-small font-bold text-on-surface-variant">
                  Question {i + 1}
                </span>
                {ans.correct ? (
                  <span className="text-success text-body-small font-semibold flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Correct
                  </span>
                ) : (
                  <span className="text-error text-body-small font-semibold flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> Incorrect
                  </span>
                )}
              </div>

              {/* Question Text */}
              {quiz?.questions?.find((q: any) => q.id === ans.questionId)?.question && (
                <div className="text-body-medium font-semibold text-on-surface leading-snug">
                  {quiz.questions.find((q: any) => q.id === ans.questionId).question}
                </div>
              )}

              {/* User Answer vs Correct Answer */}
              <div className="flex flex-col gap-2 bg-surface-variant/30 p-3 rounded-md border border-outline/5 text-body-medium">
                <div>
                  <span className="text-body-small font-semibold text-on-surface-variant">Your Answer:</span>
                  <p className="mt-0.5 text-on-surface font-medium">{ans.userAnswer || "(Left Blank)"}</p>
                </div>
                {!ans.correct && (
                  <div className="border-t border-outline/5 pt-2 mt-2">
                    <span className="text-body-small font-semibold text-on-surface-variant">Expected Answer:</span>
                    <p className="mt-0.5 text-success font-medium">{ans.correctAnswer}</p>
                  </div>
                )}
              </div>

              {/* AI Grading comment / explanation */}
              {ans.explanation && (
                <div className="text-body-medium text-on-surface-variant leading-relaxed">
                  <span className="block text-body-small font-bold text-primary mb-1">Tutor Explanation:</span>
                  {ans.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      <Link
        href="/dashboard"
        className="text-primary hover:underline font-semibold flex items-center justify-center gap-1 mt-4 text-body-medium"
      >
        Go back to Dashboard <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
