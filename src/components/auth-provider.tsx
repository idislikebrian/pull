"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { type ReactNode } from "react";

export function AuthProvider({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

  if (!appId) {
    return children;
  }

  return (
    <PrivyProvider
      appId={appId}
      config={{
        appearance: {
          accentColor: "#d71921",
          landingHeader: "Verify so the signal counts",
          loginMessage: "Use phone or email. Signals stay pseudonymous by default.",
          showWalletLoginFirst: false,
          theme: "dark"
        },
        loginMethodsAndOrder: {
          primary: ["sms", "email"],
          overflow: []
        }
      }}
    >
      {children}
    </PrivyProvider>
  );
}
