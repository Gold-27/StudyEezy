"use client";

import React, { useState, useEffect } from "react";
import MobileNav from "@/components/layout/MobileNav";
import { WifiOff } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOnline, setIsOnline] = useState(true);

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

      {/* Header bar */}
      <header className="sticky top-0 z-40 w-full bg-surface border-b border-outline/10 shadow-1 px-4 py-3 flex items-center justify-between">
        <h1 className="text-title-large font-semibold text-primary">StudyEezy</h1>
        
        <div className="flex items-center gap-2.5">
          {!isOnline && (
            <span className="px-2.5 py-0.5 text-[10px] font-bold bg-error-container text-on-error-container border border-error/20 rounded-full flex items-center gap-1 shrink-0">
              <WifiOff className="w-3.5 h-3.5" /> Offline
            </span>
          )}
          
          <div className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-semibold text-body-small">
            SE
          </div>
        </div>
      </header>
      
      {/* Content pane */}
      <main className="p-4 max-w-4xl mx-auto">{children}</main>
      
      {/* Bottom navbar */}
      <MobileNav />
    </div>
  );
}
