import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

import { Providers } from "@/app/providers";
import { Notifications } from "@/components/Notifications/Notifications";

import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "ExampleHR",
  description: "Time-off management system for employees and managers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} h-full antialiased`}
  >
      <body className="min-h-full bg-zinc-100 text-zinc-950">
        <Providers>
          <div className="min-h-full">
            <nav className="border-b border-zinc-200 bg-white/95 backdrop-blur">
              <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <Link className="text-lg font-semibold tracking-tight" href="/employee">
                  ExampleHR
                </Link>

                <div className="flex items-center gap-2">
                  <Link
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                    href="/employee"
                  >
                    Employee
                  </Link>
                  <Link
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
                    href="/manager"
                  >
                    Manager
                  </Link>
                </div>
              </div>
            </nav>

            <main>{children}</main>
            <Notifications />
          </div>
        </Providers>
      </body>
    </html>
  );
}
