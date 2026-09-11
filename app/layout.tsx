import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CUET Preparation",
  description: "Official-syllabus coverage and mastery tracker for CUET 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
