import React, { Suspense } from "react";
import CreateFlashcardsRunner from "@/components/flashcards/CreateFlashcardsRunner";

export default function CreateFlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface p-6 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-6 animate-pulse max-w-xl mx-auto w-full mt-4">
          <div className="h-6 bg-surface-variant rounded w-48 mb-2"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-surface-variant rounded w-32"></div>
            <div className="h-12 bg-surface-variant rounded w-full"></div>
          </div>
          <div className="h-12 bg-primary/20 rounded-md w-full mt-4"></div>
        </div>
      }
    >
      <CreateFlashcardsRunner />
    </Suspense>
  );
}
