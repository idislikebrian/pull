import type { Campaign, Pledge } from "@prisma/client";

export type CampaignWithPledges = Campaign & {
  pledges: Pledge[];
};

export function campaignStats(campaign: CampaignWithPledges) {
  const hardPledges = campaign.pledges.filter((pledge) => pledge.type === "HARD");
  const totalPledged = hardPledges.reduce((sum, pledge) => sum + pledge.amount, 0);
  const supporters = new Set(campaign.pledges.map((pledge) => pledge.userId)).size;
  const percentComplete =
    campaign.fundingGoal > 0 ? Math.min(Math.round((totalPledged / campaign.fundingGoal) * 100), 100) : 0;
  const timeRemainingMs = campaign.deadline.getTime() - Date.now();
  const daysRemaining = Math.max(Math.ceil(timeRemainingMs / 86_400_000), 0);

  return {
    totalPledged,
    supporters,
    percentComplete,
    daysRemaining,
    hardPledgeCount: hardPledges.length,
    softPledgeCount: campaign.pledges.length - hardPledges.length
  };
}

export function currency(cents: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(cents / 100);
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
