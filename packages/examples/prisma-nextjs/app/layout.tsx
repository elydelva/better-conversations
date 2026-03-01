import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Better Conversation - Prisma + Next.js",
  description: "Example with Prisma Postgres and Next.js",
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
