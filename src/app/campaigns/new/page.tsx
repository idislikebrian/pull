import { redirect } from "next/navigation";
import { slugify } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";

async function createCampaign(formData: FormData) {
  "use server";

  const title = String(formData.get("title") ?? "").trim();
  const artistName = String(formData.get("artistName") ?? "").trim();
  const venueName = String(formData.get("venueName") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const dateWindow = String(formData.get("dateWindow") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const fundingGoal = Math.round(Number(formData.get("fundingGoal") ?? 0) * 100);
  const deadlineValue = String(formData.get("deadline") ?? "");
  const imageUrl = String(formData.get("imageUrl") ?? "").trim();

  if (!title || !artistName || !venueName || !city || !dateWindow || !description || !deadlineValue || !fundingGoal) {
    throw new Error("Missing required campaign fields.");
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
      city,
      dateWindow,
      description,
      fundingGoal,
      deadline: new Date(`${deadlineValue}T23:59:59.000Z`),
      status: "LIVE",
      imageUrl: imageUrl || null,
      creatorId: creator.id
    }
  });

  redirect(`/campaigns/${campaign.slug}`);
}

export default function NewCampaignPage() {
  return (
    <main className="page-shell">
      <p className="eyebrow">Organizer proposal</p>
      <h1>Test the pull before taking the risk.</h1>
      <form action={createCampaign} className="form-panel form-grid">
        <label className="field">
          <span>Event title</span>
          <input name="title" placeholder="DJ Seinfeld @ Elsewhere Rooftop" required />
        </label>
        <label className="field">
          <span>Artist / DJ</span>
          <input name="artistName" placeholder="DJ Seinfeld" required />
        </label>
        <label className="field">
          <span>Venue target</span>
          <input name="venueName" placeholder="Elsewhere Rooftop" required />
        </label>
        <label className="field">
          <span>City</span>
          <input name="city" placeholder="Brooklyn, NY" required />
        </label>
        <label className="field">
          <span>Date window</span>
          <input name="dateWindow" placeholder="Late August 2026" required />
        </label>
        <label className="field">
          <span>Funding threshold in USD</span>
          <input min="1" name="fundingGoal" placeholder="12000" required type="number" />
        </label>
        <label className="field">
          <span>Deadline</span>
          <input name="deadline" required type="date" />
        </label>
        <label className="field">
          <span>Cover image URL</span>
          <input name="imageUrl" placeholder="https://..." type="url" />
        </label>
        <label className="field">
          <span>Description</span>
          <textarea
            name="description"
            placeholder="What would make this event special, and why should people signal demand now?"
            required
          />
        </label>
        <button className="button" type="submit">
          Launch proposal
        </button>
      </form>
    </main>
  );
}
