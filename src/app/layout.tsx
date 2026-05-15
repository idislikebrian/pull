import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Pull",
  description: "People proving demand for events before they exist."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            PULL
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/campaigns/new">Propose a night</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
