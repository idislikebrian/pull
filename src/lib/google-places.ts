export type VenueSuggestion = {
  placeId: string;
  label: string;
  mainText: string;
  secondaryText: string;
  types: string[];
};

export type NormalizedVenue = {
  venueName: string;
  googlePlaceId: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  city: string;
  neighborhood: string | null;
  countryCode: string | null;
};

type GoogleAutocompleteResponse = {
  suggestions?: Array<{
    placePrediction?: {
      placeId?: string;
      types?: string[];
      text?: { text?: string };
      structuredFormat?: {
        mainText?: { text?: string };
        secondaryText?: { text?: string };
      };
    };
  }>;
};

type GooglePlaceDetailsResponse = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  location?: {
    latitude?: number;
    longitude?: number;
  };
  addressComponents?: Array<{
    longText?: string;
    shortText?: string;
    types?: string[];
  }>;
};

export const AUTOCOMPLETE_FIELD_MASK =
  "suggestions.placePrediction.placeId,suggestions.placePrediction.types,suggestions.placePrediction.text.text,suggestions.placePrediction.structuredFormat.mainText.text,suggestions.placePrediction.structuredFormat.secondaryText.text";

export const PLACE_DETAILS_FIELD_MASK = "id,displayName,formattedAddress,location,addressComponents";

export function googlePlacesRequestHeaders(fieldMask: string) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return null;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Goog-Api-Key": apiKey,
    "X-Goog-FieldMask": fieldMask
  };

  const referer = process.env.NEXT_PUBLIC_APP_URL;

  if (referer) {
    headers.Referer = referer;
  }

  return headers;
}

export function toVenueSuggestions(response: GoogleAutocompleteResponse): VenueSuggestion[] {
  return (response.suggestions ?? [])
    .map((suggestion) => {
      const prediction = suggestion.placePrediction;

      if (!prediction?.placeId) {
        return null;
      }

      const mainText = prediction.structuredFormat?.mainText?.text ?? prediction.text?.text ?? "Unnamed place";
      const secondaryText = prediction.structuredFormat?.secondaryText?.text ?? "";

      return {
        placeId: prediction.placeId,
        label: prediction.text?.text ?? [mainText, secondaryText].filter(Boolean).join(", "),
        mainText,
        secondaryText,
        types: prediction.types ?? []
      };
    })
    .filter((suggestion): suggestion is VenueSuggestion => Boolean(suggestion))
    .sort((a, b) => venueAffinityScore(b) - venueAffinityScore(a));
}

function venueAffinityScore(suggestion: VenueSuggestion) {
  const eventOrientedTypes = new Set([
    "art_gallery",
    "bar",
    "concert_hall",
    "event_venue",
    "live_music_venue",
    "night_club",
    "performing_arts_theater"
  ]);

  return suggestion.types.reduce((score, type) => score + (eventOrientedTypes.has(type) ? 1 : 0), 0);
}

export function toNormalizedVenue(response: GooglePlaceDetailsResponse): NormalizedVenue {
  const city =
    addressComponent(response, "locality") ??
    addressComponent(response, "postal_town") ??
    addressComponent(response, "sublocality_level_1") ??
    addressComponent(response, "sublocality") ??
    addressComponent(response, "administrative_area_level_3") ??
    addressComponent(response, "administrative_area_level_2") ??
    "";
  const neighborhood =
    addressComponent(response, "neighborhood") ??
    addressComponent(response, "sublocality") ??
    addressComponent(response, "sublocality_level_1") ??
    null;
  const countryCode = addressComponent(response, "country", "shortText") ?? null;

  if (
    !response.id ||
    !response.displayName?.text ||
    !response.formattedAddress ||
    typeof response.location?.latitude !== "number" ||
    typeof response.location.longitude !== "number" ||
    !city
  ) {
    throw new Error("Google returned an incomplete venue payload.");
  }

  return {
    venueName: response.displayName.text,
    googlePlaceId: response.id,
    formattedAddress: response.formattedAddress,
    latitude: response.location.latitude,
    longitude: response.location.longitude,
    city,
    neighborhood,
    countryCode
  };
}

function addressComponent(
  response: GooglePlaceDetailsResponse,
  type: string,
  textField: "longText" | "shortText" = "longText"
) {
  return response.addressComponents?.find((component) => component.types?.includes(type))?.[textField];
}
