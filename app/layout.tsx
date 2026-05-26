import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlightTracker",
  description: "Track flight prices and get price predictions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="text-lg font-bold text-indigo-600 tracking-tight">
              ✈ FlightTracker
            </Link>
            <Link
              href="/add"
              className="px-4 py-1.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              + Track flight
            </Link>
          </div>
        </header>
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
        <footer className="text-center text-xs text-slate-400 py-6 border-t border-slate-100">
          Prices checked twice daily via Google Flights & Kiwi
        </footer>
      </body>
    </html>
  );
}
