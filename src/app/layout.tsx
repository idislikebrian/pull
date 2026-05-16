import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/components/auth-provider";
import { AuthStatus } from "@/components/auth-status";
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
  const showAuth = Boolean(process.env.NEXT_PUBLIC_PRIVY_APP_ID);

  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="site-header">
            <Link className="brand" href="/">
              PULL
            </Link>
            <nav aria-label="Primary navigation">
              <Link href="/campaigns/new">Propose a night</Link>
              {showAuth ? <AuthStatus /> : null}
            </nav>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
