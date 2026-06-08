import React, { Suspense } from "react";
import CreateQuizForm from "@/components/quizzes/CreateQuizForm";

export default function CreateQuizPage() {
  return (
    <Suspense
      fallback={
        <div className="py-8 text-center text-body-medium text-on-surface-variant font-medium">
          Loading quiz setup...
        </div>
      }
    >
      <CreateQuizForm />
    </Suspense>
  );
}
