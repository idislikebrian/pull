import Link from "next/link";
import { campaignStats, currency, type CampaignWithPledges } from "@/lib/campaigns";

export function CampaignCard({ campaign }: { campaign: CampaignWithPledges }) {
  const stats = campaignStats(campaign);
  const segmentCount = 18;
  const filledSegments = Math.min(Math.ceil((stats.percentComplete / 100) * segmentCount), segmentCount);

  return (
    <article className="campaign-card">
      {campaign.imageUrl ? <img src={campaign.imageUrl} alt="" /> : null}
      <div className="campaign-card-body">
        <div className="card-topline">
          <span className="status-pill">{campaign.status}</span>
          <span className="instrument-label">{stats.percentComplete}%</span>
        </div>
        <h3>{campaign.title}</h3>
        <p className="meta">
          {campaign.city} / {campaign.dateWindow}
        </p>
        <div className="progress-segments compact" aria-hidden="true">
          {Array.from({ length: segmentCount }, (_, index) => (
            <span className={index < filledSegments ? "is-filled" : ""} key={index} />
          ))}
        </div>
        <p className="meta">
          {currency(stats.totalPledged)} / {currency(campaign.fundingGoal)} / {stats.supporters} supporters
        </p>
        <div className="hero-actions">
          <Link className="button secondary" href={`/campaigns/${campaign.slug}`}>
            View campaign
          </Link>
        </div>
      </div>
    </article>
  );
}
