"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { NormalizedVenue, VenueSuggestion } from "@/lib/google-places";

type AutocompleteState = "idle" | "searching" | "resolving" | "error";

export function VenueAutocomplete() {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedVenue, setSelectedVenue] = useState<NormalizedVenue | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [state, setState] = useState<AutocompleteState>("idle");

  const listboxId = `${id}-listbox`;
  const activeOptionId = highlightedIndex >= 0 ? `${id}-option-${highlightedIndex}` : undefined;
  const canShowSuggestions = suggestions.length > 0 && !selectedVenue;
  const cityContext = useMemo(() => {
    if (!selectedVenue) {
      return "";
    }

    return [selectedVenue.neighborhood, selectedVenue.city, selectedVenue.countryCode].filter(Boolean).join(" / ");
  }, [selectedVenue]);

  useEffect(() => {
    if (selectedVenue) {
      return;
    }

    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      setSuggestions([]);
      setHighlightedIndex(-1);
      setState("idle");
      return;
    }

    const token = sessionToken ?? crypto.randomUUID();

    if (!sessionToken) {
      setSessionToken(token);
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setState("searching");

      try {
        const response = await fetch("/api/google-places/autocomplete", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            input: trimmedQuery,
            sessionToken: token
          }),
          signal: controller.signal
        });

        if (!response.ok) {
          throw new Error("Autocomplete failed");
        }

        const payload = (await response.json()) as { suggestions: VenueSuggestion[] };
        setSuggestions(payload.suggestions);
        setHighlightedIndex(payload.suggestions.length ? 0 : -1);
        setState("idle");
      } catch (error) {
        if (!controller.signal.aborted) {
          setSuggestions([]);
          setHighlightedIndex(-1);
          setState("error");
        }
      }
    }, 240);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [query, selectedVenue, sessionToken]);

  async function chooseSuggestion(suggestion: VenueSuggestion) {
    const token = sessionToken ?? crypto.randomUUID();
    setState("resolving");
    setSuggestions([]);
    setHighlightedIndex(-1);

    try {
      const response = await fetch("/api/google-places/details", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          placeId: suggestion.placeId,
          sessionToken: token
        })
      });

      if (!response.ok) {
        throw new Error("Place Details failed");
      }

      const payload = (await response.json()) as { venue: NormalizedVenue };
      setSelectedVenue(payload.venue);
      setQuery(payload.venue.venueName);
      setSessionToken(null);
      setState("idle");
    } catch {
      setSelectedVenue(null);
      setQuery(suggestion.label);
      setSessionToken(null);
      setState("error");
      inputRef.current?.focus();
    }
  }

  function clearSelectedVenue(nextQuery = "") {
    setSelectedVenue(null);
    setSuggestions([]);
    setHighlightedIndex(-1);
    setSessionToken(crypto.randomUUID());
    setQuery(nextQuery);
  }

  function onInputChange(value: string) {
    if (selectedVenue) {
      clearSelectedVenue(value);
      return;
    }

    setQuery(value);

    if (!sessionToken) {
      setSessionToken(crypto.randomUUID());
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!canShowSuggestions) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedIndex((current) => (current + 1) % suggestions.length);
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    }

    if (event.key === "Enter" && highlightedIndex >= 0) {
      event.preventDefault();
      void chooseSuggestion(suggestions[highlightedIndex]);
    }

    if (event.key === "Escape") {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  }

  return (
    <div className="field venue-field">
      <span>Venue node</span>
      <div className="venue-autocomplete">
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={canShowSuggestions}
          aria-describedby={`${id}-help`}
          autoComplete="off"
          onChange={(event) => onInputChange(event.target.value)}
          onFocus={() => {
            if (!sessionToken && !selectedVenue) {
              setSessionToken(crypto.randomUUID());
            }
          }}
          onKeyDown={onKeyDown}
          placeholder="Club, gallery, room, bar"
          ref={inputRef}
          required
          role="combobox"
          value={query}
        />
        {state === "searching" || state === "resolving" ? <span className="venue-state">Checking</span> : null}
        {canShowSuggestions ? (
          <ul className="venue-suggestions" id={listboxId} role="listbox">
            {suggestions.map((suggestion, index) => (
              <li
                aria-selected={highlightedIndex === index}
                id={`${id}-option-${index}`}
                key={suggestion.placeId}
                onMouseDown={(event) => {
                  event.preventDefault();
                  void chooseSuggestion(suggestion);
                }}
                role="option"
              >
                <strong>{suggestion.mainText}</strong>
                {suggestion.secondaryText ? <span>{suggestion.secondaryText}</span> : null}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
      {selectedVenue ? (
        <div className="recognized-venue">
          <span>Recognized venue</span>
          <strong>{selectedVenue.venueName}</strong>
          {cityContext ? <small>{cityContext}</small> : null}
          <button className="text-button" onClick={() => clearSelectedVenue()} type="button">
            Change
          </button>
        </div>
      ) : (
        <small id={`${id}-help`}>Attach this signal to a real room, club, gallery, bar, or performance space.</small>
      )}
      {state === "error" ? <small className="field-error">Venue lookup failed. Try the search again.</small> : null}
      <input name="venueName" type="hidden" value={selectedVenue?.venueName ?? ""} />
      <input name="googlePlaceId" type="hidden" value={selectedVenue?.googlePlaceId ?? ""} />
      <input name="formattedAddress" type="hidden" value={selectedVenue?.formattedAddress ?? ""} />
      <input name="latitude" type="hidden" value={selectedVenue?.latitude ?? ""} />
      <input name="longitude" type="hidden" value={selectedVenue?.longitude ?? ""} />
      <input name="city" type="hidden" value={selectedVenue?.city ?? ""} />
      <input name="neighborhood" type="hidden" value={selectedVenue?.neighborhood ?? ""} />
      <input name="countryCode" type="hidden" value={selectedVenue?.countryCode ?? ""} />
    </div>
  );
}
