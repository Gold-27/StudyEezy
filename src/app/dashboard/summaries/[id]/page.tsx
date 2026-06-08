"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Summary } from "@/types";
import { ArrowLeft, FileText, Share2 } from "lucide-react";
import Link from "next/link";
import { putOfflineItem, getOfflineItem } from "@/lib/indexedDb";

export default function SummaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    
    const fetchSummary = async () => {
      try {
        const docRef = doc(db, "summaries", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const fetchedSummary = { id: docSnap.id, ...docSnap.data() } as Summary;
          setSummary(fetchedSummary);
          try {
            await putOfflineItem("summaries", fetchedSummary);
          } catch (e) {
            console.warn("Failed to cache summary offline in IndexedDB:", e);
          }
        } else {
          // Check local IndexedDB fallback
          const cached = await getOfflineItem("summaries", id);
          if (cached) {
            setSummary(cached);
          } else {
            setError("This summary could not be found in your library.");
          }
        }
      } catch (err) {
        console.error("Failed to load summary, trying cached fallback:", err);
        try {
          const cached = await getOfflineItem("summaries", id);
          if (cached) {
            setSummary(cached);
          } else {
            setError("Error loading summary content. You appear to be offline and this content is not cached.");
          }
        } catch (dbErr) {
          setError("Error loading summary content.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [id]);

  if (loading) {
    return (
      <div className="py-12 text-center text-body-medium text-on-surface-variant/70">
        Loading summary content...
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="py-12 text-center flex flex-col gap-3 items-center">
        <p className="text-body-medium text-error font-medium">{error || "Summary not found."}</p>
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
      {/* Header action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-surface-variant/50 rounded-md border border-outline/10 bg-surface text-on-surface-variant"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        
        {/* Active recall helper links */}
        <div className="flex gap-2">
          <Link
            href={`/dashboard/flashcards/create?summaryId=${summary.id}`}
            className="px-3 py-1.5 bg-secondary text-secondary-on text-body-small font-semibold rounded-md flex items-center gap-1.5 shadow-1 hover:opacity-95"
          >
            <FileText className="w-4 h-4" /> Create Flashcards
          </Link>
        </div>
      </div>

      {/* Main card */}
      <section className="bg-surface p-6 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-4">
        <div>
          <span className="text-body-small font-bold text-secondary uppercase tracking-wider">
            {summary.summaryType === "keyConcepts" ? "Key Concepts" : `${summary.summaryType} notes`}
          </span>
          <h2 className="text-headline-small font-semibold text-on-surface mt-1">{summary.title}</h2>
        </div>

        {/* Markdown container */}
        <div className="border-t border-outline/10 pt-4 leading-relaxed text-body-medium whitespace-pre-wrap">
          {summary.content}
        </div>
      </section>
    </div>
  );
}
