"use client";

import React, { useState, useTransition, useCallback, useEffect } from "react";
import { Quiz } from "@/types";
import { submitQuizAction } from "@/actions/submitQuiz";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, HelpCircle, CheckSquare, AlertCircle, RefreshCw, Mic } from "lucide-react";
import { useVoiceInput } from "@/hooks/useVoiceInput";

interface QuizRunnerProps {
  quiz: Quiz;
}

export default function QuizRunner({ quiz }: QuizRunnerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const questions = quiz.questions;
  const currentQuestion = questions[currentIndex];

  const handleVoiceTranscript = useCallback((transcript: string) => {
    setResponses((prev) => {
      const existing = prev[currentQuestion.id] || "";
      return {
        ...prev,
        [currentQuestion.id]: existing + (existing ? " " : "") + transcript,
      };
    });
  }, [currentQuestion?.id]);

  const { isListening, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceInput(handleVoiceTranscript);

  // Stop listening when navigating to another question
  useEffect(() => {
    stopListening();
  }, [currentIndex, stopListening]);

  const handleOptionSelect = (option: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: option,
    }));
  };

  const handleTextChange = (text: string) => {
    setResponses((prev) => ({
      ...prev,
      [currentQuestion.id]: text,
    }));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(prev + 1, questions.length - 1));
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleSubmit = () => {
    setError(null);
    
    // Validate that at least one question is answered
    const answeredCount = Object.keys(responses).filter((k) => responses[k]?.trim()).length;
    if (answeredCount === 0) {
      setError("Please answer at least one question before submitting.");
      return;
    }

    startTransition(async () => {
      const payload = quiz.questions.map((q) => ({
        questionId: q.id,
        userAnswer: responses[q.id] || "",
      }));

      const result = await submitQuizAction(quiz.id, payload);
      if (result.success && result.attemptId) {
        router.push(`/dashboard/quizzes/evaluate/${result.attemptId}`);
      } else {
        setError(result.error || "Unable to submit and evaluate quiz. Please retry.");
      }
    });
  };

  const currentAnswer = responses[currentQuestion?.id] || "";
  const progressPercent = Math.round(((currentIndex + 1) / questions.length) * 100);
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <div className="flex flex-col gap-6 text-on-surface w-full max-w-md mx-auto">
      {/* Quiz Progress header */}
      <div className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-2">
        <div className="flex justify-between items-center text-body-small">
          <span className="font-semibold text-on-surface-variant">Assessment Progress</span>
          <span className="font-bold text-primary">
            Question {currentIndex + 1} of {questions.length}
          </span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="p-3 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Question Display Card */}
      <section className="bg-surface p-6 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-5 min-h-[280px]">
        <div>
          <span className="text-body-small font-bold text-tertiary uppercase tracking-wider">
            {currentQuestion?.type === "mcq" ? "Multiple Choice" : currentQuestion?.type === "shortAnswer" ? "Short Answer" : "Theory Question"}
          </span>
          <h3 className="text-title-medium font-semibold mt-2 leading-relaxed">
            {currentQuestion?.question}
          </h3>
        </div>

        {/* Answer Inputs based on Question Type */}
        <div className="flex-1 flex flex-col justify-center">
          {currentQuestion?.type === "mcq" ? (
            <div className="flex flex-col gap-3">
              {currentQuestion.options?.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isPending}
                  className={`w-full p-3.5 text-left text-body-medium font-semibold rounded-md border-2 transition-all flex items-center gap-3 ${
                    currentAnswer === option
                      ? "border-primary bg-primary-container/20 text-primary"
                      : "border-outline/10 hover:border-outline/30"
                  }`}
                >
                  <span className="w-6 h-6 rounded-full border border-outline/30 flex items-center justify-center text-body-small font-bold shrink-0">
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="leading-snug">{option}</span>
                </button>
              ))}
            </div>
          ) : currentQuestion?.type === "shortAnswer" ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={currentAnswer}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={isPending}
                placeholder="Type your answer here..."
                className="flex-1 px-3 py-3 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary disabled:opacity-50"
              />
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={() => isListening ? stopListening() : startListening()}
                  disabled={isPending}
                  className={`p-3.5 rounded-md border shadow-1 transition-colors shrink-0 ${
                    isListening
                      ? "bg-error text-error-on border-error"
                      : "bg-surface text-on-surface border-outline/15 hover:bg-surface-variant/50"
                  }`}
                >
                  <Mic className={`w-5 h-5 ${isListening ? "animate-pulse" : "text-primary"}`} />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <textarea
                value={currentAnswer}
                onChange={(e) => handleTextChange(e.target.value)}
                disabled={isPending}
                placeholder="Write your explanation or theory response..."
                rows={5}
                className="w-full px-3 py-3 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary resize-none disabled:opacity-50"
              />
              {isVoiceSupported && (
                <button
                  type="button"
                  onClick={() => isListening ? stopListening() : startListening()}
                  disabled={isPending}
                  className={`py-2 px-4 rounded-md border shadow-1 transition-colors flex items-center justify-center gap-2 ${
                    isListening
                      ? "bg-error text-error-on border-error w-full"
                      : "bg-surface text-on-surface border-outline/15 hover:bg-surface-variant/50 w-full"
                  }`}
                >
                  <Mic className={`w-4 h-4 ${isListening ? "animate-pulse" : "text-primary"}`} />
                  <span className="text-body-small font-semibold">
                    {isListening ? "Listening... Tap to stop" : "Answer with Voice"}
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Navigation Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || isPending}
          className="p-3 bg-surface hover:bg-surface-variant/50 border border-outline/15 rounded-md shadow-1 disabled:opacity-30 disabled:hover:bg-surface"
        >
          <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
        </button>

        {isLastQuestion ? (
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="flex-1 py-3 px-4 bg-primary text-primary-on rounded-md shadow-2 font-semibold text-body-medium flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <CheckSquare className="w-5 h-5" /> Submit Quiz
              </>
            )}
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={isPending}
            className="flex-1 py-3 px-4 bg-surface hover:bg-surface-variant/50 border border-outline/15 text-on-surface rounded-md shadow-1 font-semibold text-body-medium flex items-center justify-center gap-2"
          >
            Next Question <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
