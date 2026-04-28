import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/app/providers";
import { AppNav } from "@/components/AppNav/AppNav";
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
            <AppNav />
            <main>{children}</main>
            <Notifications />
          </div>
        </Providers>
      </body>
    </html>
  );
}
