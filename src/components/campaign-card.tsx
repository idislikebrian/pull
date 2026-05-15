import Link from "next/link";
import { campaignStats, currency, type CampaignWithPledges } from "@/lib/campaigns";

function statusLabel(status: CampaignWithPledges["status"]) {
  if (status === "FUNDED") {
    return "Threshold met";
  }

  if (status === "GREENLIT") {
    return "Greenlit";
  }

  return "Signal open";
}

export function CampaignCard({ campaign }: { campaign: CampaignWithPledges }) {
  const stats = campaignStats(campaign);
  const segmentCount = 18;
  const filledSegments = Math.min(Math.ceil((stats.percentComplete / 100) * segmentCount), segmentCount);

  return (
    <article className="campaign-card">
      <div className="campaign-card-body">
        <div className="card-topline">
          <span className="status-pill">{statusLabel(campaign.status)}</span>
          <span className="instrument-label">{stats.percentComplete}% to threshold</span>
        </div>
        <p className="classified-kicker">Demand signal</p>
        <h3>{campaign.title}</h3>
        <dl className="classified-ledger">
          <div>
            <dt>Venue</dt>
            <dd>{campaign.venueName}</dd>
          </div>
          <div>
            <dt>City</dt>
            <dd>{[campaign.neighborhood, campaign.city].filter(Boolean).join(" / ")}</dd>
          </div>
          <div>
            <dt>Window</dt>
            <dd>{campaign.dateWindow}</dd>
          </div>
        </dl>
        <div className="progress-segments compact" aria-hidden="true">
          {Array.from({ length: segmentCount }, (_, index) => (
            <span className={index < filledSegments ? "is-filled" : ""} key={index} />
          ))}
        </div>
        <p className="classified-total">
          {currency(stats.totalPledged)} signaled / {currency(campaign.fundingGoal)} threshold / {stats.supporters} in
        </p>
        <div className="hero-actions">
          <Link className="button secondary" href={`/campaigns/${campaign.slug}`}>
            Read signal
          </Link>
        </div>
      </div>
    </article>
  );
}
