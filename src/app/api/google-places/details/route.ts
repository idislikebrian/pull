import { NextResponse } from "next/server";
import { PLACE_DETAILS_FIELD_MASK, googlePlacesRequestHeaders, toNormalizedVenue } from "@/lib/google-places";

export async function POST(request: Request) {
  const headers = googlePlacesRequestHeaders(PLACE_DETAILS_FIELD_MASK);

  if (!headers) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured." }, { status: 500 });
  }

  const body = await request.json();
  const placeId = String(body.placeId ?? "").trim();
  const sessionToken = String(body.sessionToken ?? "").trim();

  if (!placeId || !sessionToken) {
    return NextResponse.json({ error: "placeId and sessionToken are required" }, { status: 400 });
  }

  const url = new URL(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`);
  url.searchParams.set("sessionToken", sessionToken);

  const googleResponse = await fetch(url, {
    headers
  });

  if (!googleResponse.ok) {
    const payload = await googleResponse.json().catch(() => null);
    const message = payload?.error?.message ?? "Google Place Details failed.";
    return NextResponse.json({ error: message }, { status: googleResponse.status });
  }

  try {
    const payload = await googleResponse.json();
    return NextResponse.json({ venue: toNormalizedVenue(payload) });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Google returned an invalid venue." },
      { status: 502 }
    );
  }
}
