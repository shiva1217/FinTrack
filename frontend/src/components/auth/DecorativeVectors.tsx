export default function DecorativeVectors() {
  return (
    <>
      <svg
        className="absolute top-24 left-8 opacity-40 lg:left-16"
        width="160"
        height="60"
        viewBox="0 0 160 60"
        fill="none"
      >
        <path
          d="M5 45 Q30 5 55 35 Q80 65 105 25 Q130 -5 155 30"
          stroke="currentColor"
          strokeWidth="2"
        />
      </svg>

      <svg
        className="absolute top-44 left-48 opacity-30"
        width="10"
        height="10"
        viewBox="0 0 10 10"
      >
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>

      <svg
        className="absolute top-1/3 left-6 opacity-25 lg:left-12"
        width="80"
        height="60"
        viewBox="0 0 80 60"
        fill="none"
      >
        <rect x="2" y="2" width="76" height="56" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <line x1="16" y1="20" x2="64" y2="20" stroke="currentColor" strokeWidth="2" />
        <line x1="16" y1="32" x2="52" y2="32" stroke="currentColor" strokeWidth="2" />
        <line x1="16" y1="44" x2="40" y2="44" stroke="currentColor" strokeWidth="1.5" />
      </svg>

      <svg className="absolute bottom-32 left-20 opacity-20" width="50" height="50" viewBox="0 0 50 50" fill="none">
        <polygon
          points="25,5 45,45 5,45"
          stroke="var(--auth-accent)"
          strokeWidth="1.5"
          fill="var(--auth-accent-soft)"
        />
      </svg>

      <svg
        className="absolute bottom-16 left-4 opacity-30 lg:left-10"
        width="90"
        height="100"
        viewBox="0 0 90 100"
        fill="none"
      >
        <rect x="2" y="2" width="86" height="96" rx="6" fill="var(--auth-accent-dots)" />
        {[15, 35, 55, 75].map((y) =>
          [18, 38, 58, 72].map((x) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="4" fill="var(--auth-dot-strong)" />
          )),
        )}
      </svg>

      <svg className="absolute bottom-36 left-36 opacity-25" width="50" height="60" viewBox="0 0 50 60" fill="none">
        <rect x="5" y="10" width="40" height="45" rx="3" stroke="currentColor" strokeWidth="1" />
        <path d="M20 40 L30 20 L32 22" stroke="currentColor" strokeWidth="1.5" fill="none" />
        <path d="M28 20 L32 22 L26 24" stroke="currentColor" strokeWidth="1.5" fill="none" />
      </svg>

      <svg className="absolute top-32 right-24 opacity-25" width="10" height="10" viewBox="0 0 10 10">
        <circle cx="5" cy="5" r="3" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>

      <svg
        className="absolute top-1/3 right-6 opacity-20 lg:right-14"
        width="50"
        height="50"
        viewBox="0 0 50 50"
        fill="none"
      >
        <rect x="2" y="2" width="46" height="46" rx="4" stroke="currentColor" strokeWidth="1.5" />
        <line x1="12" y1="18" x2="38" y2="18" stroke="currentColor" strokeWidth="2.5" />
        <line x1="12" y1="26" x2="38" y2="26" stroke="currentColor" strokeWidth="2.5" />
        <line x1="12" y1="34" x2="38" y2="34" stroke="currentColor" strokeWidth="2.5" />
      </svg>

      <svg
        className="absolute top-1/3 right-20 opacity-30 lg:right-32"
        width="120"
        height="50"
        viewBox="0 0 120 50"
        fill="none"
      >
        <path
          d="M5 25 Q25 5 45 25 Q65 45 85 25 Q105 5 115 25"
          stroke="currentColor"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      <svg
        className="absolute top-[28%] right-16 opacity-20 lg:right-28"
        width="40"
        height="35"
        viewBox="0 0 40 35"
        fill="none"
      >
        <path
          d="M5 5 H35 Q38 5 38 8 V22 Q38 25 35 25 H18 L12 32 L14 25 H5 Q2 25 2 22 V8 Q2 5 5 5Z"
          fill="var(--auth-accent-dots)"
          stroke="currentColor"
          strokeWidth="1"
        />
      </svg>

      <svg
        className="absolute right-4 bottom-12 opacity-25 lg:right-10"
        width="70"
        height="90"
        viewBox="0 0 70 90"
        fill="none"
      >
        <rect x="2" y="2" width="66" height="86" rx="6" fill="var(--auth-accent-panel)" />
        {[18, 38, 58, 74].map((y) =>
          [16, 36, 54].map((x) => (
            <circle key={`r-${x}-${y}`} cx={x} cy={y} r="3.5" fill="var(--auth-dot-strong)" />
          )),
        )}
      </svg>

      <svg className="absolute top-20 right-1/3 opacity-15" width="6" height="6" viewBox="0 0 6 6">
        <circle cx="3" cy="3" r="2.5" fill="currentColor" />
      </svg>
      <svg className="absolute bottom-40 left-1/3 opacity-15" width="8" height="8" viewBox="0 0 8 8">
        <circle cx="4" cy="4" r="3" fill="currentColor" />
      </svg>
    </>
  );
}
