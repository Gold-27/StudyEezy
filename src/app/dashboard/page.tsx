import React from "react";
import Link from "next/link";
import { BookOpen, FileText, Award, Users, PlusCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <section className="bg-primary-container text-on-primary-container p-5 rounded-lg shadow-1 border border-primary/10">
        <h2 className="text-headline-small font-semibold">Welcome Back, Learner!</h2>
        <p className="text-body-medium opacity-90 mt-1">
          Active recall and peer learning are the keys to long-term memory. Keep studying!
        </p>
      </section>

      {/* Quick actions */}
      <section className="grid grid-cols-2 gap-4">
        <Link
          href="/dashboard/materials"
          className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-outline/10 shadow-1 hover:shadow-2 transition-shadow text-center text-on-surface"
        >
          <PlusCircle className="w-8 h-8 text-primary mb-2" />
          <span className="text-title-small font-semibold">Upload Material</span>
          <span className="text-body-small text-on-surface-variant/80 mt-1">PDF, DOCX, Images</span>
        </Link>
        <Link
          href="/dashboard/rooms"
          className="flex flex-col items-center justify-center p-4 bg-surface rounded-lg border border-outline/10 shadow-1 hover:shadow-2 transition-shadow text-center text-on-surface"
        >
          <Users className="w-8 h-8 text-secondary mb-2" />
          <span className="text-title-small font-semibold">Study Rooms</span>
          <span className="text-body-small text-on-surface-variant/80 mt-1">Collaborate with peers</span>
        </Link>
      </section>

      {/* Recent Activity Categories */}
      <section className="flex flex-col gap-4">
        <h3 className="text-title-medium font-semibold text-on-background">Your Recent Activities</h3>

        {/* Recent Materials */}
        <div className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline/10">
            <h4 className="text-title-small font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> Study Materials
            </h4>
            <Link href="/dashboard/materials" className="text-body-small text-primary hover:underline font-medium">
              View All
            </Link>
          </div>
          <div className="py-4 text-center text-body-medium text-on-surface-variant/70">
            No study materials uploaded yet. Upload a document to start summaries and quizzes!
          </div>
        </div>

        {/* Recent Summaries */}
        <div className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline/10">
            <h4 className="text-title-small font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-secondary" /> Generated Summaries
            </h4>
            <Link href="/dashboard/materials" className="text-body-small text-primary hover:underline font-medium">
              Create New
            </Link>
          </div>
          <div className="py-4 text-center text-body-medium text-on-surface-variant/70">
            No summaries generated yet.
          </div>
        </div>

        {/* Recent Quizzes */}
        <div className="bg-surface p-4 rounded-lg border border-outline/10 shadow-1 flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-outline/10">
            <h4 className="text-title-small font-semibold flex items-center gap-2">
              <Award className="w-4 h-4 text-tertiary" /> Quizzes & Attempts
            </h4>
            <Link href="/dashboard/materials" className="text-body-small text-primary hover:underline font-medium">
              Take Quiz
            </Link>
          </div>
          <div className="py-4 text-center text-body-medium text-on-surface-variant/70">
            No quizzes generated or completed yet.
          </div>
        </div>
      </section>
    </div>
  );
}
