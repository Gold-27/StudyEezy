import React, { Suspense } from "react";
import CreateFlashcardsRunner from "@/components/flashcards/CreateFlashcardsRunner";

export default function CreateFlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-body-medium text-on-surface-variant font-medium">
          Loading recall options...
        </div>
      }
    >
      <CreateFlashcardsRunner />
    </Suspense>
  );
}
