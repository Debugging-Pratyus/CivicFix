import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CivicFix — Municipal Complaint Management",
  description: "AI-assisted platform for reporting and tracking civic issues",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">{children}</body>
    </html>
  );
}
