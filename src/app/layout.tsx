import type { Metadata } from "next";
import localFont from "next/font/local";
import { Work_Sans, IBM_Plex_Mono, Old_Standard_TT, EB_Garamond, Istok_Web } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";
import { ToastProvider } from "@/components/toast-provider";
import { HeartbeatPing } from "@/components/heartbeat-ping";
import { LevelUpWatcher } from "@/components/level-up-watcher";
import { GlobalShell } from "@/components/global-shell";
import { getCurrentUser } from "@/lib/current-user";
import { getRecentChatMessages, getChatModerationContext } from "@/actions/chat";
import { getOnlineCharacters } from "@/lib/online-status";
import { characterHasAnyJob } from "@/lib/character-jobs";
import { MANAGEMENT_JOBS } from "@/lib/roles";

const alloverModern = localFont({
  src: [
    { path: "./fonts/AlloverModern_Regular.otf", weight: "400", style: "normal" },
    { path: "./fonts/AlloverModern_Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-allover-modern",
  display: "swap",
});

const oldStandard = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard",
  display: "swap",
});

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-eb-garamond",
  display: "swap",
});

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
});

const istokWeb = Istok_Web({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-istok-web",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [current, chatMessages, online] = await Promise.all([
    getCurrentUser(),
    getRecentChatMessages(50),
    getOnlineCharacters(),
  ]);

  const canChat = Boolean(current?.activeCharacter);
  const canPingAll = current
    ? current.session.isAdmin ||
      (current.activeCharacter
        ? await characterHasAnyJob(current.activeCharacter.id, MANAGEMENT_JOBS)
        : false)
    : false;
  const chatModeration = current?.activeCharacter
    ? await getChatModerationContext(current.activeCharacter.id)
    : { isModerator: false, timeoutUntil: null };
  const isChatModerator = Boolean(current?.session.isAdmin) || chatModeration.isModerator;
  const initialChatMessages = chatMessages.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
  }));

  return (
    <html
      lang="en"
      className={`h-full antialiased ${alloverModern.variable} ${oldStandard.variable} ${ebGaramond.variable} ${workSans.variable} ${istokWeb.variable} ${plexMono.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <ToastProvider>
          <HeartbeatPing />
          <LevelUpWatcher />
          <NavBar />
          <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6">
            <GlobalShell
              chatProps={{
                initialMessages: initialChatMessages,
                initialOnline: online,
                canChat,
                canPingAll,
                myCharacterId: current?.activeCharacter?.id ?? null,
                myFirstName: current?.activeCharacter?.firstName ?? null,
                myLastName: current?.activeCharacter?.lastName ?? null,
                isModerator: isChatModerator,
                myTimeoutUntil: chatModeration.timeoutUntil,
              }}
            >
              {children}
            </GlobalShell>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
