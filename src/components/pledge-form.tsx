"use client";

import { useState, useTransition } from "react";

type PledgeChoice = "SOFT" | "1000" | "2000" | "5000";

export function PledgeForm({ campaignId }: { campaignId: string }) {
  const [choice, setChoice] = useState<PledgeChoice>("SOFT");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitPledge() {
    setMessage("");

    startTransition(async () => {
      const response = await fetch("/api/pledges", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          campaignId,
          type: choice === "SOFT" ? "SOFT" : "HARD",
          amount: choice === "SOFT" ? 0 : Number(choice)
        })
      });

      if (!response.ok) {
        setMessage("Something slipped. Try again in a moment.");
        return;
      }

      setMessage(choice === "SOFT" ? "Soft pledge logged." : "Hard pledge reserved for Stripe authorization.");
    });
  }

  return (
    <div className="pledge-panel">
      <p className="instrument-label">Pledge console</p>
      <h2>Signal demand</h2>
      <p className="meta">Soft pledges show social intent. Hard pledges are the higher-quality booking signal.</p>
      <div className="pledge-control">
        <label className="pledge-option">
          <input checked={choice === "SOFT"} name="pledge" onChange={() => setChoice("SOFT")} type="radio" />
          <span>Attend</span>
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
      <button className="button" disabled={isPending} onClick={submitPledge} type="button">
        {isPending ? "[PLEDGING]" : "Pledge support"}
      </button>
      {message ? <p className="pledge-message">[{message}]</p> : null}
    </div>
  );
}
