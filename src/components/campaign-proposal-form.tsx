"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState, useTransition } from "react";
import { VenueAutocomplete } from "@/components/venue-autocomplete";

type CampaignPayload = {
  title: string;
  artistName: string;
  venueName: string;
  googlePlaceId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  neighborhood: string | null;
  countryCode: string | null;
  dateWindow: string;
  description: string;
  fundingGoal: number;
  deadline: string;
};

function optionalString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

function payloadFromForm(form: HTMLFormElement): CampaignPayload {
  const formData = new FormData(form);
  const deadlineValue = String(formData.get("deadline") ?? "");

  return {
    title: String(formData.get("title") ?? "").trim(),
    artistName: String(formData.get("artistName") ?? "").trim(),
    venueName: String(formData.get("venueName") ?? "").trim(),
    googlePlaceId: String(formData.get("googlePlaceId") ?? "").trim(),
    formattedAddress: String(formData.get("formattedAddress") ?? "").trim(),
    latitude: Number(formData.get("latitude")),
    longitude: Number(formData.get("longitude")),
    city: String(formData.get("city") ?? "").trim(),
    neighborhood: optionalString(formData, "neighborhood"),
    countryCode: optionalString(formData, "countryCode"),
    dateWindow: String(formData.get("dateWindow") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    fundingGoal: Math.round(Number(formData.get("fundingGoal") ?? 0) * 100),
    deadline: deadlineValue ? `${deadlineValue}T23:59:59.000Z` : ""
  };
}

export function CampaignProposalForm() {
  if (!process.env.NEXT_PUBLIC_PRIVY_APP_ID) {
    return <CampaignProposalUnavailable />;
  }

  return <AuthenticatedCampaignProposalForm />;
}

function CampaignProposalUnavailable() {
  return (
    <div className="form-panel form-grid">
      <p className="meta">
        Proposal creation requires authentication. Add Privy environment variables to enable phone or email verification.
      </p>
      <button className="button" disabled type="button">
        Verification offline
      </button>
    </div>
  );
}

function AuthenticatedCampaignProposalForm() {
  const router = useRouter();
  const { authenticated, getAccessToken, login, ready } = usePrivy();
  const [message, setMessage] = useState("");
  const [pendingPayload, setPendingPayload] = useState<CampaignPayload | null>(null);
  const [isPending, startTransition] = useTransition();

  const submitPayload = useCallback(
    (payload: CampaignPayload) => {
      setMessage("");

      startTransition(async () => {
        const accessToken = await getAccessToken();

        if (!accessToken) {
          setPendingPayload(payload);
          setMessage("Verify once so the signal counts. Use phone or email; proposals stay pseudonymous by default.");
          login({ loginMethods: ["sms", "email"] });
          return;
        }

        const response = await fetch("/api/campaigns", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });

        const result = (await response.json()) as { campaign?: { slug: string }; error?: string };

        if (!response.ok || !result.campaign) {
          setMessage(result.error ?? "Something slipped. Try again in a moment.");
          return;
        }

        setMessage("Signal opened.");
        router.push(`/campaigns/${result.campaign.slug}`);
      });
    },
    [getAccessToken, login, router]
  );

  useEffect(() => {
    if (!ready || !authenticated || !pendingPayload) {
      return;
    }

    const payload = pendingPayload;
    setPendingPayload(null);
    submitPayload(payload);
  }, [authenticated, pendingPayload, ready, submitPayload]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    submitPayload(payloadFromForm(event.currentTarget));
  }

  return (
    <form className="form-panel form-grid" onSubmit={submit}>
      <label className="field">
        <span>Signal title</span>
        <input name="title" placeholder="DJ Seinfeld @ Elsewhere Rooftop" required />
        <small>Write it like something people can recognize and repeat.</small>
      </label>
      <label className="field">
        <span>Artist / DJ</span>
        <input name="artistName" placeholder="DJ Seinfeld" required />
      </label>
      <VenueAutocomplete />
      <label className="field">
        <span>Date window</span>
        <input name="dateWindow" placeholder="Late August 2026" required />
      </label>
      <label className="field">
        <span>Proof threshold in USD</span>
        <input min="1" name="fundingGoal" placeholder="12000" required type="number" />
        <small>The hard-signal total that makes the booking feel viable.</small>
      </label>
      <label className="field">
        <span>Deadline</span>
        <input name="deadline" required type="date" />
      </label>
      <label className="field">
        <span>Why it should exist</span>
        <textarea
          name="description"
          placeholder="What is the cultural argument for this night, and why would this city show up?"
          required
        />
      </label>
      <button className="button" disabled={isPending} type="submit">
        {isPending ? "Opening signal" : "Open signal"}
      </button>
      {message ? <p className="pledge-message">[{message}]</p> : null}
    </form>
  );
}
