"use client";

import React, { useState, useEffect } from "react";
import UploadZone from "@/components/materials/UploadZone";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { BookOpen, Calendar, Eye, FileText, HelpCircle, Mic } from "lucide-react";
import { StudyMaterial } from "@/types";
import Link from "next/link";
import { useVoiceInput } from "@/hooks/useVoiceInput";

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const { isListening, startListening, stopListening, isSupported: isVoiceSupported } = useVoiceInput(
    (transcript) => setSearchQuery((prev) => prev + (prev ? " " : "") + transcript)
  );

  useEffect(() => {
    // Handle auth state changes to subscribe
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setLoading(false);
        return;
      }

      const q = query(
        collection(db, "studyMaterials"),
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const unsubscribeSnapshot = onSnapshot(
        q,
        (snapshot) => {
          const items: StudyMaterial[] = [];
          snapshot.forEach((doc) => {
            items.push({ id: doc.id, ...doc.data() } as StudyMaterial);
          });
          setMaterials(items);
          setLoading(false);
        },
        (error) => {
          console.error("Firestore listener failed:", error);
          setLoading(false);
        }
      );

      return () => unsubscribeSnapshot();
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-8 text-on-surface">
      <section>
        <h2 className="text-headline-small font-semibold text-primary">Study Materials</h2>
        <p className="text-body-medium text-on-surface-variant/80 mt-1">
          Upload PDF, DOCX or images of notes to extract text and generate summaries or quizzes.
        </p>
      </section>

      <UploadZone />

      <section className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-title-medium font-semibold text-on-surface">Your Library</h3>
          
          {/* Search Input with Voice mic */}
          <div className="relative w-full sm:max-w-xs shrink-0">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search library..."
              className="w-full pl-3 pr-10 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary placeholder:text-on-surface-variant/50"
            />
            {isVoiceSupported && (
              <button
                type="button"
                onClick={() => isListening ? stopListening() : startListening()}
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${
                  isListening
                    ? "bg-error text-error-on animate-pulse"
                    : "text-outline hover:bg-surface-variant hover:text-primary"
                }`}
              >
                <Mic className="w-4.5 h-4.5" />
              </button>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="py-8 text-center text-body-medium text-on-surface-variant/70">
            Loading library...
          </div>
        ) : (materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))).length === 0 ? (
          <div className="py-12 border-2 border-dashed border-outline/20 rounded-lg text-center text-body-medium text-outline">
            {searchQuery ? "No materials found matching your search query." : "Your library is empty. Upload a file above to get started!"}
          </div>
        ) : (
          <div className="grid gap-3">
            {(materials.filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))).map((m) => {
              const formattedDate = m.createdAt
                ? new Date(m.createdAt.seconds * 1000).toLocaleDateString()
                : "Just now";

              return (
                <div
                  key={m.id}
                  className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex items-center justify-between"
                >
                  <div className="flex items-start gap-3 min-w-0 flex-1 mr-4">
                    <BookOpen className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h4 className="text-title-small font-semibold truncate text-on-surface">
                        {m.title}
                      </h4>
                      <p className="text-body-small text-on-surface-variant/75 flex items-center gap-1 mt-1">
                        <span className="capitalize">{m.fileType}</span> &bull; 
                        <Calendar className="w-3.5 h-3.5" /> {formattedDate}
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions: Links to create summary or quizzes */}
                  <div className="flex gap-2 shrink-0">
                    <div className="relative group">
                      <Link
                        href={`/dashboard/summaries/create?materialId=${m.id}`}
                        className="p-2 bg-surface-variant text-on-surface-variant border border-outline/15 rounded-md hover:bg-surface-variant/80 block"
                      >
                        <FileText className="w-4 h-4 text-secondary" />
                      </Link>
                      <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-max px-2.5 py-1 bg-gray-900 text-white font-medium text-xs rounded shadow-lg hidden group-hover:block z-[9999] pointer-events-none whitespace-nowrap">
                        Generate Summary
                      </div>
                    </div>
                    <div className="relative group">
                      <Link
                        href={`/dashboard/quizzes/create?materialId=${m.id}`}
                        className="p-2 bg-surface-variant text-on-surface-variant border border-outline/15 rounded-md hover:bg-surface-variant/80 block"
                      >
                        <HelpCircle className="w-4 h-4 text-tertiary" />
                      </Link>
                      <div className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 w-max px-2.5 py-1 bg-gray-900 text-white font-medium text-xs rounded shadow-lg hidden group-hover:block z-[9999] pointer-events-none whitespace-nowrap">
                        Generate Quiz
                      </div>
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
