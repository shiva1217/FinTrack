"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import ThemeToggle from "@/components/shared/ThemeToggle";
import { getStoredAuthToken } from "@/lib/auth";

const serviceCards = [
  {
    title: "Expense Intelligence",
    body: "Capture daily transactions, clean categories, and searchable notes in one reliable ledger.",
    accent: "violet",
  },
  {
    title: "Cash-Flow Momentum",
    body: "See what is accelerating, what is flattening, and where your monthly money rhythm changes.",
    accent: "sky",
  },
  {
    title: "Alerts & Thresholds",
    body: "Set category limits and catch warning states before overspending becomes the month's story.",
    accent: "amber",
  },
  {
    title: "AI-Led Insights",
    body: "Turn raw entries into practical suggestions with patterns grounded in recent behavior.",
    accent: "emerald",
  },
  {
    title: "Monthly Reporting",
    body: "Review top categories, payment methods, and SQL-backed snapshots without exporting spreadsheets.",
    accent: "rose",
  },
  {
    title: "Admin Visibility",
    body: "Compare user-level activity and aggregate spend when you need an assessment-friendly overview.",
    accent: "indigo",
  },
];

const proofCards = [
  {
    title: "Scenario Boards",
    body: "From daily entries to monthly rollups, the interface keeps the same visual language all the way through.",
  },
  {
    title: "Fast Manager",
    body: "Edit, delete, filter, and review data without losing the overall picture of the month.",
  },
  {
    title: "Smart Communication",
    body: "Cards, alerts, and charts work together so the product explains what changed instead of just listing it.",
  },
];

const roadmap = [
  { step: "01", title: "Make Account", body: "Create your profile and enter the dashboard in seconds." },
  { step: "02", title: "Set Budget", body: "Define category caps that match how you actually spend." },
  { step: "03", title: "Add Spending", body: "Track transactions with category, method, notes, and dates." },
  { step: "04", title: "Stay Informed", body: "Use trends, reports, and alerts to adjust before month-end." },
];

const stats = [
  { value: "50+", label: "tracked scenarios" },
  { value: "100+", label: "clean transaction states" },
  { value: "7+", label: "connected finance views" },
  { value: "99%", label: "clarity-first interface" },
];

const miniMetrics = [
  { label: "Monthly Spend", value: "INR 27.3K", tone: "violet" },
  { label: "Alert Status", value: "2 Warnings", tone: "amber" },
  { label: "Top Category", value: "Rent", tone: "sky" },
];

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    if (getStoredAuthToken()) {
      router.replace("/dashboard");
    }
  }, [router]);

  return (
    <div className="landing-ref-shell">
      <header className="landing-ref-topbar">
        <div className="landing-ref-brand">
          <span className="landing-ref-brand-mark">
            <Image
              src="/fintrack-logo.svg"
              alt="FinTrack logo"
              width={20}
              height={20}
              className="landing-ref-brand-mark-image"
              priority
            />
          </span>
          <div>
            <p>FinTrack</p>
            <span>Personal finance tracker</span>
          </div>
        </div>

        <nav className="landing-ref-menu">
          <a href="#services">Services</a>
          <a href="#proof">Proof</a>
          <a href="#process">Process</a>
          <a href="#contact">Contact</a>
        </nav>

        <div className="landing-ref-actions">
          <Link href="/signup" className="landing-ref-primary-button">
            Get started
          </Link>
          <ThemeToggle />
        </div>
      </header>

      <main>
        <section className="landing-ref-hero">
          <div className="landing-ref-hero-copy">
            <p className="landing-ref-eyebrow">Finance workspace</p>
            <h1>
              See where your
              <span> money goes</span>
              before it's too late.
            </h1>
            <p>
              FinTrack helps people understand what changed in their spending, what is under pressure,
              and what to do next before the month gets away from them.
            </p>

            <div className="landing-ref-hero-actions">
              <Link href="/signup" className="landing-ref-primary-button">
                Start Tracking Free
              </Link>
            </div>
          </div>

          <div className="landing-ref-hero-visual">
            <div className="landing-ref-orbit-card landing-ref-orbit-card-top">Alerts ready</div>
            <div className="landing-ref-orbit-card landing-ref-orbit-card-left">Reports synced</div>
            <div className="landing-ref-orbit-card landing-ref-orbit-card-right">Insights active</div>
            <div className="landing-ref-orbit-core">
              <div className="landing-ref-orbit-inner" />
            </div>

            <div className="landing-ref-floating-panel">
              {miniMetrics.map((metric) => (
                <div key={metric.label} className={`landing-ref-metric landing-ref-metric-${metric.tone}`}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="landing-ref-stats-strip">
          <div className="landing-ref-stats-grid">
            {stats.map((stat) => (
              <article key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </article>
            ))}
          </div>
        </section>

        <section id="services" className="landing-ref-section landing-ref-services">
          <div className="landing-ref-section-heading">
            <p className="landing-ref-section-eyebrow">Core Services</p>
            <h2>
              Everything Your Business Needs
              <span>to Thrive Digitally</span>
            </h2>
          </div>

          <div className="landing-ref-service-grid">
            {serviceCards.map((card) => (
              <article key={card.title} className="landing-ref-service-card">
                <span className={`landing-ref-service-dot landing-ref-service-dot-${card.accent}`} />
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="proof" className="landing-ref-proof">
          <div className="landing-ref-section-heading landing-ref-section-heading-inverse">
            <p className="landing-ref-section-eyebrow">Why FinTrack</p>
            <h2>Built In-House. Proven in the Field.</h2>
          </div>

          <div className="landing-ref-proof-grid">
            {proofCards.map((card, index) => (
              <article key={card.title} className="landing-ref-proof-card">
                <span className="landing-ref-proof-index">0{index + 1}</span>
                <h3>{card.title}</h3>
                <p>{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="process" className="landing-ref-section landing-ref-process">
          <div className="landing-ref-section-heading">
            <p className="landing-ref-section-eyebrow">Work Process</p>
            <h2>From Vision to Production</h2>
          </div>

          <div className="landing-ref-process-line">
            {roadmap.map((item) => (
              <article key={item.step} className="landing-ref-process-step">
                <div className="landing-ref-process-badge">{item.step}</div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-ref-quote-wrap">
          <div className="landing-ref-quote-card">
            <p className="landing-ref-section-eyebrow">Testimonial</p>
            <blockquote>
              "FinTrack made our spending review process clearer, faster, and much more actionable than
              the spreadsheet-heavy workflow we were using before."
            </blockquote>
            <span>User</span>
          </div>
        </section>

        <section id="contact" className="landing-ref-cta">
          <div className="landing-ref-cta-copy">
            <p className="landing-ref-section-eyebrow">Let's Start</p>
            <h2>Ready to Build Something Amazing?</h2>
            <p>
              Open the app, create your account, and start shaping a cleaner, more useful financial
              workflow.
            </p>
          </div>

          <div className="landing-ref-hero-actions">
            <Link href="/signup" className="landing-ref-primary-button">
              Start Free Today
            </Link>
            <Link href="/signin" className="landing-ref-secondary-button landing-ref-secondary-button-dark">
              Existing Account
            </Link>
          </div>
        </section>
      </main>

      <footer className="landing-ref-footer">
        <div className="landing-ref-footer-brand">
          <div className="landing-ref-brand">
            <span className="landing-ref-brand-mark">
              <Image
                src="/fintrack-logo.svg"
                alt="FinTrack logo"
                width={44}
                height={44}
                className="landing-ref-brand-mark-image"
              />
            </span>
            <div>
              <p>FinTrack</p>
              <span>Personal finance operations platform</span>
            </div>
          </div>
          <p>
            A cleaner way to track expenses, monitor budgets, and understand how your month is actually
            unfolding.
          </p>
        </div>

        <div className="landing-ref-footer-links">
          <div>
            <h4>Product</h4>
            <a href="#services">Services</a>
            <a href="#proof">Proof</a>
            <a href="#process">Process</a>
          </div>
          <div>
            <h4>Legal</h4>
            <a href="#">Privacy policy</a>
            <a href="#">Terms &amp; conditions</a>
            <a href="#">Cookies</a>
          </div>
          <div>
            <h4>Contact</h4>
            <a href="mailto:help@fintrack.in">help@fintrack.in</a>
          </div>
        </div>
        <p className="landing-ref-footer-copy">
          (c) {new Date().getFullYear()} FinTrack. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
