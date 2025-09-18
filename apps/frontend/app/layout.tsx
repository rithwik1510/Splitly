import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/layout/providers";
import { AppToaster } from "@/components/layout/toaster";
import { WebVitalsReporter } from "@/components/layout/web-vitals-reporter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Splitly",
  description: "Modern expense sharing for groups and friends.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`min-h-screen bg-white text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100 ${inter.className}`}
      >
        <Providers>
          {children}
          <AppToaster />
          <WebVitalsReporter />
        </Providers>
      </body>
    </html>
  );
}
