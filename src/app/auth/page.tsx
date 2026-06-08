import React, { Suspense } from "react";
import AuthForm from "@/components/auth/AuthForm";

export default function AuthPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-4">
      <Suspense
        fallback={
          <div className="text-body-medium text-on-surface-variant font-medium text-center">
            Loading authentication...
          </div>
        }
      >
        <AuthForm />
      </Suspense>
    </main>
  );
}
