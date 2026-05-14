import Link from "next/link";
import { CampaignCard } from "@/components/campaign-card";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function Home() {
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: {
        in: ["LIVE", "FUNDED", "GREENLIT"]
      }
    },
    include: {
      pledges: true
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 6
  });

  return (
    <main className="page-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Collective demand events</p>
          <h1>Pull culture into existence.</h1>
          <p className="lede">
            Pull lets fans publicly signal demand and refundable intent before a show is booked, giving organizers a
            clearer read on which rooms, cities, and lineups are actually viable.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/campaigns/new">
              Start a proposal
            </Link>
            {campaigns[0] ? (
              <Link className="button secondary" href={`/campaigns/${campaigns[0].slug}`}>
                See live demand
              </Link>
            ) : null}
          </div>
        </div>
        <div className="hero-panel">
          <span className="status-pill">MVP focus</span>
          <h2>Demand first. Logistics later.</h2>
          <p className="meta">
            The initial product only needs to prove public intent, pre-confirmation money commitment, and organizer
            usefulness. Booking, payouts, routing, and analytics can wait.
          </p>
        </div>
      </section>

      <section>
        <p className="eyebrow">Live proposals</p>
        <h2>Campaigns looking for proof</h2>
        <div className="campaign-grid">
          {campaigns.map((campaign) => (
            <CampaignCard campaign={campaign} key={campaign.id} />
          ))}
        </div>
      </section>
    </main>
  );
}
