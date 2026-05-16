import { CampaignProposalForm } from "@/components/campaign-proposal-form";

export default function NewCampaignPage() {
  return (
    <main className="page-shell proposal-page">
      <p className="eyebrow">Open a demand signal</p>
      <h1>Give the scene something to gather around.</h1>
      <p className="lede">
        Name a possible night, set the proof threshold, and let demand show itself before booking gets expensive.
      </p>
      <CampaignProposalForm />
    </main>
  );
}
