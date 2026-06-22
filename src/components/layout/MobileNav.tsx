"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, FileText, Users, User, Layers } from "lucide-react";

export default function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: Home },
    { name: "Materials", href: "/dashboard/materials", icon: FileText },
    { name: "Cards", href: "/dashboard/flashcards", icon: Layers },
    { name: "Rooms", href: "/dashboard/rooms", icon: Users },
    { name: "Profile", href: "/dashboard/profile", icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-outline/10 shadow-3 md:hidden">
      <div className="flex justify-around items-center h-16">
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
              className={`flex flex-col items-center justify-center w-full h-full text-center transition-colors ${
                isActive ? "text-primary" : "text-on-surface-variant/70"
              }`}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-label-small font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
