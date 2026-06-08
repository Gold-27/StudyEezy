import type { Metadata } from "next";
import "./globals.css";
import PwaRegister from "@/components/layout/PwaRegister";

export const metadata: Metadata = {
  title: "StudyEezy",
  description: "AI-powered collaborative learning and assessment platform",
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
