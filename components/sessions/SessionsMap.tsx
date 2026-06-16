"use client";

import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./sessions-map.css";
import { getFeeSettings } from "@/lib/fee-settings";
import { formatMoney, getCustomerPrice } from "@/lib/payments";
import {
  ClubSession,
  formatSessionLocation,
  getTicketPriceSummary,
} from "@/lib/sessions";
import {
  getMapDisplayCoordinates,
  getStoredSessionCoordinates,
  LONDON_CENTER,
  type SessionCoordinates,
} from "@/lib/session-coordinates";
import { ACTIVORA_ACTION, ACTIVORA_ACCENT } from "@/lib/home/constants";

type SessionsMapProps = {
  sessions: ClubSession[];
  activeSessionId: string | null;
  focusSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  searchCenter?: SessionCoordinates | null;
  radiusMiles?: number;
};

type MarkerEntry = {
  marker: mapboxgl.Marker;
  root: HTMLButtonElement;
};

type MapStatus = "loading" | "ready" | "unavailable";
type UnavailableReason = "missing" | "invalid";

const MAP_STYLE = "mapbox://styles/mapbox/streets-v12";
const ACTIVORA_WATER = "#42a5ff";
const ACTIVORA_PARK = "#72c679";
const RADIUS_SOURCE_ID = "activora-search-radius";
const RADIUS_FILL_LAYER_ID = "activora-search-radius-fill";
const RADIUS_LINE_LAYER_ID = "activora-search-radius-line";

function milesToMeters(miles: number): number {
  return miles * 1609.34;
}

function createRadiusGeoJson(
  center: SessionCoordinates,
  radiusMiles: number,
): GeoJSON.Feature<GeoJSON.Polygon> {
  const points = 64;
  const coords: [number, number][] = [];
  const distance = milesToMeters(radiusMiles);
  const { lat, lng } = center;

  for (let i = 0; i < points; i += 1) {
    const angle = (i * 360) / points;
    const radians = (angle * Math.PI) / 180;
    const dx = (distance * Math.cos(radians)) / (111320 * Math.cos((lat * Math.PI) / 180));
    const dy = (distance * Math.sin(radians)) / 110540;
    coords.push([lng + dx, lat + dy]);
  }
  coords.push(coords[0]);

  return {
    type: "Feature",
    properties: {},
    geometry: {
      type: "Polygon",
      coordinates: [coords],
    },
  };
}

function updateRadiusOverlay(
  map: mapboxgl.Map,
  searchCenter: SessionCoordinates | null | undefined,
  radiusMiles: number | undefined,
): void {
  if (map.getLayer(RADIUS_FILL_LAYER_ID)) {
    map.removeLayer(RADIUS_FILL_LAYER_ID);
  }
  if (map.getLayer(RADIUS_LINE_LAYER_ID)) {
    map.removeLayer(RADIUS_LINE_LAYER_ID);
  }
  if (map.getSource(RADIUS_SOURCE_ID)) {
    map.removeSource(RADIUS_SOURCE_ID);
  }

  if (!searchCenter || !radiusMiles || radiusMiles <= 0) {
    return;
  }

  map.addSource(RADIUS_SOURCE_ID, {
    type: "geojson",
    data: createRadiusGeoJson(searchCenter, radiusMiles),
  });

  map.addLayer({
    id: RADIUS_FILL_LAYER_ID,
    type: "fill",
    source: RADIUS_SOURCE_ID,
    paint: {
      "fill-color": ACTIVORA_ACTION,
      "fill-opacity": 0.08,
    },
  });

  map.addLayer({
    id: RADIUS_LINE_LAYER_ID,
    type: "line",
    source: RADIUS_SOURCE_ID,
    paint: {
      "line-color": ACTIVORA_ACCENT,
      "line-width": 2,
      "line-opacity": 0.6,
    },
  });
}

function isValidMapboxPublicToken(token: string): boolean {
  return token.startsWith("pk.");
}

function isMapboxAuthError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const err = error as { status?: number; message?: string };
  if (err.status === 401 || err.status === 403) {
    return true;
  }

  const message = err.message?.toLowerCase() ?? "";
  return (
    message.includes("access token") ||
    message.includes("unauthorized") ||
    message.includes("invalid token")
  );
}

function getSessionCustomerPrice(session: ClubSession): number {
  const feeSettings = getFeeSettings();
  return getCustomerPrice(
    session.price,
    session.platformFeePercent,
    feeSettings.feeHandling,
  );
}

function applyActivoraMapStyling(map: mapboxgl.Map): void {
  const layers = map.getStyle()?.layers ?? [];

  for (const layer of layers) {
    if (layer.type !== "fill") {
      continue;
    }

    const id = layer.id.toLowerCase();

    try {
      if (id.includes("water")) {
        map.setPaintProperty(layer.id, "fill-color", ACTIVORA_WATER);
        map.setPaintProperty(layer.id, "fill-opacity", 0.92);
      }

      if (
        id.includes("park") ||
        id.includes("grass") ||
        id.includes("green") ||
        id === "landcover"
      ) {
        map.setPaintProperty(layer.id, "fill-color", ACTIVORA_PARK);
      }
    } catch {
      // Some layers use expressions that cannot be overridden in this runtime.
    }
  }
}

function getFromPriceLabel(session: ClubSession): string {
  const summary = getTicketPriceSummary(session);
  if (summary.includes("Free")) {
    return "Free";
  }

  const match = summary.match(/£[\d.]+/);
  if (match) {
    return `From ${match[0]}`;
  }

  return formatMoney(getSessionCustomerPrice(session));
}

function buildPopupHtml(session: ClubSession): string {
  const venueName =
    session.venue?.venueName || formatSessionLocation(session);
  const postcode = session.venue?.postcode || "—";
  const fromPrice = getFromPriceLabel(session);

  return `
    <div class="activora-popup">
      <h3 class="activora-popup__title">${session.sessionTitle}</h3>
      <p class="activora-popup__location">${venueName}</p>
      <p class="activora-popup__meta">${postcode}</p>
      <div class="activora-popup__footer">
        <span class="activora-popup__price">${fromPrice}</span>
        <a class="activora-popup__cta" href="/book/${session.id}">Book now</a>
      </div>
    </div>
  `;
}

function createMarkerElement(
  session: ClubSession,
  fromPrice: string,
  isSelected: boolean,
  onClick: () => void,
): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `activora-marker${isSelected ? " activora-marker--selected" : ""}`;
  button.setAttribute(
    "aria-label",
    `${session.sessionTitle}, ${fromPrice}, ${session.venue?.postcode ?? ""}`,
  );

  const priceBadge = document.createElement("span");
  priceBadge.className = "activora-marker__price";
  priceBadge.textContent = fromPrice.replace("From ", "");

  const pin = document.createElement("span");
  pin.className = "activora-marker__pin";
  pin.innerHTML = `
    <svg viewBox="0 0 32 42" aria-hidden="true">
      <path
        d="M16 0C9.925 0 5 4.925 5 11c0 8.25 11 31 11 31s11-22.75 11-31C27 4.925 22.075 0 16 0Z"
        fill="#2563EB"
        stroke="#ffffff"
        stroke-width="2"
      />
      <circle cx="16" cy="11" r="4.5" fill="#ffffff" />
    </svg>
  `;

  button.append(priceBadge, pin);
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    onClick();
  });

  return button;
}

function updateMarkerSelection(root: HTMLButtonElement, isSelected: boolean): void {
  root.classList.toggle("activora-marker--selected", isSelected);

  const pin = root.querySelector(".activora-marker__pin");
  if (pin instanceof HTMLElement) {
    const path = pin.querySelector("path");
    if (path) {
      path.setAttribute("fill", isSelected ? "#14B8A6" : "#2563EB");
    }
  }
}

function MapUnavailable({ reason }: { reason: UnavailableReason }) {
  return (
    <div
      className="flex h-full min-h-[320px] items-center justify-center bg-zinc-100 p-6 text-center"
      role="status"
      aria-live="polite"
    >
      <div className="max-w-sm">
        <p className="text-sm font-medium text-zinc-900">
          Map preview unavailable
        </p>
        <p className="mt-2 text-sm text-zinc-500">
          You can still browse sessions in the list and book activities as
          usual.
        </p>
        {reason === "missing" && process.env.NODE_ENV === "development" && (
          <p className="mt-3 text-xs text-zinc-400">
            Add{" "}
            <code className="rounded bg-white px-1.5 py-0.5">
              NEXT_PUBLIC_MAPBOX_TOKEN
            </code>{" "}
            to <code className="rounded bg-white px-1.5 py-0.5">.env.local</code>{" "}
            to enable the map.
          </p>
        )}
      </div>
    </div>
  );
}

export function SessionsMap({
  sessions,
  activeSessionId,
  focusSessionId,
  onSessionSelect,
  searchCenter = null,
  radiusMiles,
}: SessionsMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markersRef = useRef<Map<string, MarkerEntry>>(new Map());
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN?.trim() ?? "";
  const [mapStatus, setMapStatus] = useState<MapStatus>(() =>
    token && isValidMapboxPublicToken(token) ? "loading" : "unavailable",
  );
  const [unavailableReason, setUnavailableReason] = useState<UnavailableReason>(
    () => (token ? "invalid" : "missing"),
  );

  useEffect(() => {
    if (!token) {
      setUnavailableReason("missing");
      setMapStatus("unavailable");
      return;
    }

    if (!isValidMapboxPublicToken(token)) {
      setUnavailableReason("invalid");
      setMapStatus("unavailable");
      return;
    }

    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [LONDON_CENTER.lng, LONDON_CENTER.lat],
      zoom: 11,
      attributionControl: false,
    });

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), "bottom-left");
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right",
    );
    mapRef.current = map;

    map.on("load", () => {
      applyActivoraMapStyling(map);
      updateRadiusOverlay(map, searchCenter, radiusMiles);
      setMapStatus("ready");
    });

    map.on("error", (event) => {
      if (!isMapboxAuthError(event.error)) {
        return;
      }

      setUnavailableReason("invalid");
      setMapStatus("unavailable");
      popupRef.current?.remove();
      popupRef.current = null;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    });

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      markersRef.current.forEach(({ marker }) => marker.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== "ready") {
      return;
    }

    markersRef.current.forEach(({ marker }) => marker.remove());
    markersRef.current.clear();

    let markerCount = 0;

    sessions.forEach((session) => {
      const displayCoordinates = getMapDisplayCoordinates(session);
      if (!displayCoordinates) {
        return;
      }

      const fromPrice = getFromPriceLabel(session);
      const isSelected = session.id === activeSessionId;
      const element = createMarkerElement(session, fromPrice, isSelected, () => {
        onSessionSelect(session.id);
      });

      const marker = new mapboxgl.Marker({ element, anchor: "bottom" })
        .setLngLat([displayCoordinates.lng, displayCoordinates.lat])
        .addTo(map);

      markersRef.current.set(session.id, { marker, root: element });
      markerCount += 1;
    });

    console.log("[Activora /sessions map] Map markers created:", markerCount);

    const mappableSessions = sessions.filter(
      (session) => getMapDisplayCoordinates(session) !== null,
    );

    if (mappableSessions.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      mappableSessions.forEach((session) => {
        const coordinates = getStoredSessionCoordinates(session);
        if (coordinates) {
          bounds.extend([coordinates.lng, coordinates.lat]);
        }
      });
      map.fitBounds(bounds, { padding: 72, maxZoom: 13, duration: 0 });
    } else if (mappableSessions.length === 1) {
      const coordinates = getStoredSessionCoordinates(mappableSessions[0]);
      if (coordinates) {
        map.jumpTo({ center: [coordinates.lng, coordinates.lat], zoom: 12 });
      }
    } else {
      map.jumpTo({
        center: [LONDON_CENTER.lng, LONDON_CENTER.lat],
        zoom: 11,
      });
    }
  }, [sessions, mapStatus, onSessionSelect, activeSessionId]);

  useEffect(() => {
    markersRef.current.forEach(({ root }, sessionId) => {
      updateMarkerSelection(root, sessionId === activeSessionId);
    });
  }, [activeSessionId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== "ready" || !focusSessionId) {
      return;
    }

    const session = sessions.find((item) => item.id === focusSessionId);
    if (!session) {
      return;
    }

    const coordinates = getStoredSessionCoordinates(session);
    if (!coordinates) {
      return;
    }

    map.flyTo({
      center: [coordinates.lng, coordinates.lat],
      zoom: 13,
      essential: true,
    });
  }, [focusSessionId, mapStatus, sessions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== "ready") {
      return;
    }

    if (!focusSessionId) {
      popupRef.current?.remove();
      return;
    }

    const session = sessions.find((item) => item.id === focusSessionId);
    if (!session) {
      popupRef.current?.remove();
      return;
    }

    const coordinates = getStoredSessionCoordinates(session);
    if (!coordinates) {
      popupRef.current?.remove();
      return;
    }

    if (!popupRef.current) {
      popupRef.current = new mapboxgl.Popup({
        closeButton: true,
        closeOnClick: false,
        offset: 18,
        className: "activora-map-popup",
        maxWidth: "280px",
      });
    }

    popupRef.current
      .setLngLat([coordinates.lng, coordinates.lat])
      .setHTML(buildPopupHtml(session))
      .addTo(map);
  }, [focusSessionId, mapStatus, sessions]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStatus !== "ready") {
      return;
    }
    updateRadiusOverlay(map, searchCenter, radiusMiles);
  }, [searchCenter, radiusMiles, mapStatus]);

  if (mapStatus === "unavailable") {
    return <MapUnavailable reason={unavailableReason} />;
  }

  return (
    <div className="activora-map-container relative h-full min-h-[320px] w-full">
      <div ref={mapContainerRef} className="h-full w-full" />
      {mapStatus === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-100">
          <p className="text-sm text-zinc-500">Loading map…</p>
        </div>
      )}
      {mapStatus === "ready" && sessions.length === 0 ? (
        <div className="pointer-events-none absolute bottom-4 left-4 rounded-xl border border-white/80 bg-white/95 px-3 py-2 text-xs text-zinc-600 shadow-sm backdrop-blur">
          No map locations yet
        </div>
      ) : null}
    </div>
  );
}
