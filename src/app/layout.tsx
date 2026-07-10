import type { Metadata } from "next";
import localFont from "next/font/local";
import { Work_Sans, IBM_Plex_Mono, Old_Standard_TT } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { HeartbeatPing } from "@/components/heartbeat-ping";
import { LevelUpWatcher } from "@/components/level-up-watcher";

const voyage = localFont({
  src: [
    { path: "./fonts/Voyage_Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/Voyage_Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-voyage",
  display: "swap",
});

const oldStandard = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Armistead Academy",
  description: "A text-based roleplay academy: forums, lessons, and an in-world economy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${voyage.variable} ${oldStandard.variable} ${workSans.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <HeartbeatPing />
        <LevelUpWatcher />
        <NavBar />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
