import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Health Check System",
  description: "Monitor your endpoints health status",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
