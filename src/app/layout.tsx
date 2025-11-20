import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/ui/Navbar";
import { I18nProvider } from "@/lib/i18n/context";
import { NotificationProvider } from "@/lib/notifications/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Beacon - Lost & Found",
  description: "A hyper-local, map-based marketplace for recovering lost items.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <I18nProvider>
          <NotificationProvider>
            <Navbar />
            <main className="flex-1">
              {children}
            </main>
          </NotificationProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
