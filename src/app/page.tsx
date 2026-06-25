import Link from "next/link";
import Image from "next/image";

export default function Home() {
  return (
    <main className="flex h-[100dvh] overflow-hidden flex-col items-center justify-center p-5 text-center">
      <div className="max-w-md w-full bg-surface p-6 rounded-lg shadow-1 border border-outline/10 flex flex-col items-center">
        <div className="flex items-center gap-1 mb-4">
          <Image src="/logo.png" alt="StudyEezy Logo" width={48} height={48} className="rounded-lg shadow-sm" />
          <h1 className="text-headline-large font-bold text-primary">
            Study<span className="text-tertiary">Eezy</span>
          </h1>
        </div>
        <p className="text-body-medium text-outline mb-6">
          AI-powered collaborative learning and assessment platform.
        </p>
        <div className="flex flex-col gap-3">
          <Link
            href="/auth?mode=signup"
            className="w-full py-3 px-4 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:shadow-3 hover:scale-[1.02] hover:bg-primary/90 active:scale-[0.98] transition-all duration-200 ease-out"
          >
            Get Started
          </Link>
        </div>
      </div>
    </main>
  );
}
