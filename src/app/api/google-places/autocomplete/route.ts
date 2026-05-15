import { NextResponse } from "next/server";
import { AUTOCOMPLETE_FIELD_MASK, googlePlacesRequestHeaders, toVenueSuggestions } from "@/lib/google-places";

const GOOGLE_AUTOCOMPLETE_URL = "https://places.googleapis.com/v1/places:autocomplete";

export async function POST(request: Request) {
  const headers = googlePlacesRequestHeaders(AUTOCOMPLETE_FIELD_MASK);

  if (!headers) {
    return NextResponse.json({ error: "GOOGLE_MAPS_API_KEY is not configured." }, { status: 500 });
  }

  const body = await request.json();
  const input = String(body.input ?? "").trim();
  const sessionToken = String(body.sessionToken ?? "").trim();

  if (input.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  if (!sessionToken) {
    return NextResponse.json({ error: "sessionToken is required" }, { status: 400 });
  }

  const googleResponse = await fetch(GOOGLE_AUTOCOMPLETE_URL, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input,
      sessionToken,
      includeQueryPredictions: false
    })
  });

  if (!googleResponse.ok) {
    const payload = await googleResponse.json().catch(() => null);
    const message = payload?.error?.message ?? "Google Places autocomplete failed.";
    return NextResponse.json({ error: message }, { status: googleResponse.status });
  }

  const payload = await googleResponse.json();
  return NextResponse.json({ suggestions: toVenueSuggestions(payload).slice(0, 5) });
}
