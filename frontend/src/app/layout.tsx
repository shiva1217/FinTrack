import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "FinTrack",
  description: "All your financial transaction in one app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <head>
        <Script id="fintrack-theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var storedTheme = window.localStorage.getItem("fintrack_theme");
                var preferredTheme = storedTheme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
                document.documentElement.dataset.theme = preferredTheme;
              } catch (error) {
                document.documentElement.dataset.theme = "light";
              }
            })();
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
