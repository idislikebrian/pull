import { NextResponse } from "next/server";
import { AuthError, requireCurrentUser } from "@/lib/auth";
import { slugify } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

export async function GET() {
  const campaigns = await prisma.campaign.findMany({
    include: {
      pledges: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  return NextResponse.json({ campaigns });
}

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

  const rateLimit = checkRateLimit(`campaign:create:${user.id}`, 3, 24 * 60 * 60 * 1000);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Too many proposals. Try again later." }, { status: 429 });
  }

  const activeCampaigns = await prisma.campaign.count({
    where: {
      creatorId: user.id,
      status: {
        in: ["LIVE", "FUNDED"]
      }
    }
  });

  if (activeCampaigns >= 3) {
    return NextResponse.json({ error: "You already have 3 active proposals." }, { status: 429 });
  }

  const body = await request.json();
  const requiredFields = ["title", "artistName", "venueName", "city", "dateWindow", "description", "fundingGoal", "deadline"];

  for (const field of requiredFields) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  const hasStructuredVenue = Boolean(body.googlePlaceId);

  if (
    hasStructuredVenue &&
    (!body.formattedAddress ||
      typeof body.latitude !== "number" ||
      typeof body.longitude !== "number" ||
      !Number.isFinite(body.latitude) ||
      !Number.isFinite(body.longitude))
  ) {
    return NextResponse.json({ error: "Structured venue data is incomplete" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      title: body.title,
      slug: `${slugify(body.title)}-${Date.now().toString(36)}`,
      artistName: body.artistName,
      venueName: body.venueName,
      googlePlaceId: body.googlePlaceId ?? null,
      formattedAddress: body.formattedAddress ?? null,
      latitude: hasStructuredVenue ? body.latitude : null,
      longitude: hasStructuredVenue ? body.longitude : null,
      city: body.city,
      neighborhood: body.neighborhood ?? null,
      countryCode: body.countryCode ?? null,
      dateWindow: body.dateWindow,
      description: body.description,
      fundingGoal: Number(body.fundingGoal),
      deadline: new Date(body.deadline),
      status: "LIVE",
      imageUrl: body.imageUrl ?? null,
      creatorId: user.id
    }
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
