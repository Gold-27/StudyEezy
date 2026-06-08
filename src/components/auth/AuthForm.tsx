"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setAuthSession, createUserProfile, updateUserVerification } from "@/actions/auth";
import { signUpSchema, loginSchema, passwordResetSchema } from "@/validators/auth";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as "login" | "signup" | "reset" | "verify") || "login";

  const [mode, setMode] = useState<"login" | "signup" | "reset" | "verify">(initialMode);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Listen to auth param changes
  useEffect(() => {
    const paramMode = searchParams.get("mode") as "login" | "signup" | "reset" | "verify";
    if (paramMode && ["login", "signup", "reset", "verify"].includes(paramMode)) {
      setMode(paramMode);
    }
  }, [searchParams]);

  // Sync current user state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Trigger verification update on firestore if verified
        if (user.emailVerified) {
          await updateUserVerification(user.uid);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const clearMessages = () => {
    setValidationErrors({});
    setServerError(null);
    setInfoMessage(null);
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      try {
        if (mode === "signup") {
          // Client side custom match validation
          if (password !== confirmPassword) {
            setValidationErrors({ confirmPassword: "Passwords do not match" });
            return;
          }

          // Zod parsing
          const parseResult = signUpSchema.safeParse({ name, email, password });
          if (!parseResult.success) {
            const errors: Record<string, string> = {};
            parseResult.error.errors.forEach((err) => {
              if (err.path[0]) errors[err.path[0] as string] = err.message;
            });
            setValidationErrors(errors);
            return;
          }

          // Register in Firebase
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Send verification email
          await sendEmailVerification(user);

          // Save profile metadata in Firestore
          await createUserProfile(user.uid, name, email);

          // Write session cookie
          const token = await user.getIdToken();
          await setAuthSession(token, false);

          setMode("verify");
          setInfoMessage("Verification link sent! Please check your email to complete registration.");
          
        } else if (mode === "login") {
          // Zod parsing
          const parseResult = loginSchema.safeParse({ email, password });
          if (!parseResult.success) {
            const errors: Record<string, string> = {};
            parseResult.error.errors.forEach((err) => {
              if (err.path[0]) errors[err.path[0] as string] = err.message;
            });
            setValidationErrors(errors);
            return;
          }

          // Sign in
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Write session cookie
          const token = await user.getIdToken();
          await setAuthSession(token, user.emailVerified);

          if (!user.emailVerified) {
            setMode("verify");
            setServerError("Your email is not verified yet. Please click the verification link in your email inbox.");
          } else {
            await updateUserVerification(user.uid);
            router.push("/dashboard");
          }

        } else if (mode === "reset") {
          // Zod parsing
          const parseResult = passwordResetSchema.safeParse({ email });
          if (!parseResult.success) {
            const errors: Record<string, string> = {};
            parseResult.error.errors.forEach((err) => {
              if (err.path[0]) errors[err.path[0] as string] = err.message;
            });
            setValidationErrors(errors);
            return;
          }

          await sendPasswordResetEmail(auth, email);
          setInfoMessage("Password reset email sent successfully. Please check your inbox.");
        }
      } catch (error: any) {
        console.error("Auth action failed:", error);
        let msg = "An unexpected error occurred. Please try again.";
        if (error.code === "auth/email-already-in-use") {
          msg = "This email is already in use by another account.";
        } else if (error.code === "auth/invalid-credential") {
          msg = "Incorrect email or password.";
        } else if (error.code === "auth/user-not-found") {
          msg = "No user found with this email.";
        } else if (error.code === "auth/weak-password") {
          msg = "The password must be at least 6 characters.";
        }
        setServerError(msg);
      }
    });
  };

  const handleResendVerification = async () => {
    clearMessages();
    if (!currentUser) {
      setServerError("Please login again to send verification link.");
      return;
    }
    startTransition(async () => {
      try {
        await sendEmailVerification(currentUser);
        setInfoMessage("Verification link resent. Please check your inbox.");
      } catch (err: any) {
        setServerError("Failed to resend link. Please try again in a moment.");
      }
    });
  };

  const handleVerificationCheck = async () => {
    clearMessages();
    if (!currentUser) return;
    startTransition(async () => {
      try {
        // Force reload auth token to refresh emailVerified field state
        await currentUser.reload();
        const freshUser = auth.currentUser;
        
        if (freshUser && freshUser.emailVerified) {
          const token = await freshUser.getIdToken(true);
          await setAuthSession(token, true);
          await updateUserVerification(freshUser.uid);
          router.push("/dashboard");
        } else {
          setServerError("Email is still not verified. Please verify your email via the link sent to you.");
        }
      } catch (err: any) {
        setServerError("Verification check failed. Please refresh or try again.");
      }
    });
  };

  const handleLogout = async () => {
    clearMessages();
    startTransition(async () => {
      try {
        await signOut(auth);
      } catch (e) {}
      await setAuthSession(null, false);
      setCurrentUser(null);
      setMode("login");
    });
  };

  const handleSimulationLogin = () => {
    clearMessages();
    startTransition(async () => {
      await setAuthSession("mock-user-session-token", true);
      router.push("/dashboard");
    });
  };

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-surface rounded-lg shadow-1 border border-outline/10 text-on-surface">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-headline-small font-semibold text-primary">
          {mode === "login" && "Login to StudyEezy"}
          {mode === "signup" && "Create Account"}
          {mode === "reset" && "Reset Password"}
          {mode === "verify" && "Verify Your Email"}
        </h2>
        <p className="text-body-small text-on-surface-variant/80 mt-1">
          {mode === "login" && "Learn actively, collaboratively and offline"}
          {mode === "signup" && "Start your active recall learning journey"}
          {mode === "reset" && "Enter your email to receive a reset link"}
          {mode === "verify" && "A verification link is required before access"}
        </p>
      </div>

      {/* Info / Error alerts */}
      {serverError && (
        <div className="p-3 mb-4 text-body-small bg-error-container text-on-error-container border border-error/20 rounded-md">
          {serverError}
        </div>
      )}
      {infoMessage && (
        <div className="p-3 mb-4 text-body-small bg-success-container text-on-success-container border border-success/20 rounded-md">
          {infoMessage}
        </div>
      )}

      {mode === "verify" ? (
        <div className="flex flex-col gap-4">
          <p className="text-body-medium text-center text-on-surface-variant">
            We sent a verification link to <strong className="text-on-surface">{currentUser?.email || email}</strong>.
          </p>
          <button
            onClick={handleVerificationCheck}
            disabled={isPending}
            className="w-full py-3 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            {isPending ? "Checking..." : "I've Verified My Email"}
          </button>
          <button
            onClick={handleResendVerification}
            disabled={isPending}
            className="w-full py-2 bg-surface-variant text-on-surface-variant font-medium rounded-md border border-outline/20 hover:bg-surface-variant/90 transition-colors"
          >
            Resend Link
          </button>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="text-body-small text-primary hover:underline font-medium text-center mt-2"
          >
            Use a different account / Logout
          </button>
        </div>
      ) : (
        <form onSubmit={handleAuthAction} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div>
              <label htmlFor="name" className="block text-label-large font-medium mb-1">Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                placeholder="John Doe"
                className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary"
              />
              {validationErrors.name && (
                <p className="text-body-small text-error mt-1">{validationErrors.name}</p>
              )}
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-label-large font-medium mb-1">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isPending}
              placeholder="student@example.edu"
              className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary"
            />
            {validationErrors.email && (
              <p className="text-body-small text-error mt-1">{validationErrors.email}</p>
            )}
          </div>

          {mode !== "reset" && (
            <div>
              <label htmlFor="password" className="block text-label-large font-medium mb-1">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary"
              />
              {validationErrors.password && (
                <p className="text-body-small text-error mt-1">{validationErrors.password}</p>
              )}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label htmlFor="confirmPassword" className="block text-label-large font-medium mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isPending}
                placeholder="••••••••"
                className="w-full px-3 py-2 bg-surface border border-outline/30 rounded-md text-body-medium focus:outline-none focus:border-primary"
              />
              {validationErrors.confirmPassword && (
                <p className="text-body-small text-error mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-3 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity mt-2"
          >
            {isPending ? "Loading..." : ""}
            {!isPending && mode === "login" && "Login"}
            {!isPending && mode === "signup" && "Register"}
            {!isPending && mode === "reset" && "Send Reset Link"}
          </button>

          <div className="relative my-2 flex items-center justify-center">
            <div className="absolute inset-0 border-t border-outline/10" />
            <span className="relative px-3 bg-surface text-[10px] uppercase font-bold text-on-surface-variant/60">
              Or Test Locally
            </span>
          </div>

          <button
            type="button"
            onClick={handleSimulationLogin}
            disabled={isPending}
            className="w-full py-2.5 bg-secondary text-secondary-on font-semibold rounded-md shadow-1 hover:opacity-95 disabled:opacity-50 transition-opacity"
          >
            🚀 Enter Simulator Mode
          </button>

          {/* Links for mode switching */}
          <div className="flex flex-col gap-2 mt-4 text-center">
            {mode === "login" && (
              <>
                <button
                  type="button"
                  onClick={() => { setMode("signup"); clearMessages(); }}
                  className="text-body-small text-on-surface-variant hover:text-primary transition-colors"
                >
                  Don't have an account? <span className="text-primary font-medium hover:underline">Sign Up</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setMode("reset"); clearMessages(); }}
                  className="text-body-small text-primary hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </>
            )}

            {mode === "signup" && (
              <button
                type="button"
                onClick={() => { setMode("login"); clearMessages(); }}
                className="text-body-small text-on-surface-variant hover:text-primary transition-colors"
              >
                Already have an account? <span className="text-primary font-medium hover:underline">Login</span>
              </button>
            )}

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => { setMode("login"); clearMessages(); }}
                className="text-body-small text-primary hover:underline font-medium"
              >
                Back to Login
              </button>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
