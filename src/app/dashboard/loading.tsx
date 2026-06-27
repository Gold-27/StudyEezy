import React from "react";
import { BookOpen, FileText, Award, Layers, PlusCircle, Users } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Welcome banner Skeleton */}
      <section className="bg-primary-container/40 p-5 rounded-lg shadow-1 border border-primary/5 min-h-[104px] flex flex-col justify-center">
        <div className="h-7 bg-primary/20 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-primary/20 rounded w-2/3"></div>
      </section>

      {/* Quick actions Skeleton */}
      <section className="grid grid-cols-2 gap-4">
        <div className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-outline/10 shadow-1 min-h-[120px]">
          <PlusCircle className="w-8 h-8 text-primary/30 mb-2" />
          <div className="h-5 bg-outline/10 rounded w-24 mb-2"></div>
          <div className="h-3 bg-outline/10 rounded w-32"></div>
        </div>
        <div className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-outline/10 shadow-1 min-h-[120px]">
          <Users className="w-8 h-8 text-secondary/30 mb-2" />
          <div className="h-5 bg-outline/10 rounded w-24 mb-2"></div>
          <div className="h-3 bg-outline/10 rounded w-32"></div>
        </div>
      </section>

      {/* Recent Activity Categories Skeleton */}
      <section className="flex flex-col gap-4">
        <div className="h-6 bg-outline/10 rounded w-48 mb-2"></div>

        {[
          { icon: BookOpen, color: "text-primary/30" },
          { icon: FileText, color: "text-secondary/30" },
          { icon: Layers, color: "text-primary/30" },
          { icon: Award, color: "text-tertiary/30" }
        ].map((item, i) => (
          <div key={i} className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-3 min-h-[160px]">
            <div className="flex items-center justify-between pb-2 border-b border-outline/10">
              <h4 className="flex items-center gap-2">
                <item.icon className={`w-4 h-4 ${item.color}`} />
                <div className="h-5 bg-outline/10 rounded w-32"></div>
              </h4>
              <div className="h-4 bg-outline/10 rounded w-16"></div>
            </div>
            
            <div className="flex flex-col divide-y divide-outline/5 mt-1">
              {[1, 2, 3].map((_, j) => (
                <div key={j} className="py-2 flex items-center justify-between">
                  <div className="flex flex-col gap-2 w-full">
                    <div className="h-4 bg-outline/10 rounded w-2/3"></div>
                    <div className="h-3 bg-outline/10 rounded w-1/3"></div>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-outline/10 ml-4"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
