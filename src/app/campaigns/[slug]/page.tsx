import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PledgeForm } from "@/components/pledge-form";
import { ProgressSummary } from "@/components/progress-summary";
import { currency } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";

type CampaignPageProps = {
  params: Promise<{ slug: string }>;
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

  return (
    <main className="page-shell campaign-detail">
      <article>
        <div className="detail-notice">
          <div className="card-topline">
            <span className="status-pill">{statusLabel(campaign.status)}</span>
            <span className="instrument-label">Public demand ledger</span>
          </div>
          <dl className="classified-ledger">
            <div>
              <dt>City</dt>
              <dd>{campaign.city}</dd>
            </div>
            <div>
              <dt>Window</dt>
              <dd>{campaign.dateWindow}</dd>
            </div>
            <div>
              <dt>Threshold</dt>
              <dd>{currency(campaign.fundingGoal)}</dd>
            </div>
          </dl>
        </div>
        <p className="eyebrow">{campaign.city}</p>
        <h1>{campaign.title}</h1>
        <p className="lede">{campaign.description}</p>
        <ProgressSummary campaign={campaign} />
        <section className="form-panel signal-panel">
          <h2>What this signal means</h2>
          <p className="meta">
            This is not a ticket listing. It is public proof that enough people want the night for someone to book it
            with confidence.
          </p>
          <dl className="data-list">
            <div>
              <dt>Artist</dt>
              <dd>{campaign.artistName}</dd>
            </div>
            <div>
              <dt>Possible room</dt>
              <dd>{campaign.venueName}</dd>
            </div>
            <div>
              <dt>Date window</dt>
              <dd>{campaign.dateWindow}</dd>
            </div>
            <div>
              <dt>Proof threshold</dt>
              <dd>{currency(campaign.fundingGoal)}</dd>
            </div>
          </dl>
        </section>
      </article>
      <aside>
        <PledgeForm campaignId={campaign.id} />
      </aside>
    </main>
  );
}
