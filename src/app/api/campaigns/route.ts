import { NextResponse } from "next/server";
import { slugify } from "@/lib/campaigns";
import { prisma } from "@/lib/prisma";

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

  const creator = await prisma.user.upsert({
    where: { email: body.creatorEmail ?? "organizer@pull.local" },
    update: {},
    create: {
      email: body.creatorEmail ?? "organizer@pull.local",
      username: body.creatorUsername ?? "organizer"
    }
  });

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
      creatorId: creator.id
    }
  });

  return NextResponse.json({ campaign }, { status: 201 });
}
