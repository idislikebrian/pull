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
          <p className="eyebrow">Collective demand infrastructure</p>
          <h1>Prove the room before it exists.</h1>
          <p className="lede">
            Pull lets people signal demand for possible events before anyone books the room. When enough real intent
            gathers, organizers can see which scenes are ready to move.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/campaigns/new">
              Propose a night
            </Link>
            {campaigns[0] ? (
              <Link className="button secondary" href={`/campaigns/${campaigns[0].slug}`}>
                Read the signal
              </Link>
            ) : null}
          </div>
        </div>
        <div className="hero-panel">
          <span className="status-pill">Signal open</span>
          <h2>If the city wants it, the map should show it.</h2>
          <p className="meta">
            Public signals make latent demand visible before contracts, deposits, and favors enter the room.
          </p>
        </div>
      </section>

      <section>
        <p className="eyebrow">Signals forming</p>
        <h2>Possible nights gathering proof</h2>
        {campaigns.length ? (
          <div className="campaign-grid">
            {campaigns.map((campaign) => (
              <CampaignCard campaign={campaign} key={campaign.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="instrument-label">No open signals</p>
            <h3>The board is quiet.</h3>
            <p className="meta">Start with a night people already talk about, then let the city answer in public.</p>
            <Link className="button secondary" href="/campaigns/new">
              Open a signal
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
