"use client";

import React, { useState, useTransition } from "react";
import { Flashcard } from "@/types";
import { toggleMasterCardAction } from "@/actions/generateFlashcards";
import { putOfflineItem } from "@/lib/indexedDb";
import { RefreshCw, CheckCircle2, ChevronLeft, ChevronRight, Check } from "lucide-react";

interface FlashcardDeckProps {
  initialCards: Flashcard[];
}

export default function FlashcardDeck({ initialCards }: FlashcardDeckProps) {
  const [cards, setCards] = useState<Flashcard[]>(initialCards);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (cards.length === 0) {
    return (
      <div className="py-8 text-center text-body-medium text-on-surface-variant/70 bg-surface rounded-lg border border-outline/10 p-5">
        No flashcards generated in this deck yet.
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleToggleMastered = () => {
    if (!currentCard) return;
    const nextMasterState = !currentCard.mastered;

    startTransition(async () => {
      // 1. Optimistic UI update
      const updatedCards = cards.map((c, i) =>
        i === currentIndex ? { ...c, mastered: nextMasterState } : c
      );
      setCards(updatedCards);

      // 2. Local IndexedDB Cache update (Offline availability)
      try {
        await putOfflineItem("flashcards", { ...currentCard, mastered: nextMasterState });
      } catch (err) {
        console.warn("IndexedDB sync skipped:", err);
      }

      // 3. Firestore Sync (Online)
      const res = await toggleMasterCardAction(currentCard.id, nextMasterState);
      if (!res.success) {
        console.warn("Firestore master toggle failed, synced locally instead.");
      }
    });
  };

  const masteredCount = cards.filter((c) => c.mastered).length;
  const progressPercent = Math.round((masteredCount / cards.length) * 100);

  return (
    <div className="flex flex-col gap-6 text-on-surface w-full max-w-sm mx-auto">
      {/* Progress header */}
      <div className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-2">
        <div className="flex justify-between items-center text-body-small">
          <span className="font-semibold text-on-surface-variant">Progress</span>
          <span className="font-bold text-primary">
            {masteredCount} of {cards.length} mastered ({progressPercent}%)
          </span>
        </div>
        <div className="w-full h-2 bg-surface-variant rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Interactive Flipping Card Container */}
      <div
        onClick={handleFlip}
        className="w-full aspect-[4/3] relative cursor-pointer select-none group"
        style={{ perspective: "1000px" }}
      >
        <div
          className="w-full h-full duration-500 rounded-lg shadow-1 border border-outline/10"
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
            transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {/* Front of Card */}
          <div
            className="absolute inset-0 w-full h-full bg-surface p-6 rounded-lg flex flex-col items-center justify-center text-center backface-hidden"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-body-small font-bold text-primary-container uppercase tracking-wider mb-2">
              Question
            </span>
            <p className="text-title-medium font-semibold leading-relaxed">
              {currentCard?.front}
            </p>
            <span className="text-body-small text-on-surface-variant/40 mt-6 group-hover:text-primary transition-colors">
              Tap to reveal answer
            </span>
          </div>

          {/* Back of Card */}
          <div
            className="absolute inset-0 w-full h-full bg-surface-variant p-6 rounded-lg flex flex-col items-center justify-center text-center backface-hidden"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <span className="text-body-small font-bold text-secondary uppercase tracking-wider mb-2">
              Explanation
            </span>
            <p className="text-body-medium leading-relaxed font-medium">
              {currentCard?.back}
            </p>
            <span className="text-body-small text-on-surface-variant/40 mt-6">
              Tap to flip back
            </span>
          </div>
        </div>
      </div>

      {/* Control Actions */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={handlePrev}
          className="p-3 bg-surface hover:bg-surface-variant/50 border border-outline/15 rounded-md shadow-1"
        >
          <ChevronLeft className="w-5 h-5 text-on-surface-variant" />
        </button>

        <button
          onClick={handleToggleMastered}
          disabled={isPending}
          className={`flex-1 py-3 px-4 rounded-md shadow-2 font-semibold text-body-medium flex items-center justify-center gap-2 transition-all ${
            currentCard?.mastered
              ? "bg-success text-success-on hover:opacity-90"
              : "bg-primary text-primary-on hover:opacity-95"
          }`}
        >
          {isPending ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : currentCard?.mastered ? (
            <>
              <Check className="w-4 h-4" /> Mastered!
            </>
          ) : (
            "Mark as Mastered"
          )}
        </button>

        <button
          onClick={handleNext}
          className="p-3 bg-surface hover:bg-surface-variant/50 border border-outline/15 rounded-md shadow-1"
        >
          <ChevronRight className="w-5 h-5 text-on-surface-variant" />
        </button>
      </div>

      <div className="text-center text-body-small text-on-surface-variant/60 font-semibold">
        Card {currentIndex + 1} of {cards.length}
      </div>
    </div>
  );
}
