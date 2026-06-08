import React, { Suspense } from "react";
import CreateSummaryForm from "@/components/summaries/CreateSummaryForm";

export default function CreateSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-body-medium text-on-surface-variant font-medium">
          Loading summary options...
        </div>
      }
    >
      <CreateSummaryForm />
    </Suspense>
  );
}
