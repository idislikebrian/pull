import { NextResponse } from "next/server";
import { AuthError, requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const hardPledgeAmounts = new Set([1000, 2000, 5000]);

export async function POST(request: Request) {
  let user;

  try {
    user = await requireCurrentUser(request);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    return NextResponse.json({ error: "Authentication failed" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(`pledge:${user.id}`, 30, 60 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, { status: 429 });
  }

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

  const existingPledge = await prisma.pledge.findUnique({
    where: {
      userId_campaignId: {
        userId: user.id,
        campaignId: campaign.id
      }
    }
  });

  let pledge;

  if (existingPledge && existingPledge.type === "HARD" && type === "SOFT") {
    pledge = existingPledge;
  } else if (existingPledge) {
    pledge = await prisma.pledge.update({
      where: { id: existingPledge.id },
      data: {
        type,
        amount,
        paymentStatus: type === "HARD" ? "AUTHORIZED" : "NOT_REQUIRED"
      }
    });
  } else {
    pledge = await prisma.pledge.create({
      data: {
        campaignId: campaign.id,
        userId: user.id,
        type,
        amount,
        paymentStatus: type === "HARD" ? "AUTHORIZED" : "NOT_REQUIRED"
      }
    });
  }

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

  return NextResponse.json({ pledge }, { status: existingPledge ? 200 : 201 });
}
