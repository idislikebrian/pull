import "dotenv/config";
import { PrismaClient, CampaignStatus, PaymentStatus, PledgeType } from "@prisma/client";

const prisma = new PrismaClient();

type CampaignSeed = {
  title: string;
  artistName: string;
  venueName: string;
  city: string;
  dateWindow: string;
  description: string;
  fundingGoal: number;
  fundingPercent: number;
  hardSupporters: number;
  softSupporters: number;
  deadline: string;
  imageUrl: string;
};

const imagePool = [
  "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?auto=format&fit=crop&w=1600&q=80",
  "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=1600&q=80"
];

const campaigns: CampaignSeed[] = [
  {
    title: "Arca all-night-long at Knockdown Center",
    artistName: "Arca",
    venueName: "Knockdown Center",
    city: "Queens, NY",
    dateWindow: "Fall 2026",
    description:
      "Not a concert. A full environmental takeover: ambient opening rooms, industrial reggaeton transitions, opera fragments, body-horror visuals, and a 5am emotional collapse. If the internet had a nervous breakdown and learned ballroom simultaneously.",
    fundingGoal: 95_000_00,
    fundingPercent: 0.74,
    hardSupporters: 188,
    softSupporters: 346,
    deadline: "2026-09-25",
    imageUrl: imagePool[0]
  },
  {
    title: "DJ Python sunrise set at Nowadays",
    artistName: "DJ Python",
    venueName: "Nowadays",
    city: "Ridgewood, NY",
    dateWindow: "Late August 2026",
    description:
      "Deep reggaeton-adjacent ambient house at sunrise in the outdoor area after 8 hours of dancing. Spiritually aligned with NYC right now: art kids, ex-ravers, fashion people pretending they are not emotional, and actual heads.",
    fundingGoal: 28_000_00,
    fundingPercent: 0.88,
    hardSupporters: 126,
    softSupporters: 211,
    deadline: "2026-07-31",
    imageUrl: imagePool[1]
  },
  {
    title: "Autechre at H0L0",
    artistName: "Autechre",
    venueName: "H0L0",
    city: "Ridgewood, NY",
    dateWindow: "October 2026",
    description:
      "No visuals. Almost no lighting. Pure sound design violence. H0L0's architecture is perfect because the room already feels subterranean and psychologically unstable.",
    fundingGoal: 42_000_00,
    fundingPercent: 0.37,
    hardSupporters: 82,
    softSupporters: 154,
    deadline: "2026-08-30",
    imageUrl: imagePool[2]
  },
  {
    title: "Isabella Lovestory warehouse rave in Bushwick",
    artistName: "Isabella Lovestory",
    venueName: "Bushwick warehouse",
    city: "Brooklyn, NY",
    dateWindow: "September 2026",
    description:
      "Co-hosted with Latin club DJs, perreo collectives, industrial techno openers, and chaotic Y2K visual design. If reggaeton rave culture stopped apologizing for itself.",
    fundingGoal: 36_000_00,
    fundingPercent: 0.52,
    hardSupporters: 97,
    softSupporters: 268,
    deadline: "2026-08-15",
    imageUrl: imagePool[3]
  },
  {
    title: "Burial secret set announced 2 hours before doors",
    artistName: "Burial",
    venueName: "Secret Morgan Ave room",
    city: "Brooklyn, NY",
    dateWindow: "Unannounced night, 2026",
    description:
      "No phones. No lineup poster. Text blast only. Some illegal-feeling industrial room off Morgan Ave. The myth matters as much as the music.",
    fundingGoal: 50_000_00,
    fundingPercent: 1.08,
    hardSupporters: 203,
    softSupporters: 488,
    deadline: "2026-06-30",
    imageUrl: imagePool[4]
  },
  {
    title: "Fred again.. B2B Joy Orbison at Public Records",
    artistName: "Fred again.. B2B Joy Orbison",
    venueName: "Public Records",
    city: "Brooklyn, NY",
    dateWindow: "Winter 2026",
    description:
      "Not arena emotionalism. Smaller room. More UKG and dub pressure. Less content creation. A night that could genuinely reset public perception of Fred in NYC.",
    fundingGoal: 70_000_00,
    fundingPercent: 0.63,
    hardSupporters: 151,
    softSupporters: 390,
    deadline: "2026-10-12",
    imageUrl: imagePool[0]
  },
  {
    title: "Ecco2k + Yves Tumor + Snow Strippers at Elsewhere",
    artistName: "Ecco2k, Yves Tumor, Snow Strippers",
    venueName: "Elsewhere",
    city: "Brooklyn, NY",
    dateWindow: "November 2026",
    description:
      "Post-internet NYC distilled into one night: beautiful people, terrifying people, cyber-goth fashion, nicotine, emotional dissociation, flash photography, and hard trance edits.",
    fundingGoal: 62_000_00,
    fundingPercent: 0.41,
    hardSupporters: 112,
    softSupporters: 307,
    deadline: "2026-09-10",
    imageUrl: imagePool[1]
  },
  {
    title: "Four Tet curated internet recovery festival",
    artistName: "Four Tet",
    venueName: "Knockdown Center",
    city: "Queens, NY",
    dateWindow: "Summer 2027",
    description:
      "Floating Points, Joy Orbison, aya, Overmono, Djrum, an obscure folk act at 4pm, an ambient room, and no brand activations. Anti-festival burnout programming.",
    fundingGoal: 140_000_00,
    fundingPercent: 0.29,
    hardSupporters: 134,
    softSupporters: 522,
    deadline: "2026-11-15",
    imageUrl: imagePool[2]
  },
  {
    title: "Richie Hawtin minimalism in a stripped Mirage reboot",
    artistName: "Richie Hawtin",
    venueName: "Future Brooklyn Mirage",
    city: "Brooklyn, NY",
    dateWindow: "Spring 2027",
    description:
      "The most radical post-rebuild Mirage move: less spectacle. No giant LED overload. No Vegas energy. Just immaculate sound, restrained visuals, long transitions, and trust in the crowd.",
    fundingGoal: 110_000_00,
    fundingPercent: 0.18,
    hardSupporters: 73,
    softSupporters: 189,
    deadline: "2026-12-01",
    imageUrl: imagePool[3]
  },
  {
    title: "Lena Willikens at H0L0",
    artistName: "Lena Willikens",
    venueName: "H0L0",
    city: "Ridgewood, NY",
    dateWindow: "August 2026",
    description: "A deep, strange, late-night room for dancers who like their rhythm systems bent out of shape.",
    fundingGoal: 18_000_00,
    fundingPercent: 0.57,
    hardSupporters: 54,
    softSupporters: 92,
    deadline: "2026-07-22",
    imageUrl: imagePool[4]
  },
  {
    title: "Skee Mask at Nowadays",
    artistName: "Skee Mask",
    venueName: "Nowadays",
    city: "Ridgewood, NY",
    dateWindow: "September 2026",
    description: "Breaks, pressure, and open-air oxygen for people who still believe a long DJ set can rewire a weekend.",
    fundingGoal: 24_000_00,
    fundingPercent: 0.96,
    hardSupporters: 101,
    softSupporters: 166,
    deadline: "2026-07-28",
    imageUrl: imagePool[0]
  },
  {
    title: "Avalon Emerson extended set at Public Records",
    artistName: "Avalon Emerson",
    venueName: "Public Records",
    city: "Brooklyn, NY",
    dateWindow: "October 2026",
    description: "A patient extended set built for melody, pressure, and a room that wants to stay locked in.",
    fundingGoal: 26_000_00,
    fundingPercent: 0.66,
    hardSupporters: 76,
    softSupporters: 138,
    deadline: "2026-08-18",
    imageUrl: imagePool[1]
  },
  {
    title: "Objekt at Bossa",
    artistName: "Objekt",
    venueName: "Bossa Nova Civic Club",
    city: "Brooklyn, NY",
    dateWindow: "July 2026",
    description: "A small-room pressure test: precision drums, odd angles, no wasted motion.",
    fundingGoal: 12_000_00,
    fundingPercent: 1.22,
    hardSupporters: 65,
    softSupporters: 88,
    deadline: "2026-06-12",
    imageUrl: imagePool[2]
  },
  {
    title: "VTSS at Elsewhere",
    artistName: "VTSS",
    venueName: "Elsewhere",
    city: "Brooklyn, NY",
    dateWindow: "August 2026",
    description: "Fast, glossy, aggressive, and fun in a way that makes the room feel slightly dangerous.",
    fundingGoal: 30_000_00,
    fundingPercent: 0.43,
    hardSupporters: 59,
    softSupporters: 132,
    deadline: "2026-07-19",
    imageUrl: imagePool[3]
  },
  {
    title: "DJ Gigola warehouse set in Bushwick",
    artistName: "DJ Gigola",
    venueName: "Bushwick warehouse",
    city: "Brooklyn, NY",
    dateWindow: "September 2026",
    description: "Warehouse-speed euphoria with no attempt to sand down the edges.",
    fundingGoal: 22_000_00,
    fundingPercent: 0.31,
    hardSupporters: 42,
    softSupporters: 103,
    deadline: "2026-08-09",
    imageUrl: imagePool[4]
  },
  {
    title: "Two Shell secret-location rave",
    artistName: "Two Shell",
    venueName: "Secret location",
    city: "Brooklyn, NY",
    dateWindow: "Text blast only, 2026",
    description: "A secret-location rave built for mystery, speed, and plausible deniability.",
    fundingGoal: 45_000_00,
    fundingPercent: 0.84,
    hardSupporters: 118,
    softSupporters: 241,
    deadline: "2026-08-22",
    imageUrl: imagePool[0]
  },
  {
    title: "Nia Archives jungle rooftop party at Superior Ingredients",
    artistName: "Nia Archives",
    venueName: "Superior Ingredients",
    city: "Brooklyn, NY",
    dateWindow: "Late summer 2026",
    description: "A jungle rooftop party that should start golden-hour pretty and end much faster than anyone expected.",
    fundingGoal: 34_000_00,
    fundingPercent: 0.79,
    hardSupporters: 109,
    softSupporters: 220,
    deadline: "2026-07-26",
    imageUrl: imagePool[1]
  },
  {
    title: "The Blessed Madonna vinyl-only disco marathon",
    artistName: "The Blessed Madonna",
    venueName: "Public Records",
    city: "Brooklyn, NY",
    dateWindow: "December 2026",
    description: "A vinyl-only disco marathon for people who want generosity, stamina, and actual songs.",
    fundingGoal: 32_000_00,
    fundingPercent: 0.24,
    hardSupporters: 39,
    softSupporters: 145,
    deadline: "2026-10-20",
    imageUrl: imagePool[2]
  },
  {
    title: "Gesaffelstein in a stripped industrial room",
    artistName: "Gesaffelstein",
    venueName: "Industrial room TBA",
    city: "Brooklyn, NY",
    dateWindow: "Winter 2026",
    description: "Almost no lighting. No arena gloss. Just black-on-black tension in a room that can take it.",
    fundingGoal: 75_000_00,
    fundingPercent: 0.69,
    hardSupporters: 144,
    softSupporters: 260,
    deadline: "2026-10-01",
    imageUrl: imagePool[3]
  }
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function campaignStatus(seed: CampaignSeed) {
  if (seed.fundingPercent >= 1.15) {
    return CampaignStatus.GREENLIT;
  }

  if (seed.fundingPercent >= 1) {
    return CampaignStatus.FUNDED;
  }

  return CampaignStatus.LIVE;
}

function pledgeAmounts(total: number, count: number) {
  if (count <= 0) {
    return [];
  }

  const base = Math.max(Math.round(total / count / 100) * 100, 1_000);
  const amounts = Array.from({ length: count }, () => base);
  const diff = total - base * count;
  amounts[0] += diff;
  return amounts;
}

async function main() {
  const organizer = await prisma.user.upsert({
    where: { email: "maya@pull.local" },
    update: {},
    create: {
      email: "maya@pull.local",
      handle: "maya",
      avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80"
    }
  });

  await prisma.campaign.deleteMany({
    where: {
      slug: "dj-seinfeld-elsewhere-rooftop"
    }
  });

  const supporterSeeds = Array.from({ length: 7_000 }, (_, index) => {
      const number = (index + 1).toString().padStart(4, "0");

      return {
        email: `fan${number}@pull.local`,
        handle: `fan${number}`,
        isLegacyPlaceholder: true
      };
    });

  await prisma.user.createMany({
    data: supporterSeeds,
    skipDuplicates: true
  });

  const supporters = await prisma.user.findMany({
    where: {
      email: {
        in: supporterSeeds.map((supporter) => supporter.email)
      }
    },
    orderBy: {
      handle: "asc"
    }
  });

  let supporterCursor = 0;

  for (const seed of campaigns) {
    const campaign = await prisma.campaign.upsert({
      where: { slug: slugify(seed.title) },
      update: {
        title: seed.title,
        artistName: seed.artistName,
        venueName: seed.venueName,
        city: seed.city,
        dateWindow: seed.dateWindow,
        description: seed.description,
        fundingGoal: seed.fundingGoal,
        deadline: new Date(`${seed.deadline}T23:59:59.000Z`),
        status: campaignStatus(seed),
        imageUrl: seed.imageUrl,
        creatorId: organizer.id
      },
      create: {
        slug: slugify(seed.title),
        title: seed.title,
        artistName: seed.artistName,
        venueName: seed.venueName,
        city: seed.city,
        dateWindow: seed.dateWindow,
        description: seed.description,
        fundingGoal: seed.fundingGoal,
        deadline: new Date(`${seed.deadline}T23:59:59.000Z`),
        status: campaignStatus(seed),
        imageUrl: seed.imageUrl,
        creatorId: organizer.id
      }
    });

    await prisma.pledge.deleteMany({
      where: {
        campaignId: campaign.id
      }
    });

    const totalPledged = Math.round(seed.fundingGoal * seed.fundingPercent);
    const hardAmounts = pledgeAmounts(totalPledged, seed.hardSupporters);
    const campaignSupporters = supporters.slice(supporterCursor, supporterCursor + seed.hardSupporters + seed.softSupporters);
    supporterCursor += seed.hardSupporters + seed.softSupporters;

    await prisma.pledge.createMany({
      data: [
        ...hardAmounts.map((amount, index) => ({
          userId: campaignSupporters[index].id,
          campaignId: campaign.id,
          amount,
          type: PledgeType.HARD,
          paymentStatus: PaymentStatus.AUTHORIZED
        })),
        ...campaignSupporters.slice(seed.hardSupporters).map((user) => ({
          userId: user.id,
          campaignId: campaign.id,
          amount: 0,
          type: PledgeType.SOFT,
          paymentStatus: PaymentStatus.NOT_REQUIRED
        }))
      ]
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
