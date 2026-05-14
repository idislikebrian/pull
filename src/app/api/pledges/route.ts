import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const hardPledgeAmounts = new Set([1000, 2000, 5000]);

export async function POST(request: Request) {
  const body = await request.json();
  const type = body.type === "HARD" ? "HARD" : "SOFT";
  const amount = type === "HARD" ? Number(body.amount) : 0;

  if (!body.campaignId) {
    return NextResponse.json({ error: "campaignId is required" }, { status: 400 });
  }

  if (type === "HARD" && !hardPledgeAmounts.has(amount)) {
    return NextResponse.json({ error: "Unsupported hard pledge amount" }, { status: 400 });
  }

  const campaign = await prisma.campaign.findUnique({
    where: { id: body.campaignId }
  });

  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
  }

  const user = await prisma.user.upsert({
    where: { email: body.email ?? "fan@pull.local" },
    update: {},
    create: {
      email: body.email ?? "fan@pull.local",
      username: body.username ?? "fan"
    }
  });

  const pledge = await prisma.pledge.create({
    data: {
      campaignId: campaign.id,
      userId: user.id,
      type,
      amount,
      paymentStatus: type === "HARD" ? "AUTHORIZED" : "NOT_REQUIRED"
    }
  });

  const hardPledgeTotal = await prisma.pledge.aggregate({
    where: {
      campaignId: campaign.id,
      type: "HARD"
    },
    _sum: {
      amount: true
    }
  });

  if ((hardPledgeTotal._sum.amount ?? 0) >= campaign.fundingGoal && campaign.status === "LIVE") {
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: "FUNDED" }
    });
  }

  return NextResponse.json({ pledge }, { status: 201 });
}
