import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "LuminaCRM — AI-driven sales CRM",
  description:
    "Transcribe sales calls with Whisper and auto-extract action items with AI.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <DemoBanner />
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
      </body>
    </html>
  );
}
