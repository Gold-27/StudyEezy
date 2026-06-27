import React, { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="flex h-[100dvh] overflow-hidden items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="w-[360px] max-w-full bg-surface border border-outline/10 shadow-1 rounded-lg p-6 flex flex-col gap-5 animate-pulse">
            <div className="flex justify-center mb-2">
              <div className="h-10 w-32 bg-surface-variant rounded"></div>
            </div>
            <div className="h-4 bg-surface-variant rounded w-48 mx-auto mb-4"></div>
            <div className="flex flex-col gap-4">
              <div className="h-10 bg-surface-variant rounded w-full"></div>
              <div className="h-10 bg-surface-variant rounded w-full"></div>
              <div className="h-10 bg-primary/20 rounded w-full mt-2"></div>
            </div>
            <div className="h-4 bg-surface-variant rounded w-32 mx-auto mt-2"></div>
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </main>
  );
}
