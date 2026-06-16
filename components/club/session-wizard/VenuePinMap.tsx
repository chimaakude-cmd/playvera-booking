"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./venue-pin-map.css";
import {
  LONDON_CENTER,
  type SessionCoordinates,
} from "@/lib/session-coordinates";
import {
  parseOptionalCoordinate,
  type SessionVenueForm,
} from "@/lib/session-location";

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";

type VenuePinMapProps = {
  venue: SessionVenueForm;
  onCoordinatesChange: (latitude: string, longitude: string) => void;
  onPinConfirmedChange: (confirmed: boolean) => void;
};

function formatCoordinate(value: number): string {
  return value.toFixed(6);
}

function createPinElement(): HTMLDivElement {
  const element = document.createElement("div");
  element.className = "venue-pin-marker";
  element.innerHTML = `
    <svg viewBox="0 0 32 42" aria-hidden="true">
      <path d="M16 0C9.925 0 5 4.925 5 11c0 8.25 11 31 11 31s11-22.75 11-31C27 4.925 22.075 0 16 0Z" />
      <circle cx="16" cy="11" r="4.5" />
    </svg>
  `;
  return element;
}

function readVenueCoordinates(venue: SessionVenueForm): SessionCoordinates | null {
  const lat = parseOptionalCoordinate(venue.latitude);
  const lng = parseOptionalCoordinate(venue.longitude);

  if (lat === null || lng === null) {
    return null;
  }

  return { lat, lng };
}

export function VenuePinMap({
  venue,
  onCoordinatesChange,
  onPinConfirmedChange,
}: VenuePinMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const onCoordinatesChangeRef = useRef(onCoordinatesChange);
  const onPinConfirmedChangeRef = useRef(onPinConfirmedChange);
  const [mapReady, setMapReady] = useState(false);
  const [mapUnavailable, setMapUnavailable] = useState(false);

  const coordinates = readVenueCoordinates(venue);
  const hasPin = coordinates !== null;

  useEffect(() => {
    onCoordinatesChangeRef.current = onCoordinatesChange;
  }, [onCoordinatesChange]);

  useEffect(() => {
    onPinConfirmedChangeRef.current = onPinConfirmedChange;
  }, [onPinConfirmedChange]);

  const placeMarker = useCallback(
    (
      lng: number,
      lat: number,
      options?: { flyTo?: boolean; updateForm?: boolean },
    ) => {
      const map = mapRef.current;
      if (!map) {
        return;
      }

      const updateForm = options?.updateForm ?? true;

      if (!markerRef.current) {
        const marker = new mapboxgl.Marker({
          element: createPinElement(),
          draggable: true,
          anchor: "bottom",
        })
          .setLngLat([lng, lat])
          .addTo(map);

        marker.on("dragend", () => {
          const lngLat = marker.getLngLat();
          onPinConfirmedChangeRef.current(false);
          onCoordinatesChangeRef.current(
            formatCoordinate(lngLat.lat),
            formatCoordinate(lngLat.lng),
          );
        });

        markerRef.current = marker;
      } else {
        markerRef.current.setLngLat([lng, lat]);
      }

      if (updateForm) {
        onPinConfirmedChangeRef.current(false);
        onCoordinatesChangeRef.current(
          formatCoordinate(lat),
          formatCoordinate(lng),
        );
      }

      if (options?.flyTo) {
        map.flyTo({
          center: [lng, lat],
          zoom: 14,
          essential: true,
        });
      }
    },
    [],
  );

  useEffect(() => {
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim();

    if (!token || !token.startsWith("pk.") || !mapContainerRef.current) {
      setMapUnavailable(true);
      return;
    }

    if (mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [LONDON_CENTER.lng, LONDON_CENTER.lat],
      zoom: 10,
      attributionControl: false,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );
    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");

    map.on("load", () => {
      setMapReady(true);
    });

    map.on("click", (event) => {
      placeMarker(event.lngLat.lng, event.lngLat.lat, { updateForm: true });
    });

    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [placeMarker]);

  useEffect(() => {
    if (!mapReady || !coordinates) {
      if (mapReady && !coordinates) {
        markerRef.current?.remove();
        markerRef.current = null;
      }
      return;
    }

    const marker = markerRef.current;
    if (marker) {
      const current = marker.getLngLat();
      if (
        Math.abs(current.lat - coordinates.lat) < 0.000001 &&
        Math.abs(current.lng - coordinates.lng) < 0.000001
      ) {
        return;
      }
    }

    placeMarker(coordinates.lng, coordinates.lat, {
      updateForm: false,
      flyTo: true,
    });
  }, [mapReady, venue.latitude, venue.longitude, coordinates, placeMarker]);

  function handleConfirmPin() {
    if (!hasPin) {
      return;
    }

    onPinConfirmedChange(true);
  }

  if (mapUnavailable) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-8 text-center text-sm text-zinc-600">
        Map unavailable. Add{" "}
        <code className="rounded bg-white px-1.5 py-0.5">NEXT_PUBLIC_MAPBOX_TOKEN</code>{" "}
        to enable venue pin selection.
      </div>
    );
  }

  return (
    <div className="venue-pin-map space-y-3">
      <div>
        <p className="text-sm font-medium text-zinc-800">Venue map pin</p>
        <p className="text-xs text-zinc-500">
          Find the postcode first, then drag the pin or click the map to set the
          exact entrance.
        </p>
      </div>

      <div ref={mapContainerRef} className="venue-pin-map__container h-[320px] w-full" />

      {hasPin && !venue.pinConfirmed ? (
        <p className="text-sm text-blue-800">
          Postcode found. Drag the pin to the exact venue entrance.
        </p>
      ) : null}

      {hasPin ? (
        <div className="flex flex-wrap items-center gap-3">
          {!venue.pinConfirmed ? (
            <button
              type="button"
              onClick={handleConfirmPin}
              className="rounded-lg bg-pink-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-pink-700"
            >
              Confirm venue pin
            </button>
          ) : (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
              {process.env.NODE_ENV === "development" ? (
                <p className="font-semibold">Pin confirmed</p>
              ) : (
                <p className="font-semibold">Venue pin confirmed</p>
              )}
              <p className="mt-1 text-green-800">Latitude: {venue.latitude}</p>
              <p className="text-green-800">Longitude: {venue.longitude}</p>
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-amber-800">
          Enter a postcode and click Find postcode to place a map pin.
        </p>
      )}
    </div>
  );
}
