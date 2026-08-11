import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Order Supervisor Console",
  description:
    "AI workflow observability and control surface for the Order Supervisor POC — built on Temporal, FastAPI, and OpenAI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-zinc-950 text-zinc-100 min-h-screen">
        <div className="flex">
          <Sidebar />
          <main className="ml-56 flex-1 min-h-screen flex flex-col">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
