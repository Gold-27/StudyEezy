"use client";

import React, { useState, useEffect } from "react";
import { User, Settings, Lock, LogOut, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { signOut, sendPasswordResetEmail } from "firebase/auth";
import type { User as FirebaseUser } from "firebase/auth";
import { useRouter } from "next/navigation";
import { setAuthSession } from "@/actions/auth";
import { deleteUserAccountAndData } from "@/actions/account";

export default function ProfilePage() {
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Fetch user preferences
        try {
          const userDocRef = doc(db, "users", currentUser.uid);
          const userSnap = await getDoc(userDocRef);
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (typeof data.emailNotifications === "boolean") {
              setEmailNotifications(data.emailNotifications);
            }
          }
        } catch (error) {
          console.error("Failed to load preferences:", error);
        }
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      const parts = name.trim().split(" ");
      if (parts.length > 1) {
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      await setAuthSession(null, false);
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    const confirmDelete = window.confirm(
      "Are you sure you want to completely delete your account and all associated data? This action CANNOT be undone."
    );
    if (!confirmDelete) return;

    try {
      // Set a loading state or directly invoke the server action
      const result = await deleteUserAccountAndData();
      
      if (result.success) {
        // Fallback cleanup on client side just in case
        try {
          await signOut(auth);
        } catch(e) {}
        router.push("/");
      } else {
        console.error("Error from server:", result.error);
        if (result.error === "Invalid session" || result.error === "Unauthorized") {
          alert("For security reasons, please log out and log back in before deleting your account.");
        } else {
          alert("An error occurred while deleting your account: " + result.error);
        }
      }
    } catch (error: any) {
      console.error("Error deleting account:", error);
      alert("An error occurred while deleting your account. Please try again.");
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const toggleEmailNotifications = async () => {
    const newState = !emailNotifications;
    setEmailNotifications(newState); // Optimistic UI update

    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        await setDoc(userDocRef, { emailNotifications: newState }, { merge: true });
      } catch (error) {
        console.error("Failed to save preference:", error);
        setEmailNotifications(!newState); // Revert on failure
      }
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 5000);
    } catch (error) {
      console.error("Error sending password reset email:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6 text-on-surface max-w-2xl mx-auto w-full animate-pulse">
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-24 h-24 bg-surface-variant rounded-full mb-4"></div>
          <div className="h-7 w-40 bg-surface-variant rounded mt-1"></div>
          <div className="h-4 w-48 bg-surface-variant rounded mt-2"></div>
        </div>
        
        <div className="flex flex-col gap-4">
          <div className="h-[58px] bg-surface border border-outline/10 shadow-1 rounded-lg w-full"></div>
          <div className="h-[58px] bg-surface border border-outline/10 shadow-1 rounded-lg w-full"></div>
        </div>

        <hr className="border-outline/10 my-2" />

        <div className="flex flex-col gap-3">
          <div className="h-[50px] bg-surface border border-outline/20 rounded-lg w-full"></div>
          <div className="h-[50px] bg-surface border border-outline/20 rounded-lg w-full mt-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 text-on-surface max-w-2xl mx-auto w-full">

      {/* User Header */}
      {user && (
        <div className="flex flex-col items-center justify-center py-4">
          <div className="w-24 h-24 bg-accent-container text-accent-on-container rounded-full flex items-center justify-center text-headline-large font-bold shadow-1 mb-4">
            {getInitials(user.displayName, user.email)}
          </div>
          <h2 className="text-title-large font-semibold text-outline">
            {user.displayName || "StudyEezy User"}
          </h2>
          <p className="text-body-medium text-outline mt-1">
            {user.email}
          </p>
        </div>
      )}
      
      <div className="flex flex-col gap-4">
        {/* Preferences Accordion */}
        <div className="bg-surface border border-outline/10 rounded-lg shadow-1 overflow-hidden">
          <button 
            onClick={() => toggleSection("preferences")}
            className="flex items-center justify-between w-full text-left px-4 py-4 transition-colors hover:bg-surface-variant/30"
          >
            <div className="flex items-center gap-3 font-semibold text-title-medium">
              <Settings className="w-5 h-5 text-primary" /> Preferences
            </div>
            {expandedSection === "preferences" ? <ChevronUp className="w-5 h-5 text-on-surface-variant" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
          </button>
          
          {expandedSection === "preferences" && (
            <div className="px-4 pb-6 pt-2 border-t border-outline/10">
              <p className="text-body-medium text-on-surface-variant mb-4">
                Adjust your learning and notification preferences here.
              </p>
              <div className="border border-outline/20 p-4 rounded-md flex items-start justify-between bg-surface-variant/10">
                <div>
                  <h4 className="font-semibold text-body-large leading-tight mt-0.5">Email Notifications</h4>
                  <p className="text-body-small text-on-surface-variant mt-1">Receive alerts when someone joins your study rooms.</p>
                </div>
                <button 
                  onClick={toggleEmailNotifications}
                  role="switch"
                  aria-checked={emailNotifications}
                  className={`mt-1 relative inline-flex h-[20px] w-[36px] shrink-0 cursor-pointer items-center rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none ${
                    emailNotifications ? "bg-primary border-primary" : "bg-surface-variant border-outline/30"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-surface border border-outline/20 shadow-sm ring-0 transition duration-200 ease-in-out ${
                      emailNotifications ? "translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Security Accordion */}
        <div className="bg-surface border border-outline/10 rounded-lg shadow-1 overflow-hidden">
          <button 
            onClick={() => toggleSection("security")}
            className="flex items-center justify-between w-full text-left px-4 py-4 transition-colors hover:bg-surface-variant/30"
          >
            <div className="flex items-center gap-3 font-semibold text-title-medium">
              <Lock className="w-5 h-5 text-primary" /> Security
            </div>
            {expandedSection === "security" ? <ChevronUp className="w-5 h-5 text-on-surface-variant" /> : <ChevronDown className="w-5 h-5 text-on-surface-variant" />}
          </button>
          
          {expandedSection === "security" && (
            <div className="px-4 pb-6 pt-2 border-t border-outline/10">
              <p className="text-body-medium text-on-surface-variant mb-4">
                Manage your account security and password settings.
              </p>
              <div className="border border-outline/20 p-4 rounded-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-variant/10">
                <div>
                  <h4 className="font-semibold text-body-large">Change Password</h4>
                  <p className="text-body-small text-on-surface-variant mt-0.5">Update your login credentials securely.</p>
                </div>
                <button 
                  onClick={handlePasswordReset}
                  disabled={resetEmailSent}
                  className={`px-5 py-2 rounded-md text-label-large font-bold transition-colors shadow-1 ${
                    resetEmailSent 
                      ? "bg-success-container text-on-success-container" 
                      : "bg-secondary text-primary-on hover:bg-secondary/90"
                  }`}
                >
                  {resetEmailSent ? "Email Sent!" : "Update"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <hr className="border-outline/10 my-2" />

      {/* Account Actions */}
      <div className="flex flex-col gap-3">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-surface border border-outline/20 text-on-surface font-semibold rounded-lg hover:bg-surface-variant/50 transition-colors"
        >
          <LogOut className="w-5 h-5 text-on-surface-variant" />
          Log Out
        </button>
        
        <button 
          onClick={handleDeleteAccount}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-error-container/50 border border-error/20 text-error font-semibold rounded-lg hover:bg-error-container transition-colors mt-2"
        >
          <Trash2 className="w-5 h-5" />
          Delete Account
        </button>
      </div>

    </div>
  );
}
