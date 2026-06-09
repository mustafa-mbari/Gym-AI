import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "JYM — Your AI Gym & Weight-Loss Coach",
    template: "%s · JYM",
  },
  description:
    "JYM builds a personalised gym training and weight-loss plan from your goals, equipment and fitness level — then coaches you through every session.",
  applicationName: "JYM",
  keywords: [
    "gym",
    "workout plan",
    "weight loss",
    "personal trainer",
    "fitness",
    "muscle building",
    "strength training",
  ],
  authors: [{ name: "JYM" }],
  openGraph: {
    title: "JYM — Your AI Gym & Weight-Loss Coach",
    description:
      "Personalised workout plans, progress tracking and a coach in your pocket.",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f1512" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
