"use client";

import React, { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { setAuthSession, createUserProfile, updateUserVerification } from "@/actions/auth";
import { signUpSchema, loginSchema, passwordResetSchema } from "@/validators/auth";

export default function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"login" | "signup" | "reset" | "verify">("login");
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  // Form values
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // States
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Listen to auth param changes
  useEffect(() => {
    setIsMounted(true);
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
          const token = await user.getIdToken();
          await updateUserVerification(token);
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

  const handleSwitchMode = (newMode: "login" | "signup" | "reset") => {
    setMode(newMode);
    clearMessages();
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };

  const handleAuthAction = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    startTransition(async () => {
      try {
        if (mode === "signup") {
          let localErrors: Record<string, string> = {};

          // Client side custom match validation
          if (!confirmPassword) {
            localErrors.confirmPassword = "Please fill this form";
          } else if (password !== confirmPassword) {
            localErrors.confirmPassword = "Passwords do not match";
          }

          // Zod parsing
          const parseResult = signUpSchema.safeParse({ name, email, password });
          if (!parseResult.success) {
            parseResult.error.errors.forEach((err) => {
              if (err.path[0] && !localErrors[err.path[0] as string]) {
                localErrors[err.path[0] as string] = err.message;
              }
            });
          }

          if (Object.keys(localErrors).length > 0) {
            setValidationErrors(localErrors);
            return;
          }

          // Register in Firebase
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;

          // Save display name to Firebase Auth profile
          await updateProfile(user, { displayName: name });

          // Send verification email
          await sendEmailVerification(user);

          // Save profile metadata in Firestore
          // Get ID token first to pass to server action securely
        const token = await user.getIdToken();
        await createUserProfile(token, name, email);

          // Write session cookie
          await setAuthSession(token, false);

          setMode("verify");
          setInfoMessage("Verification link sent! Please check your email to complete registration.");
          
        } else if (mode === "login") {
          // Zod parsing
          const parseResult = loginSchema.safeParse({ email, password });
          if (!parseResult.success) {
            const errors: Record<string, string> = {};
            parseResult.error.errors.forEach((err) => {
              if (err.path[0] && !errors[err.path[0] as string]) {
                errors[err.path[0] as string] = err.message;
              }
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
            const token = await user.getIdToken();
            await updateUserVerification(token);
            router.push("/dashboard");
          }

        } else if (mode === "reset") {
          // Zod parsing
          const parseResult = passwordResetSchema.safeParse({ email });
          if (!parseResult.success) {
            const errors: Record<string, string> = {};
            parseResult.error.errors.forEach((err) => {
              if (err.path[0] && !errors[err.path[0] as string]) {
                errors[err.path[0] as string] = err.message;
              }
            });
            setValidationErrors(errors);
            return;
          }

          await sendPasswordResetEmail(auth, email);
          setInfoMessage("Password reset email sent successfully. Please check your inbox.");
        }
      } catch (error: any) {
        console.error("Auth action failed:", error);
        if (error.code === "auth/email-already-in-use") {
          setValidationErrors({ email: "This email is already in use by another account." });
        } else if (error.code === "auth/user-not-found") {
          setValidationErrors({ email: "No user found with this email." });
        } else if (error.code === "auth/invalid-email") {
          setValidationErrors({ email: "Please enter a valid email address." });
        } else if (error.code === "auth/weak-password") {
          setValidationErrors({ password: "The password must be at least 6 characters." });
        } else if (error.code === "auth/invalid-credential") {
          setServerError("Incorrect email or password.");
        } else {
          setServerError("An unexpected error occurred. Please try again.");
        }
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
          await updateUserVerification(token);
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

  const handleGoogleLogin = async () => {
    clearMessages();
    
    try {
      // Must be called synchronously in the click handler to avoid popup blockers
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      try {
        const token = await user.getIdToken();
        const profileRes = await createUserProfile(token, user.displayName || "Google User", user.email || "", true);
        if (!profileRes || !profileRes.success) {
           console.warn("Profile creation reported failure:", profileRes?.error);
        }
        
        await setAuthSession(token, true);

        // Explicitly update Firestore verification flag as well
        await updateUserVerification(token);

        router.push("/dashboard");
      } catch (serverError: any) {
        console.error("Google Sign-In server setup failed:", serverError);
        setServerError(`Setup failed: ${serverError?.message || "Unknown error"}. Please refresh and try again.`);
      }
    } catch (error: any) {
      console.error("Google Sign-In popup failed:", error);
      if (error.code !== "auth/popup-closed-by-user" && error.code !== "auth/cancelled-popup-request") {
        setServerError(error.message || "Google Sign-In failed. Please ensure popups are allowed.");
      }
    }
  };

  if (!isMounted) {
    return (
      <div className="w-full max-w-sm mx-auto p-4 bg-surface rounded-lg shadow-1 border border-outline/10 text-on-surface flex items-center justify-center min-h-[400px]">
        <p className="text-body-medium text-on-surface-variant">Loading...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm mx-auto p-4 bg-surface rounded-lg shadow-1 border border-outline/10 text-on-surface max-h-[90dvh] overflow-y-auto">
      <div className="flex flex-col items-center mb-6">
        <div className="flex items-center gap-1 mb-2">
          <Image src="/logo.jpeg" alt="StudyEezy Logo" width={32} height={32} className="rounded-md" />
          <h2 className="text-headline-small font-bold text-primary">
            Study<span className="text-tertiary">Eezy</span>
          </h2>
        </div>
        <h3 className="text-title-medium font-semibold text-on-surface">
          {mode === "login" && "Welcome Back"}
          {mode === "signup" && "Create Account"}
          {mode === "reset" && "Reset Password"}
          {mode === "verify" && "Verify Your Email"}
        </h3>
        <p className="text-body-small text-on-surface-variant/80 mt-1 text-center">
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
            className="w-full py-2 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity"
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
        <form onSubmit={handleAuthAction} className="flex flex-col gap-3" noValidate>
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
                className="w-full px-3 py-2 bg-surface border border-outline/30 hover:border-outline/60 rounded-md text-body-medium focus:outline-none focus:border-primary transition-colors duration-200"
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
              autoComplete={mode === "login" ? "username" : "off"}
              className="w-full px-3 py-2 bg-surface border border-outline/30 hover:border-outline/60 rounded-md text-body-medium focus:outline-none focus:border-primary transition-colors duration-200"
            />
            {validationErrors.email && (
              <p className="text-body-small text-error mt-1">{validationErrors.email}</p>
            )}
          </div>

          {mode !== "reset" && (
            <div>
              <label htmlFor="password" className="block text-label-large font-medium mb-1">Password</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  placeholder="••••••••"
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  className="w-full pl-3 pr-10 py-2 bg-surface border border-outline/30 hover:border-outline/60 rounded-md text-body-medium focus:outline-none focus:border-primary transition-colors duration-200"
                />
                {password.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {validationErrors.password && (
                <p className="text-body-small text-error mt-1">{validationErrors.password}</p>
              )}
            </div>
          )}

          {mode === "signup" && (
            <div>
              <label htmlFor="confirmPassword" className="block text-label-large font-medium mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isPending}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full pl-3 pr-10 py-2 bg-surface border border-outline/30 hover:border-outline/60 rounded-md text-body-medium focus:outline-none focus:border-primary transition-colors duration-200"
                />
                {confirmPassword.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 hover:text-primary transition-colors focus:outline-none"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                )}
              </div>
              {validationErrors.confirmPassword && (
                <p className="text-body-small text-error mt-1">{validationErrors.confirmPassword}</p>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full py-2 bg-primary text-primary-on font-semibold rounded-md shadow-2 hover:opacity-95 disabled:opacity-50 transition-opacity mt-2"
          >
            {isPending ? "Loading..." : ""}
            {!isPending && mode === "login" && "Login"}
            {!isPending && mode === "signup" && "Register"}
            {!isPending && mode === "reset" && "Send Reset Link"}
          </button>

          {(mode === "login" || mode === "signup") && (
            <>
              <div className="relative my-2 flex items-center justify-center">
                <div className="absolute inset-x-0 top-1/2 border-t border-outline/10 -translate-y-1/2" />
                <span className="relative px-3 bg-surface text-[10px] uppercase font-bold text-on-surface-variant/60">
                  Or continue with
                </span>
              </div>

              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isPending}
                className="w-full py-2 bg-surface text-on-surface font-semibold rounded-md border border-outline/30 shadow-1 hover:bg-surface-variant/10 hover:shadow-2 hover:scale-[1.01] active:scale-[0.99] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span>Google</span>
              </button>
            </>
          )}

          {/* Links for mode switching */}
          <div className="flex flex-col gap-2 mt-4 text-center">
            {mode === "login" && (
              <>
                <div className="text-body-small text-on-surface-variant">
                  Don't have an account?{" "}
                  <button
                    type="button"
                    onClick={() => handleSwitchMode("signup")}
                    className="text-primary font-medium hover:underline focus:outline-none transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleSwitchMode("reset")}
                  className="text-body-small text-primary hover:underline font-medium"
                >
                  Forgot your password?
                </button>
              </>
            )}

            {mode === "signup" && (
              <div className="text-body-small text-on-surface-variant">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleSwitchMode("login")}
                  className="text-primary font-medium hover:underline focus:outline-none transition-colors"
                >
                  Login
                </button>
              </div>
            )}

            {mode === "reset" && (
              <button
                type="button"
                onClick={() => handleSwitchMode("login")}
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
