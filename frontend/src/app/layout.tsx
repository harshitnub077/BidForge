import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";
import Cursor from "@/components/layout/Cursor";
import Preloader from "@/components/layout/Preloader";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BidForge — Enterprise RFP & Proposal Intelligence",
  description: "Institutional proposal generation platform. Ingest RFPs, calibrate commercial and strategic matrices, and synthesize boardroom-ready deliverables.",
  icons: {
    icon: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${plusJakartaSans.variable} ${jetbrainsMono.variable} h-full antialiased dark`}>
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#f4f4f5] font-sans selection:bg-zinc-800 selection:text-white">
        <Preloader />
        <Cursor />
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}


