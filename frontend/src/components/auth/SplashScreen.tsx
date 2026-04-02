"use client";

import { useEffect, useState } from "react";

type SplashScreenProps = {
  onComplete: () => void;
};

const monthLabels = ["Jan", "Mar", "May", "Jul", "Sep", "Nov"];
const dataPoints = [
  { cx: 40, cy: 140 },
  { cx: 100, cy: 120 },
  { cx: 150, cy: 95 },
  { cx: 200, cy: 70 },
  { cx: 250, cy: 40 },
  { cx: 290, cy: 30 },
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const timer = window.setTimeout(onComplete, 5000);
    return () => window.clearTimeout(timer);
  }, [onComplete]);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const x = ((event.clientX / window.innerWidth) - 0.5) * 24;
      const y = ((event.clientY / window.innerHeight) - 0.5) * 24;
      setPointer({ x, y });
    };

    window.addEventListener("pointermove", handlePointerMove);

    return () => window.removeEventListener("pointermove", handlePointerMove);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex h-screen items-center justify-center overflow-hidden bg-[var(--auth-bg)] text-[var(--auth-ink)]">
      <svg className="absolute inset-0 h-full w-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0L0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div
        className="relative mb-8 max-w-[90vw]"
        style={{ transform: `translate3d(${pointer.x * 0.35}px, ${pointer.y * 0.35}px, 0)` }}
      >
        <svg
          width="320"
          height="180"
          viewBox="0 0 320 180"
          className="auth-splash-hero"
          fill="none"
        >
          {[40, 80, 120, 160].map((y, index) => (
            <line
              key={y}
              x1="20"
              y1={y}
              x2="300"
              y2={y}
              stroke="var(--auth-line-faint)"
              strokeWidth="0.5"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
              className="auth-draw-line"
            />
          ))}

          <line
            x1="30"
            y1="20"
            x2="30"
            y2="165"
            stroke="var(--auth-line-muted)"
            strokeWidth="1"
            style={{ animationDelay: "0.1s" }}
            className="auth-draw-line"
          />
          <line
            x1="30"
            y1="160"
            x2="300"
            y2="160"
            stroke="var(--auth-line-muted)"
            strokeWidth="1"
            style={{ animationDelay: "0.1s" }}
            className="auth-draw-line"
          />

          <path
            d="M40 140 Q70 130 100 120 T150 95 T200 70 T250 40 T290 30"
            stroke="var(--auth-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
            className="auth-draw-path"
          />

          <path
            d="M40 140 Q70 130 100 120 T150 95 T200 70 T250 40 T290 30 L290 160 L40 160 Z"
            fill="var(--auth-accent-soft)"
            className="auth-fade-in"
            style={{ animationDelay: "2.2s" }}
          />

          {dataPoints.map((point, index) => (
            <circle
              key={`${point.cx}-${point.cy}`}
              cx={point.cx}
              cy={point.cy}
              r="4"
              fill="var(--auth-card)"
              stroke="var(--auth-accent)"
              strokeWidth="2"
              className="auth-pop-in"
              style={{ animationDelay: `${1.2 + index * 0.25}s` }}
            />
          ))}

          {monthLabels.map((month, index) => (
            <text
              key={month}
              x={40 + index * 50}
              y="175"
              textAnchor="middle"
              fill="var(--auth-line-muted)"
              fontSize="8"
              className="auth-fade-in"
              style={{ animationDelay: `${0.6 + index * 0.1}s` }}
            >
              {month}
            </text>
          ))}
        </svg>

        <div
          className="auth-card-float auth-fade-in absolute -top-6 -left-10 hidden min-w-36 rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur md:block"
          style={{
            animationDelay: "1.3s",
            transform: `translate3d(${pointer.x * -0.3}px, ${pointer.y * -0.3}px, 0)`,
          }}
        >
          <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--auth-muted)]">Net Worth</p>
          <p className="mt-2 text-lg font-semibold">$128,430</p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--auth-border)]">
            <div className="h-full w-[72%] rounded-full bg-[var(--auth-accent)]" />
          </div>
        </div>

        <div
          className="auth-card-float auth-fade-in absolute top-50 -right-16 hidden min-w-40 rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface)] p-3 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur lg:block"
          style={{
            animationDelay: "1.9s",
            transform: `translate3d(${pointer.x * 0.35}px, ${pointer.y * 0.2}px, 0)`,
          }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--auth-muted)]">Alerts</p>
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
              Live
            </span>
          </div>
          <p className="mt-2 text-sm font-medium">Budget target exceeded</p>
          <p className="mt-1 text-xs text-[var(--auth-muted)]">Dining is 14% above your weekly plan.</p>
        </div>

        <div
          className="auth-card-float auth-fade-in absolute -right-10 -top-35 hidden min-w-44 rounded-2xl border border-[var(--auth-border)] bg-[var(--auth-surface-strong)] p-4 shadow-[0_16px_40px_rgba(15,23,42,0.10)] backdrop-blur md:block"
          style={{
            animationDelay: "2.4s",
            transform: `translate3d(${pointer.x * 0.18}px, ${pointer.y * -0.3}px, 0)`,
          }}
        >
          <div className="flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[var(--auth-muted)]">Growth</p>
              <p className="mt-2 text-xl font-semibold">+18.4%</p>
            </div>
            <div className="auth-pulse-dot h-2.5 w-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="mt-3 flex items-end gap-1.5">
            {[28, 38, 22, 44, 52, 46].map((height, index) => (
              <span
                key={`${height}-${index}`}
                className="auth-grow-bar block w-2 rounded-full bg-[var(--auth-accent-panel)]"
                style={{ height: `${height}px`, animationDelay: `${2.5 + index * 0.08}s` }}
              />
            ))}
          </div>
        </div>
      </div>

      <svg
        className="auth-float-up absolute top-[30%] left-[12%] hidden md:block"
        width="60"
        height="60"
        viewBox="0 0 60 60"
        fill="none"
        style={{ animationDelay: "1.5s" }}
      >
        <ellipse cx="30" cy="45" rx="18" ry="6" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="30" cy="38" rx="18" ry="6" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="30" cy="31" rx="18" ry="6" stroke="currentColor" strokeWidth="1.5" fill="var(--auth-accent-soft)" />
        <ellipse cx="30" cy="24" rx="14" ry="5" stroke="currentColor" strokeWidth="1.5" />
        <ellipse cx="30" cy="18" rx="14" ry="5" stroke="currentColor" strokeWidth="1.5" fill="var(--auth-accent-soft)" />
      </svg>

      <svg
        className="auth-float-up absolute top-[35%] right-[12%] hidden md:block"
        width="56"
        height="48"
        viewBox="0 0 56 48"
        fill="none"
        style={{ animationDelay: "1.8s" }}
      >
        <rect x="3" y="10" width="50" height="34" rx="5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M3 20H53" stroke="currentColor" strokeWidth="1" />
        <rect x="38" y="24" width="15" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" fill="var(--auth-accent-panel)" />
        <circle cx="45" cy="29" r="2" fill="var(--auth-line-muted)" />
        <path d="M10 10Q10 3 20 3H40Q48 3 48 10" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>

      <svg
        className="auth-scale-in absolute bottom-[22%] left-[18%] hidden md:block"
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
        style={{ animationDelay: "2s" }}
      >
        <circle cx="25" cy="25" r="20" stroke="currentColor" strokeWidth="1.5" />
        <path d="M25 25L25 5A20 20 0 0 1 43 33Z" fill="var(--auth-accent-panel)" stroke="currentColor" strokeWidth="1" />
        <path d="M25 25L43 33A20 20 0 0 1 10 38Z" fill="var(--auth-accent-soft)" stroke="currentColor" strokeWidth="1" />
      </svg>

      <svg
        className="auth-float-up absolute right-[15%] bottom-[25%] hidden md:block"
        width="60"
        height="50"
        viewBox="0 0 60 50"
        fill="none"
        style={{ animationDelay: "2.2s" }}
      >
        <line x1="5" y1="45" x2="55" y2="45" stroke="currentColor" strokeWidth="1" />
        {[25, 35, 18, 30].map((height, index) => (
          <rect
            key={height}
            x={10 + index * 12}
            y={45 - height}
            width="8"
            height={height}
            rx="1"
            fill={index === 1 ? "var(--auth-accent-panel)" : "var(--auth-accent-soft)"}
            stroke="currentColor"
            strokeWidth="0.8"
            className="auth-grow-bar"
            style={{ animationDelay: `${2.3 + index * 0.15}s` }}
          />
        ))}
      </svg>

      <span
        className="auth-float-loop absolute top-[20%] right-[28%] text-2xl font-bold text-[var(--auth-ink)] opacity-10"
        style={{ animationDelay: "1.2s" }}
      >
        $
      </span>

      <div className="relative z-10 flex flex-col items-center">
        <h1 className="auth-rise-in text-4xl font-bold tracking-tight md:text-5xl">FinTrack</h1>
        <p className="auth-fade-in mt-3 text-sm uppercase tracking-[0.45em] text-[var(--auth-line-muted)]" style={{ animationDelay: "0.8s" }}>
          Smart Finance Tracking
        </p>
        <div className="auth-fade-in mt-6 flex items-center gap-3 rounded-full border border-[var(--auth-border)] bg-[var(--auth-surface)] px-4 py-2 text-xs text-[var(--auth-muted)] shadow-[0_10px_30px_rgba(15,23,42,0.08)] backdrop-blur">
          <span className="auth-pulse-dot h-2 w-2 rounded-full bg-emerald-500" />
          Syncing balances, spending patterns, and account activity
        </div>
      </div>

      <div className="absolute bottom-12 h-0.5 w-48 overflow-hidden rounded-full bg-[var(--auth-border)]">
        <div className="auth-progress h-full rounded-full bg-[var(--auth-accent)]" />
      </div>

      {[
        "top-[15%] left-[30%]",
        "top-[60%] right-[25%]",
        "bottom-[35%] left-[40%]",
        "top-[45%] left-[8%]",
        "bottom-[15%] right-[35%]",
      ].map((position, index) => (
        <div
          key={position}
          className={`auth-fade-in absolute ${position} h-1.5 w-1.5 rounded-full bg-[var(--auth-ink)] opacity-10`}
          style={{ animationDelay: `${1 + index * 0.3}s` }}
        />
      ))}
    </div>
  );
}
