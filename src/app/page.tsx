import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-5 text-center">
      <div className="max-w-md w-full bg-surface p-6 rounded-lg shadow-1 border border-outline/10">
        <h1 className="text-display-small font-semibold text-primary mb-4">StudyEezy</h1>
        <p className="text-body-medium text-on-background/70 mb-6">
          AI-powered collaborative learning and assessment platform.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth"
            className="w-full py-3 px-4 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:bg-primary/95 transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/dashboard"
            className="w-full py-3 px-4 bg-secondary-container text-on-secondary-container font-semibold rounded-md shadow-1 hover:bg-secondary-container/90 transition-colors"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
