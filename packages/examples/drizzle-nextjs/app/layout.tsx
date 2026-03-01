import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Conversation - Drizzle + Next.js",
  description: "Minimal chat example with Drizzle SQLite and Next.js",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
