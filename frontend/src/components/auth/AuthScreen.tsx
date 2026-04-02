"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

import DecorativeVectors from "@/components/auth/DecorativeVectors";
import financeIllustration from "@/assets/finance-illustration.png";
import { getStoredAuthToken, persistAuthSession, signIn, signUp } from "@/lib/auth";
import ThemeToggle from "@/components/shared/ThemeToggle";

type AuthMode = "signin" | "signup";

type AuthScreenProps = {
  mode: AuthMode;
};

function SocialIcon({ provider }: { provider: "google" | "apple" }) {
  if (provider === "google") {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
      </svg>
    );
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function PasswordField({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="auth-input pr-20"
      />
      <button
        type="button"
        onClick={() => setVisible((current) => !current)}
        className="absolute top-1/2 right-4 -translate-y-1/2 text-xs font-semibold text-[var(--auth-muted)] transition hover:text-[var(--auth-ink)]"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export default function AuthScreen({ mode }: AuthScreenProps) {
  const isSignUp = mode === "signup";
  const pathname = usePathname();
  const router = useRouter();
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (getStoredAuthToken()) {
        router.replace("/dashboard");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const payload = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      persistAuthSession(payload);
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to continue right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[var(--auth-bg)] text-[var(--auth-ink)]">
      <header className="relative z-20 flex shrink-0 items-center justify-between px-6 py-4 md:px-10">
        <div>
          <h2 className="text-xl font-bold tracking-tight">FinTrack</h2>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={isSignUp ? "/signin" : "/signup"}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              pathname === (isSignUp ? "/signin" : "/signup")
                ? "bg-[var(--auth-accent)] text-[var(--auth-accent-text)] shadow-[0_10px_30px_rgba(244,161,126,0.28)]"
                : "hover:bg-[var(--auth-surface)]"
            }`}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-4 py-4 md:px-6">
        <div className="pointer-events-none absolute inset-0 text-[var(--auth-line-muted)]">
          <DecorativeVectors />
        </div>

        <div className="pointer-events-none absolute right-8 bottom-12 z-10 hidden md:block lg:right-16 lg:bottom-16">
          <Image
            src={financeIllustration}
            alt="Finance illustration"
            width={280}
            height={280}
            className="opacity-85"
            priority
          />
        </div>

        <div className="relative z-10 w-full max-w-md rounded-[28px] border border-[var(--auth-border)] bg-[var(--auth-card)] p-6 shadow-[0_30px_80px_rgba(15,23,42,0.12)] md:p-8">
          <h1 className="mb-2 text-center text-2xl font-bold">
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h1>
          <p className="mb-6 text-center text-sm text-[var(--auth-muted)]">
            {isSignUp
              ? "Start tracking your finances in minutes"
              : "Enter your details to access your finance dashboard"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder={isSignUp ? "Email Address" : "Enter Email / Phone No"}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="auth-input"
            />

            <PasswordField
              value={password}
              onChange={setPassword}
              placeholder={isSignUp ? "Create Passcode" : "Passcode"}
            />

            {isSignUp ? (
              <p className="text-xs text-[var(--auth-muted)]">
                By signing up, you agree to our{" "}
                <span className="font-semibold text-[var(--auth-ink)] underline">Terms</span> &{" "}
                <span className="font-semibold text-[var(--auth-ink)] underline">Privacy Policy</span>
              </p>
            ) : (
              <p className="text-sm text-[var(--auth-muted)] transition hover:text-[var(--auth-ink)]">
                Having trouble signing in?
              </p>
            )}

            <button type="submit" className="auth-primary-button" disabled={isSubmitting}>
              {isSubmitting
                ? isSignUp
                  ? "Creating account..."
                  : "Signing in..."
                : isSignUp
                  ? "Create Account"
                  : "Sign in"}
            </button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--auth-border)]" />
            <span className="text-xs text-[var(--auth-muted)]">
              {isSignUp ? "Or Sign up with" : "Or Sign in with"}
            </span>
            <div className="h-px flex-1 bg-[var(--auth-border)]" />
          </div>

          <div className="flex gap-3">
            <button type="button" className="auth-social-button">
              <SocialIcon provider="google" />
              Google
            </button>
            <button type="button" className="auth-social-button">
              <SocialIcon provider="apple" />
              Apple ID
            </button>
          </div>

          <p className="mt-6 text-center text-sm text-[var(--auth-muted)]">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <Link href={isSignUp ? "/signin" : "/signup"} className="font-semibold text-[var(--auth-ink)] underline">
              {isSignUp ? "Sign in" : "Request Now"}
            </Link>
          </p>
        </div>

        {errorMessage ? (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(15,23,42,0.45)] px-4">
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="auth-error-title"
              className="w-full max-w-sm rounded-[24px] border border-red-200 bg-[var(--auth-surface-strong)] p-5 shadow-[0_30px_80px_rgba(15,23,42,0.22)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 id="auth-error-title" className="text-lg font-semibold text-red-600">
                    Wrong Credentials
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--auth-ink)]">
                    {errorMessage}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMessage("")}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--auth-border)] text-lg leading-none text-[var(--auth-muted)] transition hover:bg-[var(--auth-surface)] hover:text-[var(--auth-ink)]"
                  aria-label="Close error dialog"
                >
                  ×
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      <footer className="relative z-20 shrink-0 py-3 text-center text-xs text-[var(--auth-muted)]">
        Copyright @FinTrack {currentYear} | Privacy Policy
      </footer>
    </div>
  );
}
