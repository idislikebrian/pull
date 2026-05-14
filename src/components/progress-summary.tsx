import { campaignStats, currency, type CampaignWithPledges } from "@/lib/campaigns";

export function ProgressSummary({ campaign }: { campaign: CampaignWithPledges }) {
  const stats = campaignStats(campaign);
  const segmentCount = 24;
  const filledSegments = Math.min(Math.ceil((stats.percentComplete / 100) * segmentCount), segmentCount);

  return (
    <section className="progress-module" aria-label="Campaign progress">
      <div className="progress-readout">
        <span className="instrument-label">Threshold</span>
        <strong>{stats.percentComplete}%</strong>
      </div>
      <div className="progress-segments" aria-hidden="true">
        {Array.from({ length: segmentCount }, (_, index) => (
          <span className={index < filledSegments ? "is-filled" : ""} key={index} />
        ))}
      </div>
      <div className="metrics">
        <div className="metric-card">
          <strong>{currency(stats.totalPledged)}</strong>
          <span className="instrument-label">Pledged</span>
        </div>
        <div className="metric-card">
          <strong>{stats.hardPledgeCount}</strong>
          <span className="instrument-label">Hard signals</span>
        </div>
        <div className="metric-card">
          <strong>{stats.supporters}</strong>
          <span className="instrument-label">Supporters</span>
        </div>
        <div className="metric-card">
          <strong>{stats.daysRemaining}</strong>
          <span className="instrument-label">Days left</span>
        </div>
      </div>
    </section>
  );
}
