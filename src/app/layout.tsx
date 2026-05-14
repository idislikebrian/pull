import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const spaceGrotesk = Space_Grotesk({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "Pull",
  description: "Collective demand events before they exist."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", spaceGrotesk.variable)}>
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            PULL
          </Link>
          <nav aria-label="Primary navigation">
            <Link href="/campaigns/new">Create proposal</Link>
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
