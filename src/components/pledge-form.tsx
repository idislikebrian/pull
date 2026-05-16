"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useState, useTransition } from "react";

type PledgeChoice = "SOFT" | "1000" | "2000" | "5000";

export function PledgeForm({ campaignId }: { campaignId: string }) {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return <PledgeFormUnavailable />;
  }

  return <AuthenticatedPledgeForm campaignId={campaignId} />;
}

function PledgeFormUnavailable() {
  return (
    <div className="pledge-panel">
      <p className="instrument-label">Demand console</p>
      <h2>Help make this real</h2>
      <p className="meta">
        Signals require authentication. Add Privy environment variables to enable phone or email verification.
      </p>
      <button className="button" disabled type="button">
        Verification offline
      </button>
      <p className="trust-note">Browsing stays open. Participation needs a durable pseudonymous identity.</p>
    </div>
  );
}

function AuthenticatedPledgeForm({ campaignId }: { campaignId: string }) {
  const { authenticated, getAccessToken, login, ready } = usePrivy();
  const [choice, setChoice] = useState<PledgeChoice>("SOFT");
  const [message, setMessage] = useState("");
  const [pendingChoice, setPendingChoice] = useState<PledgeChoice | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitPledge(selectedChoice = choice) {
    setMessage("");

    startTransition(async () => {
      const accessToken = await getAccessToken();

      if (!accessToken) {
        setPendingChoice(selectedChoice);
        setMessage("Verify once so the signal counts. Use phone or email; signals stay pseudonymous by default.");
        login({ loginMethods: ["sms", "email"] });
        return;
      }

      const response = await fetch("/api/pledges", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          campaignId,
          type: selectedChoice === "SOFT" ? "SOFT" : "HARD",
          amount: selectedChoice === "SOFT" ? 0 : Number(selectedChoice)
        })
      });

      if (!response.ok) {
        const result = (await response.json().catch(() => null)) as { error?: string } | null;
        setMessage(result?.error ?? "Something slipped. Try again in a moment.");
        return;
      }

      setMessage(
        selectedChoice === "SOFT" ? "Signal received. You are counted in." : "Commitment received. Momentum updated."
      );
    });
  }

  useEffect(() => {
    if (!ready || !authenticated || !pendingChoice) {
      return;
    }

    const selectedChoice = pendingChoice;
    setPendingChoice(null);
    submitPledge(selectedChoice);
  }, [authenticated, pendingChoice, ready]);

  return (
    <div className="pledge-panel">
      <p className="instrument-label">Demand console</p>
      <h2>Help make this real</h2>
      <p className="meta">
        A soft signal says you would go. A paid signal gives organizers the proof they need to move.
      </p>
      <div className="pledge-control">
        <label className="pledge-option">
          <input checked={choice === "SOFT"} name="pledge" onChange={() => setChoice("SOFT")} type="radio" />
          <span>I'm in</span>
        </label>
        <label className="pledge-option">
          <input checked={choice === "1000"} name="pledge" onChange={() => setChoice("1000")} type="radio" />
          <span>$10</span>
        </label>
        <label className="pledge-option">
          <input checked={choice === "2000"} name="pledge" onChange={() => setChoice("2000")} type="radio" />
          <span>$20</span>
        </label>
        <label className="pledge-option">
          <input checked={choice === "5000"} name="pledge" onChange={() => setChoice("5000")} type="radio" />
          <span>$50</span>
        </label>
      </div>
      <button className="button" disabled={isPending} onClick={() => submitPledge()} type="button">
        {isPending ? "Sending signal" : "Signal demand"}
      </button>
      <p className="trust-note">No ticket exists yet. This is demand becoming legible.</p>
      {message ? <p className="pledge-message">[{message}]</p> : null}
    </div>
  );
}
