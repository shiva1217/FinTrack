"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import LandingPage from "@/components/marketing/LandingPage";
import SplashScreen from "@/components/auth/SplashScreen";
import { getStoredAuthToken } from "@/lib/auth";

const SPLASH_KEY = "fintrack_splash_seen";

export default function HomeExperience() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (getStoredAuthToken()) {
        router.replace("/dashboard");
        return;
      }

      const seenSplash = window.sessionStorage.getItem(SPLASH_KEY) === "true";
      setShowSplash(!seenSplash);
      setReady(true);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [router]);

  const handleSplashComplete = () => {
    window.sessionStorage.setItem(SPLASH_KEY, "true");
    setShowSplash(false);
  };

  if (!ready) {
    return <div className="min-h-screen bg-[var(--auth-bg)]" />;
  }

  return (
    <div className="relative min-h-screen">
      <div
        className={`transition-opacity duration-500 ${showSplash ? "pointer-events-none opacity-0" : "opacity-100"}`}
      >
        <LandingPage />
      </div>
      {showSplash ? <SplashScreen onComplete={handleSplashComplete} /> : null}
    </div>
  );
}
