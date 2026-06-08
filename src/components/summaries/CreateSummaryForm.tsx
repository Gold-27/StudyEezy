"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { generateSummaryAction } from "@/actions/generateSummary";
import { FileText, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function CreateSummaryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const materialId = searchParams.get("materialId");

  const [materialTitle, setMaterialTitle] = useState("Loading document...");
  const [summaryType, setSummaryType] = useState<"short" | "detailed" | "revision" | "keyConcepts" | "examPrep">("short");
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

    setError(null);
    startTransition(async () => {
      const result = await generateSummaryAction(materialId, summaryType);
      if (result.success && result.summary) {
        router.push(`/dashboard/summaries/${result.summary.id}`);
      } else {
        setError(result.error || "Summary generation failed.");
      }
    });
  };

  const typesOptions = [
    { value: "short", label: "Short Summary", desc: "A quick, high-level overview of the material. Easy to skim." },
    { value: "detailed", label: "Detailed Summary", desc: "Exhaustive coverage of all terms and sub-topics for deep learning." },
    { value: "revision", label: "Revision Notes", desc: "Clean bullet points and outlines for quick active review." },
    { value: "keyConcepts", label: "Key Concepts", desc: "Core definitions, formulas, and textbook principles listed clearly." },
    { value: "examPrep", label: "Exam Prep Summary", desc: "Frequently tested topics, potential exam questions, and high-yield facts." },
  ] as const;

  return (
    <div className="flex flex-col gap-6 text-on-surface">
      <div className="flex items-center gap-2">
        <Link href="/dashboard/materials" className="p-2 hover:bg-surface-variant/50 rounded-md">
          <ArrowLeft className="w-5 h-5 text-on-surface-variant" />
        </Link>
        <div>
          <h2 className="text-headline-small font-semibold">Generate Summary</h2>
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
        <form onSubmit={handleGenerate} className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <span className="text-label-large font-semibold text-on-background">Choose Summary Type</span>
            
            <div className="flex flex-col gap-3">
              {typesOptions.map((opt) => (
                <label
                  key={opt.value}
                  onClick={() => setSummaryType(opt.value)}
                  className={`p-4 rounded-lg border-2 text-left cursor-pointer transition-all flex items-start gap-3 bg-surface ${
                    summaryType === opt.value
                      ? "border-primary shadow-1"
                      : "border-outline/10 hover:border-outline/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="summaryType"
                    value={opt.value}
                    checked={summaryType === opt.value}
                    onChange={() => {}} // handled by click
                    className="mt-1 accent-primary"
                  />
                  <div>
                    <span className="block text-title-small font-semibold">{opt.label}</span>
                    <span className="block text-body-small text-on-surface-variant/85 mt-0.5">{opt.desc}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary text-primary-on font-semibold rounded-md shadow-2 flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50 transition-opacity mt-4"
          >
            {isPending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" /> Generating with AI...
              </>
            ) : (
              <>
                <FileText className="w-5 h-5" /> Generate Summary
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
