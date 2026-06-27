import React, { Suspense } from "react";
import CreateSummaryForm from "@/components/summaries/CreateSummaryForm";

export default function CreateSummaryPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-surface p-6 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-6 animate-pulse max-w-2xl mx-auto w-full">
          <div className="h-6 bg-surface-variant rounded w-48 mb-2"></div>
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-surface-variant rounded w-32"></div>
            <div className="h-12 bg-surface-variant rounded w-full"></div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="h-4 bg-surface-variant rounded w-32"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-[74px] bg-surface-variant rounded-lg w-full"></div>)}
            </div>
          </div>
          <div className="h-12 bg-primary/20 rounded-md w-full mt-2"></div>
        </div>
      }
    >
      <CreateSummaryForm />
    </Suspense>
  );
}
