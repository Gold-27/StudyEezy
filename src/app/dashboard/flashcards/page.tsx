"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, getDoc, doc } from "firebase/firestore";
import { Layers, ChevronRight, Clock, PlusCircle, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteFlashcardDeckAction } from "@/actions/deleteActions";
import { useTransition } from "react";

interface FlashcardDeck {
  sourceId: string;
  sourceType: "material" | "summary";
  title: string;
  count: number;
  mastered: number;
  createdAt: number;
}

function formatDate(seconds?: number) {
  if (!seconds) return "Recently";
  return new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default function FlashcardsPage() {
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDecks = async (user: any) => {
      try {
        const q = query(
          collection(db, "flashcards"),
          where("userId", "==", user.uid)
        );
        const querySnap = await getDocs(q);
        
        const decksMap = new Map<string, any>();
        
        querySnap.forEach((d) => {
          const card = d.data();
          if (!decksMap.has(card.sourceId)) {
            decksMap.set(card.sourceId, {
              sourceId: card.sourceId,
              sourceType: card.sourceType,
              count: 0,
              mastered: 0,
              createdAt: card.createdAt?.seconds || 0
            });
          }
          const deckInfo = decksMap.get(card.sourceId);
          deckInfo.count++;
          if (card.mastered) {
            deckInfo.mastered++;
          }
          if (card.createdAt?.seconds > deckInfo.createdAt) {
            deckInfo.createdAt = card.createdAt?.seconds;
          }
        });

        // Resolve titles
        const resolvedDecks: FlashcardDeck[] = await Promise.all(
          Array.from(decksMap.values()).map(async (deck) => {
            const sourceCol = deck.sourceType === "material" ? "studyMaterials" : "summaries";
            const sourceDoc = await getDoc(doc(db, sourceCol, deck.sourceId));
            return {
              ...deck,
              title: sourceDoc.exists() ? sourceDoc.data()?.title : "Untitled Deck",
            } as FlashcardDeck;
          })
        );

        // Sort descending by date
        resolvedDecks.sort((a, b) => b.createdAt - a.createdAt);
        setDecks(resolvedDecks);
      } catch (err) {
        console.error("Failed to fetch flashcard decks:", err);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }
      fetchDecks(user);
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-8 text-on-surface">
      <section>
        <h2 className="text-headline-small font-semibold text-primary">Flashcard Decks</h2>
        <p className="text-body-medium text-on-surface-variant/80 mt-1">
          Review your saved flashcards to master concepts through active recall.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        {loading ? (
          <div className="py-8 text-center text-body-medium text-on-surface-variant/70">
            Loading flashcards...
          </div>
        ) : decks.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-outline/20 rounded-lg text-center flex flex-col items-center gap-3">
            <Layers className="w-10 h-10 text-outline/50" />
            <div className="text-body-medium text-outline">
              You haven't generated any flashcards yet.
            </div>
            <Link 
              href="/dashboard/materials"
              className="mt-2 flex items-center gap-2 px-4 py-2 bg-primary text-primary-on rounded-md shadow-1 font-medium hover:opacity-90 transition-opacity"
            >
              <PlusCircle className="w-5 h-5" /> Generate from Materials
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {decks.map((deck) => {
              const progressPercentage = Math.round((deck.mastered / deck.count) * 100);
              
              return (
                <div
                  key={deck.sourceId}
                  className="bg-surface p-5 rounded-lg border border-outline/10 shadow-1 hover:shadow-2 transition-all group flex flex-col justify-between relative overflow-hidden"
                >
                  <Link
                    href={`/dashboard/flashcards/create?sourceId=${deck.sourceId}&sourceType=${deck.sourceType}`}
                    className="absolute inset-0 z-0"
                    aria-label={`View ${deck.title} deck`}
                  />
                  <div className="flex flex-col gap-1 mb-4 relative z-10 pointer-events-none">
                    <div className="flex items-start justify-between pointer-events-auto">
                      <Layers className="w-6 h-6 text-primary mb-2" />
                      <div className="flex items-center gap-2">
                        <DeleteFlashcardDeckBtn sourceId={deck.sourceId} />
                        <div className="p-1.5 rounded-full text-on-surface-variant group-hover:text-primary group-hover:bg-primary-container/20 transition-colors">
                          <ChevronRight className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                    <h3 className="text-title-medium font-semibold text-on-surface line-clamp-2 leading-tight">
                      {deck.title}
                    </h3>
                    <p className="text-body-small text-on-surface-variant flex items-center gap-1 mt-1">
                      <Clock className="w-3.5 h-3.5" /> {formatDate(deck.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-auto relative z-10 pointer-events-none">
                    <div className="flex justify-between text-body-small font-medium text-on-surface-variant">
                      <span>{deck.count} Cards</span>
                      <span className={progressPercentage === 100 ? "text-primary" : ""}>
                        {progressPercentage}% Mastered
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-outline/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${progressPercentage === 100 ? 'bg-primary' : 'bg-secondary'}`}
                        style={{ width: `${progressPercentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function DeleteFlashcardDeckBtn({ sourceId }: { sourceId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm("Are you sure you want to delete this flashcard deck?")) return;
    startTransition(async () => {
      const res = await deleteFlashcardDeckAction(sourceId);
      if (!res.success) {
        alert(res.error || "Failed to delete deck");
      }
    });
  };

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="p-1.5 rounded-full text-error hover:bg-error-container/20 transition-colors disabled:opacity-50 relative z-20"
      title="Delete Deck"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );
}
