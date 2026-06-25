import type { Metadata, Viewport } from "next";
import "./globals.css";
import PwaRegister from "@/components/layout/PwaRegister";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#08062d", // Using primary color
};

export const metadata: Metadata = {
  title: {
    template: "%s | StudyEezy",
    default: "StudyEezy - AI Collaborative Learning & Assessment Platform",
  },
  description: "StudyEezy is an AI-powered collaborative learning platform. Upload notes, generate summaries, master flashcards, and ace your quizzes with peer learning.",
  keywords: ["study", "learning", "AI tutor", "flashcards", "quizzes", "collaborative learning", "exam prep", "StudyEezy"],
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    title: "StudyEezy - AI Collaborative Learning",
    description: "Upload notes, generate summaries, master flashcards, and ace your quizzes.",
    url: "https://studyyeezy.com",
    siteName: "StudyEezy",
    images: [
      {
        url: "/logo.png",
        width: 800,
        height: 600,
        alt: "StudyEezy Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
