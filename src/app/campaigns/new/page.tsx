import { redirect } from "next/navigation";
import { VenueAutocomplete } from "@/components/venue-autocomplete";
import { slugify } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";

function optionalFormString(formData: FormData, key: string) {
  const value = String(formData.get(key) ?? "").trim();
  return value || null;
}

async function createCampaign(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const artistName = String(formData.get("artistName") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();
  const googlePlaceId = String(formData.get("googlePlaceId") ?? "").trim();
  const formattedAddress = String(formData.get("formattedAddress") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  const city = String(formData.get("city") ?? "").trim();
  const neighborhood = optionalFormString(formData, "neighborhood");
  const countryCode = optionalFormString(formData, "countryCode");
  const dateWindow = String(formData.get("dateWindow") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fundingGoal = Math.round(Number(formData.get("fundingGoal") ?? 0) * 100);
  const deadlineValue = String(formData.get("deadline") ?? "");

  if (
    !title ||
    !artistName ||
    !venueName ||
    !googlePlaceId ||
    !formattedAddress ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    !city ||
    !dateWindow ||
    !description ||
    !deadlineValue ||
    !fundingGoal
  ) {
    throw new Error("Missing required signal fields.");
  }

  const creator = await prisma.user.upsert({
    where: { email: "organizer@pull.local" },
    update: {},
    create: {
      email: "organizer@pull.local",
      username: "organizer"
    }
  });

  const baseSlug = slugify(title);
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  const campaign = await prisma.campaign.create({
    data: {
      title,
      slug,
      artistName,
      venueName,
      googlePlaceId,
      formattedAddress,
      latitude,
      longitude,
      city,
      neighborhood,
      countryCode,
      dateWindow,
      description,
      fundingGoal,
      deadline: new Date(`${deadlineValue}T23:59:59.000Z`),
      status: "LIVE",
      creatorId: creator.id
    }
  });

  redirect(`/campaigns/${campaign.slug}`);
}

export default function NewCampaignPage() {
  return (
    <main className="page-shell proposal-page">
      <p className="eyebrow">Open a demand signal</p>
      <h1>Give the scene something to gather around.</h1>
      <p className="lede">
        Name a possible night, set the proof threshold, and let demand show itself before booking gets expensive.
      </p>
      <form action={createCampaign} className="form-panel form-grid">
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
        <button className="button" type="submit">
          Open signal
        </button>
      </form>
    </main>
  );
}
