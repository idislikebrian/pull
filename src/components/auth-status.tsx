"use client";

import { usePrivy } from "@privy-io/react-auth";

export function AuthStatus() {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
  const { authenticated, login, logout, ready, user } = usePrivy();

  if (!appId || !ready) {
    return null;
  }

  if (!authenticated) {
    return (
      <button className="nav-auth-button" onClick={() => login({ loginMethods: ["sms", "email"] })} type="button">
        Verify
      </button>
    );
  }

  const label = user?.phone?.number ? "Verified" : user?.email?.address ?? "Verified";

  return (
    <button className="nav-auth-button secondary" onClick={() => void logout()} title="Log out" type="button">
      {label}
    </button>
  );
}
