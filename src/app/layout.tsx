import type { Metadata } from "next";
import "./globals.css";
import { NavBar } from "@/components/nav-bar";

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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <NavBar />
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6">{children}</main>
      </body>
    </html>
  );
}
