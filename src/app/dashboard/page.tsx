import React from "react";
import Link from "next/link";
import { BookOpen, FileText, Award, Users, PlusCircle, Clock, ChevronRight } from "lucide-react";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

function formatDate(seconds?: number) {
  if (!seconds) return "Recently";
  return new Date(seconds * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export default async function DashboardPage() {
  let firstName = "Learner";
  let uid = "";
  
  let recentMaterials: any[] = [];
  let recentSummaries: any[] = [];
  let recentAttempts: any[] = [];

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("session_token")?.value;
    if (token && adminAuth && adminDb) {
      try {
        const decodedToken = await adminAuth.verifyIdToken(token);
        uid = decodedToken.uid;
        if (decodedToken.name) {
          firstName = decodedToken.name.split(" ")[0];
        } else if (decodedToken.email) {
          firstName = decodedToken.email.split("@")[0];
        }
      } catch (err) {
        try {
          const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
          if (payload) {
            if (payload.user_id) uid = payload.user_id;
            if (payload.name) {
              firstName = payload.name.split(" ")[0];
            } else if (payload.email) {
              firstName = payload.email.split("@")[0];
            }
          }
        } catch (e) {}

        if (!uid && process.env.NODE_ENV === "development") {
          uid = "dev-user-123";
        }
      }

      if (uid) {
        try {
          const userDoc = await adminDb.collection("users").doc(uid).get();
          if (userDoc.exists) {
            const fullName = userDoc.data()?.name || "";
            if (fullName) {
              firstName = fullName.split(" ")[0];
            }
          }
          
          if (firstName === "Learner" || !firstName) {
            const authRecord = await adminAuth.getUser(uid);
            if (authRecord.displayName) {
              firstName = authRecord.displayName.split(" ")[0];
            } else if (authRecord.email) {
              firstName = authRecord.email.split("@")[0];
            }
          }
        } catch (dbErr) {
          console.error("Error fetching user record:", dbErr);
        }

        // Fetch user activities, sort in memory to avoid composite index requirements
        const [materialsSnap, summariesSnap, attemptsSnap] = await Promise.all([
          adminDb.collection("studyMaterials").where("userId", "==", uid).get(),
          adminDb.collection("summaries").where("userId", "==", uid).get(),
          adminDb.collection("quizAttempts").where("userId", "==", uid).get()
        ]);

        recentMaterials = materialsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
          
        recentSummaries = summariesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).slice(0, 3);
          
        recentAttempts = await Promise.all(
          attemptsSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            .sort((a, b) => (b.submittedAt?.seconds || 0) - (a.submittedAt?.seconds || 0))
            .slice(0, 3)
            .map(async (attempt: any) => {
               const qDoc = await adminDb.collection("quizzes").doc(attempt.quizId).get();
               return { ...attempt, quizTitle: qDoc.exists ? qDoc.data()?.title : "Quiz Assessment" };
            })
        );
      }
    }
  } catch (error) {
    console.error("Error fetching data for dashboard:", error);
  }

  console.log("DASHBOARD NAME DEBUG -> UID:", uid, "FIRSTNAME:", firstName);

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome banner */}
      <section className="bg-primary-container text-on-primary-container p-5 rounded-lg shadow-1 border border-primary/10">
        <h2 className="text-headline-small font-semibold">Welcome Back, {firstName}!</h2>
        <p className="text-body-medium opacity-75 mt-1">
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
          {recentMaterials.length > 0 ? (
            <div className="flex flex-col divide-y divide-outline/5">
              {recentMaterials.map((mat) => (
                <div key={mat.id} className="py-2 flex items-center justify-between group">
                  <div className="flex flex-col">
                    <span className="text-body-medium font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">{mat.title}</span>
                    <span className="text-body-small text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" /> {formatDate(mat.createdAt?.seconds)}
                    </span>
                  </div>
                  <Link href="/dashboard/materials" className="p-1.5 rounded-full hover:bg-surface-variant text-on-surface-variant group-hover:text-primary transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-body-medium text-outline">
              No study materials uploaded yet. Upload a document to start summaries and quizzes!
            </div>
          )}
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
          {recentSummaries.length > 0 ? (
            <div className="flex flex-col divide-y divide-outline/5">
              {recentSummaries.map((sum) => (
                <Link href={`/dashboard/summaries/${sum.id}`} key={sum.id} className="py-2 flex items-center justify-between group hover:bg-surface-variant/30 px-1 -mx-1 rounded transition-colors">
                  <div className="flex flex-col">
                    <span className="text-body-medium font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">{sum.title}</span>
                    <span className="text-body-small text-on-surface-variant flex items-center gap-1 mt-0.5 uppercase tracking-wider text-[10px]">
                      {sum.summaryType} • {formatDate(sum.createdAt?.seconds)}
                    </span>
                  </div>
                  <div className="p-1.5 rounded-full text-on-surface-variant group-hover:text-primary transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-body-medium text-outline">
              No summaries generated yet.
            </div>
          )}
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
          {recentAttempts.length > 0 ? (
            <div className="flex flex-col divide-y divide-outline/5">
              {recentAttempts.map((attempt) => (
                <Link href={`/dashboard/quizzes/evaluate/${attempt.id}`} key={attempt.id} className="py-2 flex items-center justify-between group hover:bg-surface-variant/30 px-1 -mx-1 rounded transition-colors">
                  <div className="flex flex-col">
                    <span className="text-body-medium font-semibold text-on-surface truncate max-w-[200px] sm:max-w-xs">{attempt.quizTitle}</span>
                    <span className="text-body-small text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <span className="font-bold text-primary">{attempt.percentage}% (Grade {attempt.grade})</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(attempt.submittedAt?.seconds)}</span>
                    </span>
                  </div>
                  <div className="p-1.5 rounded-full text-on-surface-variant group-hover:text-primary transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="py-4 text-center text-body-medium text-outline">
              No quizzes generated or completed yet.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
