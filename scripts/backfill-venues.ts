import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import {
  AUTOCOMPLETE_FIELD_MASK,
  PLACE_DETAILS_FIELD_MASK,
  googlePlacesRequestHeaders,
  toNormalizedVenue,
  toVenueSuggestions,
  type NormalizedVenue,
  type VenueSuggestion
} from "../src/lib/google-places";

const prisma = new PrismaClient();
const GOOGLE_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";
const GOOGLE_PLACE_DETAILS_URL = "https://places.googleapis.com/v1/places";
const REQUEST_DELAY_MS = 180;
const MIN_CONFIDENT_SCORE = 7;
const MIN_SCORE_GAP = 2;

type BackfillArgs = {
  dryRun: boolean;
  apply: boolean;
  limit: number | null;
};

type CandidateAssessment = {
  suggestion: VenueSuggestion;
  score: number;
  notes: string[];
};

type BackfillStats = {
  matched: number;
  skipped: number;
  ambiguous: number;
  failed: number;
  autocompleteCalls: number;
  detailsCalls: number;
  manualReview: Array<{
    title: string;
    venueName: string;
    city: string;
    reason: string;
  }>;
};

function parseArgs(): BackfillArgs {
  const args = process.argv.slice(2);
  const limitIndex = args.indexOf("--limit");

  return {
    dryRun: args.includes("--dry-run") || !args.includes("--apply"),
    apply: args.includes("--apply"),
    limit: limitIndex >= 0 ? Number(args[limitIndex + 1]) : null
  };
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function meaningfulTokens(value: string) {
  const ignored = new Set(["the", "at", "in", "ny", "new", "york", "room", "venue"]);
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !ignored.has(token));
}

function hasLegacyPlaceholder(venueName: string) {
  const normalizedVenue = normalizeText(venueName);
  const placeholderPatterns = [
    "secret",
    "tba",
    "warehouse",
    "industrial room",
    "future",
    "unannounced",
    "location"
  ];

  return placeholderPatterns.some((pattern) => normalizedVenue.includes(pattern));
}

function eventTypeScore(types: string[]) {
  const eventOrientedTypes = new Set([
    "art_gallery",
    "bar",
    "concert_hall",
    "event_venue",
    "live_music_venue",
    "night_club",
    "performing_arts_theater"
  ]);

  return types.reduce((score, type) => score + (eventOrientedTypes.has(type) ? 1 : 0), 0);
}

function assessCandidate(suggestion: VenueSuggestion, venueName: string, city: string): CandidateAssessment {
  const notes: string[] = [];
  let score = 0;
  const normalizedVenue = normalizeText(venueName);
  const normalizedCandidate = normalizeText(suggestion.mainText);
  const normalizedLabel = normalizeText(suggestion.label);
  const venueTokens = meaningfulTokens(venueName);
  const matchedTokens = venueTokens.filter((token) => normalizedCandidate.includes(token));
  const cityTokens = meaningfulTokens(city);
  const matchedCityTokens = cityTokens.filter((token) => normalizedLabel.includes(token));
  const placeTypeScore = eventTypeScore(suggestion.types);

  if (normalizedCandidate === normalizedVenue) {
    score += 5;
    notes.push("exact venue-name match");
  } else if (normalizedCandidate.includes(normalizedVenue) || normalizedVenue.includes(normalizedCandidate)) {
    score += 3;
    notes.push("venue name contains candidate name");
  }

  if (venueTokens.length > 0 && matchedTokens.length / venueTokens.length >= 0.8) {
    score += 2;
    notes.push("most venue tokens matched");
  }

  if (matchedCityTokens.length > 0) {
    score += 2;
    notes.push("city context matched");
  }

  if (placeTypeScore > 0) {
    score += Math.min(placeTypeScore, 3);
    notes.push(`event-oriented place type x${placeTypeScore}`);
  }

  if (!matchedTokens.length) {
    score -= 3;
    notes.push("no venue-name tokens matched");
  }

  return {
    suggestion,
    score,
    notes
  };
}

function classifyCandidates(candidates: CandidateAssessment[]) {
  const [best, second] = candidates;

  if (!best) {
    return {
      status: "skipped" as const,
      reason: "no Google Places candidates returned",
      best
    };
  }

  if (best.score < MIN_CONFIDENT_SCORE) {
    return {
      status: "skipped" as const,
      reason: `best score ${best.score} is below conservative threshold ${MIN_CONFIDENT_SCORE}`,
      best
    };
  }

  if (second && best.score - second.score < MIN_SCORE_GAP) {
    return {
      status: "ambiguous" as const,
      reason: `top candidates are too close (${best.score} vs ${second.score})`,
      best
    };
  }

  return {
    status: "matched" as const,
    reason: best.notes.join("; "),
    best
  };
}

async function fetchSuggestions(input: string, sessionToken: string) {
  const headers = googlePlacesRequestHeaders(AUTOCOMPLETE_FIELD_MASK);

  if (!headers) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  const response = await fetch(GOOGLE_AUTOCOMPLETE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input,
      sessionToken,
      includeQueryPredictions: false
    })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Autocomplete failed with ${response.status}`);
  }

  return toVenueSuggestions(await response.json()).slice(0, 5);
}

async function fetchVenueDetails(placeId: string, sessionToken: string): Promise<NormalizedVenue> {
  const headers = googlePlacesRequestHeaders(PLACE_DETAILS_FIELD_MASK);

  if (!headers) {
    throw new Error("GOOGLE_MAPS_API_KEY is not configured.");
  }

  const url = new URL(`${GOOGLE_PLACE_DETAILS_URL}/${encodeURIComponent(placeId)}`);
  url.searchParams.set("sessionToken", sessionToken);

  const response = await fetch(url, {
    headers
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? `Place Details failed with ${response.status}`);
  }

  return toNormalizedVenue(await response.json());
}

function cityLooksCompatible(existingCity: string, venue: NormalizedVenue) {
  const existingTokens = meaningfulTokens(existingCity);
  const normalizedVenueContext = normalizeText([venue.neighborhood, venue.city, venue.formattedAddress].filter(Boolean).join(" "));

  return existingTokens.some((token) => normalizedVenueContext.includes(token));
}

function printCandidateDebug(candidates: CandidateAssessment[]) {
  for (const candidate of candidates.slice(0, 3)) {
    console.log(
      `    - ${candidate.suggestion.mainText} | ${candidate.suggestion.secondaryText || "no secondary text"} | score ${candidate.score}`
    );
    console.log(`      notes: ${candidate.notes.join("; ") || "none"}`);
  }
}

function printVenue(venue: NormalizedVenue) {
  console.log(`    proposed: ${venue.venueName}`);
  console.log(`    address:  ${venue.formattedAddress}`);
  console.log(`    context:  ${[venue.neighborhood, venue.city, venue.countryCode].filter(Boolean).join(" / ")}`);
  console.log(`    placeId:  ${venue.googlePlaceId}`);
}

async function pause() {
  await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS));
}

async function main() {
  const args = parseArgs();
  const stats: BackfillStats = {
    matched: 0,
    skipped: 0,
    ambiguous: 0,
    failed: 0,
    autocompleteCalls: 0,
    detailsCalls: 0,
    manualReview: []
  };

  if (args.apply && args.dryRun) {
    throw new Error("Use either --dry-run or --apply, not both.");
  }

  if (args.limit != null && (!Number.isInteger(args.limit) || args.limit < 1)) {
    throw new Error("--limit must be a positive integer.");
  }

  const campaigns = await prisma.campaign.findMany({
    where: {
      googlePlaceId: null
    },
    orderBy: {
      createdAt: "asc"
    },
    take: args.limit ?? undefined
  });

  console.log(`Pull venue backfill ${args.dryRun ? "(dry run)" : "(apply)"}`);
  console.log(`Campaigns missing googlePlaceId: ${campaigns.length}`);
  console.log("");

  for (const campaign of campaigns) {
    console.log(`${campaign.title}`);
    console.log(`  legacy: ${campaign.venueName} / ${campaign.city}`);

    if (hasLegacyPlaceholder(campaign.venueName)) {
      stats.skipped += 1;
      stats.manualReview.push({
        title: campaign.title,
        venueName: campaign.venueName,
        city: campaign.city,
        reason: "legacy placeholder or non-canonical venue string"
      });
      console.log("  skipped: placeholder-style venue; manual review required");
      console.log("");
      continue;
    }

    const sessionToken = crypto.randomUUID();
    const lookupInput = `${campaign.venueName} ${campaign.city}`;

    try {
      const suggestions = await fetchSuggestions(lookupInput, sessionToken);
      stats.autocompleteCalls += 1;
      const candidates = suggestions
        .map((suggestion) => assessCandidate(suggestion, campaign.venueName, campaign.city))
        .sort((a, b) => b.score - a.score);
      const classification = classifyCandidates(candidates);

      printCandidateDebug(candidates);

      if (classification.status !== "matched" || !classification.best) {
        stats[classification.status] += 1;
        stats.manualReview.push({
          title: campaign.title,
          venueName: campaign.venueName,
          city: campaign.city,
          reason: classification.reason
        });
        console.log(`  ${classification.status}: ${classification.reason}`);
        console.log("");
        await pause();
        continue;
      }

      const venue = await fetchVenueDetails(classification.best.suggestion.placeId, sessionToken);
      stats.detailsCalls += 1;

      if (!cityLooksCompatible(campaign.city, venue)) {
        stats.ambiguous += 1;
        stats.manualReview.push({
          title: campaign.title,
          venueName: campaign.venueName,
          city: campaign.city,
          reason: `details city context did not clearly match existing city (${venue.city})`
        });
        printVenue(venue);
        console.log("  ambiguous: details city context did not clearly match existing city");
        console.log("");
        await pause();
        continue;
      }

      printVenue(venue);
      console.log(`  confidence: ${classification.reason}`);

      if (!args.dryRun) {
        await prisma.campaign.update({
          where: {
            id: campaign.id
          },
          data: venue
        });
        console.log("  wrote normalized venue fields");
      } else {
        console.log("  dry-run: no database write");
      }

      stats.matched += 1;
    } catch (error) {
      stats.failed += 1;
      stats.manualReview.push({
        title: campaign.title,
        venueName: campaign.venueName,
        city: campaign.city,
        reason: error instanceof Error ? error.message : "unknown error"
      });
      console.log(`  failed: ${error instanceof Error ? error.message : "unknown error"}`);
    }

    console.log("");
    await pause();
  }

  console.log("Summary");
  console.log(`  matched: ${stats.matched}`);
  console.log(`  skipped: ${stats.skipped}`);
  console.log(`  ambiguous: ${stats.ambiguous}`);
  console.log(`  failed: ${stats.failed}`);
  console.log(`  estimated API calls: ${stats.autocompleteCalls + stats.detailsCalls}`);
  console.log(`    autocomplete: ${stats.autocompleteCalls}`);
  console.log(`    place details: ${stats.detailsCalls}`);

  if (stats.manualReview.length) {
    console.log("");
    console.log("Manual review required");
    for (const item of stats.manualReview) {
      console.log(`  - ${item.title}`);
      console.log(`    legacy: ${item.venueName} / ${item.city}`);
      console.log(`    reason: ${item.reason}`);
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
