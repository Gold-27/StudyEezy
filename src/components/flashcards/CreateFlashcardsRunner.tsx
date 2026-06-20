"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, Timestamp } from "firebase/firestore";
import { generateFlashcardsAction } from "@/actions/generateFlashcards";
import { putOfflineItem } from "@/lib/indexedDb";
import { Flashcard } from "@/types";
import FlashcardDeck from "./FlashcardDeck";
import { ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CreateFlashcardsRunner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const summaryId = searchParams.get("summaryId");
  const materialId = searchParams.get("materialId");

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const sourceId = summaryId || materialId;
    const sourceType = summaryId ? "summary" : "material";

    if (!sourceId) {
      setError("No study source selected. Please create cards from a summary or material.");
      setLoading(false);
      return;
    }

    const loadOrCreateCards = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          setError("Please log in to study flashcards.");
          setLoading(false);
          return;
        }

        // 1. Check if flashcards already exist for this source to prevent duplicate billing
        const q = query(
          collection(db, "flashcards"),
          where("userId", "==", user.uid),
          where("sourceId", "==", sourceId)
        );
        const querySnap = await getDocs(q);

        if (!querySnap.empty) {
          const existingCards: Flashcard[] = [];
          querySnap.forEach((doc) => {
            existingCards.push({ id: doc.id, ...doc.data() } as Flashcard);
          });
          setCards(existingCards);
          setLoading(false);

          // Seed local IndexedDB cache for offline access
          for (const card of existingCards) {
            await putOfflineItem("flashcards", card);
          }
          return;
        }

        // 2. Generate flashcards with Server Action if not already present
        startTransition(async () => {
          const result = await generateFlashcardsAction(sourceType, sourceId);
          if (result.success && result.cards) {
            const hydratedCards = result.cards.map((c: any) => ({
              ...c,
              createdAt: Timestamp.fromMillis(c.createdAt),
            })) as Flashcard[];

            setCards(hydratedCards);
            // Cache locally
            for (const card of hydratedCards) {
              await putOfflineItem("flashcards", card);
            }
          } else {
            setError(result.error || "Unable to generate flashcards.");
          }
          setLoading(false);
        });
      } catch (err: any) {
        console.error("Failed to load flashcards:", err);
        setError("Error loading active recall deck.");
        setLoading(false);
      }
    };

    loadOrCreateCards();
  }, [summaryId, materialId]);

  if (loading || isPending) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-on-surface">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-body-medium text-on-surface-variant font-medium">
          {isPending ? "Generating recall cards using AI..." : "Loading flashcards deck..."}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-12 flex flex-col items-center gap-3 text-center text-on-surface">
        <AlertCircle className="w-8 h-8 text-error" />
        <p className="text-body-medium text-error font-semibold">{error}</p>
        <button
          onClick={() => router.back()}
          className="text-primary hover:underline font-medium flex items-center gap-1 mt-2 text-body-medium"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 pb-8 text-on-surface">
      <div className="flex items-start gap-3">
        <Link href="/dashboard/materials" className="-ml-1.5 mt-1 shrink-0 transition-colors">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant hover:text-primary" />
        </Link>
        <div>
          <h2 className="text-headline-small font-semibold">Active Recall Flashcards</h2>
          <p className="text-body-small text-on-surface-variant/80">
            Practice active recall to verify and reinforce your understanding.
          </p>
        </div>
      </div>

      <FlashcardDeck initialCards={cards} />
    </div>
  );
}
