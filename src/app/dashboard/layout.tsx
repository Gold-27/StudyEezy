"use client";

import React, { useState, useEffect } from "react";
import MobileNav from "@/components/layout/MobileNav";
import { WifiOff, Home, FileText, Users, User, Layers } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Materials", href: "/dashboard/materials", icon: FileText },
    { name: "Flashcards", href: "/dashboard/flashcards", icon: Layers },
    { name: "Rooms", href: "/dashboard/rooms", icon: Users },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  return (
    <div className="min-h-screen bg-background text-on-background pb-16 md:pb-0">
      {/* Sticky offline notification banner */}
      {!isOnline && (
        <div className="bg-error text-error-on px-4 py-2 text-center text-body-small font-semibold flex items-center justify-center gap-2 sticky top-0 z-50 animate-pulse">
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>You are currently offline. Accessing cached library and materials.</span>
        </div>
      )}

      <header className="sticky top-0 z-40 w-full bg-surface border-b border-outline/10 shadow-1 px-4 md:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Image src="/logo.jpeg" alt="StudyEezy Logo" width={28} height={28} className="rounded-md" />
          <h1 className="text-title-large font-semibold text-primary">
            Study<span className="text-tertiary">Eezy</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              let isActive = false;
              if (item.href === "/dashboard") {
                isActive = pathname === "/dashboard";
              } else if (item.name === "Materials") {
                isActive = 
                  pathname === "/dashboard/materials" || 
                  pathname.startsWith("/dashboard/materials/") ||
                  pathname.startsWith("/dashboard/summaries/") ||
                  pathname.startsWith("/dashboard/quizzes/");
              } else {
                isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              }

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-1.5 text-body-medium font-medium transition-colors hover:text-primary ${
                    isActive ? "text-primary" : "text-on-surface-variant"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {!isOnline && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-error-container text-on-error-container border border-error/20 rounded-full flex items-center gap-1 shrink-0">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
        </div>
      </header>
      
      {/* Content pane */}
      <main className="p-4 max-w-4xl mx-auto">{children}</main>
      
      {/* Bottom navbar */}
      <MobileNav />
    </div>
  );
}
