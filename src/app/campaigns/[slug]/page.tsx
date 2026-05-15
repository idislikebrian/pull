import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PledgeForm } from "@/components/pledge-form";
import { ProgressSummary } from "@/components/progress-summary";
import { currency } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";

type CampaignPageProps = {
  params: Promise<{ slug: string }>;
};

type CampaignVenueFields = {
  googlePlaceId: string | null;
  formattedAddress: string | null;
  latitude: number | null;
  longitude: number | null;
  neighborhood: string | null;
  countryCode: string | null;
};

export const dynamic = "force-dynamic";

function statusLabel(status: string) {
  if (status === "FUNDED") {
    return "Threshold met";
  }

  if (status === "GREENLIT") {
    return "Greenlit";
  }

  return "Signal open";
}

function venueContext(campaign: {
  neighborhood: string | null;
  city: string;
  countryCode: string | null;
}) {
  return [campaign.neighborhood, campaign.city, campaign.countryCode].filter(Boolean).join(" / ");
}

export async function generateMetadata({ params }: CampaignPageProps): Promise<Metadata> {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug }
  });

  if (!campaign) {
    return {};
  }

  return {
    title: `${campaign.title} | Pull`,
    description: `${campaign.city} is signaling demand for ${campaign.title}. Help prove this event should exist.`,
    openGraph: {
      title: `${campaign.title} | Demand signal`,
      description: `${campaign.city} is proving demand before the booking exists.`,
      images: [`/campaigns/${campaign.slug}/opengraph-image`]
    }
  };
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { slug } = await params;
  const campaign = await prisma.campaign.findUnique({
    where: { slug },
    include: { pledges: true }
  });

  if (!campaign) {
    notFound();
  }

  const campaignWithVenue = campaign as typeof campaign & CampaignVenueFields;

  return (
    <main className="page-shell campaign-detail">
      <article>
        <div className="detail-notice">
          <div className="card-topline">
            <span className="status-pill">{statusLabel(campaignWithVenue.status)}</span>
            <span className="instrument-label">Public demand ledger</span>
          </div>
          <dl className="classified-ledger">
            <div>
              <dt>Venue</dt>
              <dd>{campaignWithVenue.venueName}</dd>
            </div>
            <div>
              <dt>Place</dt>
              <dd>{venueContext(campaignWithVenue)}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>{campaignWithVenue.dateWindow}</dd>
            </div>
            <div>
              <dt>Threshold</dt>
              <dd>{currency(campaignWithVenue.fundingGoal)}</dd>
            </div>
          </dl>
        </div>
        <p className="eyebrow">{campaignWithVenue.city}</p>
        <h1>{campaignWithVenue.title}</h1>
        <p className="lede">{campaignWithVenue.description}</p>
        <ProgressSummary campaign={campaignWithVenue} />
        <section className="form-panel signal-panel">
          <h2>What this signal means</h2>
          <p className="meta">
            This is not a ticket listing. It is public proof that enough people want the night for someone to book it
            with confidence.
          </p>
          <dl className="data-list">
            <div>
              <dt>Artist</dt>
              <dd>{campaignWithVenue.artistName}</dd>
            </div>
            <div>
              <dt>Possible room</dt>
              <dd>
                {campaignWithVenue.venueName}
                {campaignWithVenue.googlePlaceId ? <span className="venue-badge">Recognized</span> : null}
              </dd>
            </div>
            {campaignWithVenue.formattedAddress ? (
              <div>
                <dt>Venue context</dt>
                <dd>{campaignWithVenue.formattedAddress}</dd>
              </div>
            ) : null}
            {campaignWithVenue.latitude != null && campaignWithVenue.longitude != null ? (
              <div>
                <dt>Coordinates</dt>
                <dd>
                  {campaignWithVenue.latitude.toFixed(4)}, {campaignWithVenue.longitude.toFixed(4)}
                </dd>
              </div>
            ) : null}
            <div>
              <dt>Market</dt>
              <dd>{venueContext(campaignWithVenue)}</dd>
            </div>
            <div>
              <dt>Date window</dt>
              <dd>{campaignWithVenue.dateWindow}</dd>
            </div>
            <div>
              <dt>Proof threshold</dt>
              <dd>{currency(campaignWithVenue.fundingGoal)}</dd>
            </div>
          </dl>
        </section>
      </article>
      <aside>
        <PledgeForm campaignId={campaignWithVenue.id} />
      </aside>
    </main>
  );
}
