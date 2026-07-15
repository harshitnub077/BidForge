import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import DashboardLayout from "@/components/DashboardLayout";

const interSans = Inter({
  variable: "--font-inter-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BidForge | AI Proposal Intelligence",
  description: "Enterprise-grade RFP automation and proposal generation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${interSans.variable} ${jetbrainsMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-zinc-950 selection:bg-black/10">
        <DashboardLayout>
          {children}
        </DashboardLayout>
      </body>
    </html>
  );
}
