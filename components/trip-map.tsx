
"use client";

import type { Attraction } from "@/lib/types";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";

import MarkerClusterGroup from "react-leaflet-cluster";
import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useEffect, useState } from "react";
import { CalendarDays, Search } from "lucide-react";

// Geocoding result type
type GeoResult = {
  lat: string;
  lon: string;
  display_name: string;
  type?: string;
};

// Places API response
type PlacesResponse = {
  attractions: Attraction[];
  count: number;
  error?: string;
};

// Destination marker
const destinationIcon = L.divIcon({
  className: "",
  html: `
    <div style="
      width:38px;
      height:38px;
      border-radius:50%;
      background:#e84b4b;
      color:white;
      border:3px solid white;
      box-shadow:0 3px 10px #0004;
      display:flex;
      align-items:center;
      justify-content:center;
      font-size:19px;
    ">★</div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 19],
});

// Attraction marker based on category
function getAttractionIcon(category: string) {
  const normalized = category.toLowerCase();

  let emoji = "📍";
  let background = "#6558e8";

  if (normalized.includes("museum")) {
    emoji = "🏛️";
    background = "#2563eb";
  } else if (
    normalized.includes("landmark") ||
    normalized.includes("historic")
  ) {
    emoji = "🏰";
    background = "#d97706";
  } else if (
    normalized.includes("park") ||
    normalized.includes("garden")
  ) {
    emoji = "🌳";
    background = "#16a34a";
  } else if (
    normalized.includes("cultural") ||
    normalized.includes("heritage")
  ) {
    emoji = "🎭";
    background = "#9333ea";
  } else if (normalized.includes("tourist")) {
    emoji = "📸";
    background = "#db2777";
  }

  return L.divIcon({
    className: "",
    html: `
      <div style="
        width:32px;
        height:32px;
        border-radius:50%;
        background:${background};
        color:white;
        border:3px solid white;
        box-shadow:0 2px 8px #0004;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:15px;
      ">${emoji}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

// Update map when destination changes
function MapUpdater({
  center,
  zoom,
}: {
  center: [number, number];
  zoom: number;
}) {
  const map = useMap();

  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center[0], center[1], zoom]);

  return null;
}

// Focus map on selected attraction
function MapFocus({
  position,
  selectedId,
}: {
  position: [number, number] | null;
  selectedId: string | null;
}) {
  const map = useMap();

  const lat = position?.[0];
  const lon = position?.[1];

  useEffect(() => {
    if (
      !selectedId ||
      lat === undefined ||
      lon === undefined
    ) {
      return;
    }

    map.flyTo([lat, lon], 18, {
      animate: true,
      duration: 1.5,
    });
  }, [map, selectedId, lat, lon]);

  return null;
}

// TripMap component
export default function TripMap({
  destination,
  startDate,
  endDate,
  tripDays,
  selectedAttractions,
  onAddAttraction,
  onRemoveAttraction,
}: {
  destination: string;
  startDate: string;
  endDate: string;
  tripDays: number;
  selectedAttractions: Attraction[];
  onAddAttraction: (attraction: Attraction) => void;
  onRemoveAttraction: (id: string) => void;
}) {
  const [searchResult, setSearchResult] =
    useState<GeoResult | null>(null);

  const [loading, setLoading] = useState(false);

  const [attractionsLoading, setAttractionsLoading] =
    useState(false);

  const [error, setError] = useState("");

  const [searchedDestination, setSearchedDestination] =
    useState("");

  const [attractions, setAttractions] =
    useState<Attraction[]>([]);

  const [selectedAttraction, setSelectedAttraction] =
    useState<string | null>(null);

  const [focusedPosition, setFocusedPosition] =
    useState<[number, number] | null>(null);

  // Currently selected attraction
  const selectedPlace = attractions.find(
    (attraction) => attraction.id === selectedAttraction
  );

  // Check whether attraction is already in itinerary
  function isAdded(id: string) {
    return selectedAttractions.some(
      (item) => item.id === id
    );
  }

  // Add attraction to shared itinerary
  function addToItinerary(id: string) {
    const attraction = attractions.find(
      (item) => item.id === id
    );

    if (attraction && !isAdded(id)) {
      onAddAttraction(attraction);
    }
  }

  // Fetch attractions from Geoapify backend
  async function findAttractions(lat: number, lon: number) {
    setAttractionsLoading(true);
    setAttractions([]);
    setError("");

    try {
      const response = await fetch(
        `/api/places?lat=${lat}&lon=${lon}`
      );

      const data: PlacesResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Unable to fetch attractions."
        );
      }

      const results = data.attractions ?? [];

      setAttractions(results);

      if (results.length === 0) {
        setError("No tourist attractions found nearby.");
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not load attractions."
      );
    } finally {
      setAttractionsLoading(false);
    }
  }

  // Find destination coordinates
  async function findDestination() {
    const query = destination.trim();

    if (!query) {
      setError("Please enter a destination first.");
      return;
    }

    setLoading(true);
    setError("");

    setAttractions([]);
    setSearchResult(null);
    setSearchedDestination("");
    setSelectedAttraction(null);
    setFocusedPosition(null);

    try {
      const params = new URLSearchParams({
        q: query,
        format: "jsonv2",
        limit: "1",
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          "Destination service is unavailable."
        );
      }

      const results: GeoResult[] = await response.json();

      if (results.length === 0) {
        throw new Error(
          "Destination not found. Try another location."
        );
      }

      const location = results[0];

      setSearchResult(location);
      setSearchedDestination(query);

      await findAttractions(
        Number(location.lat),
        Number(location.lon)
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  // Calculate map center
  const center: [number, number] = searchResult
    ? [
        Number(searchResult.lat),
        Number(searchResult.lon),
      ]
    : [10.8505, 76.2711];

  const zoom = searchResult
    ? searchResult.type === "country"
      ? 5
      : searchResult.type === "state"
        ? 7
        : 12
    : 7;

  return (
    <section className="map-card">

      {/* Map heading */}
      <div className="map-card-heading">
        <div>
          <h3>Trip map</h3>

          <p>
            {searchResult
              ? searchResult.display_name
              : `Search for ${destination || "a destination"}`}
          </p>
        </div>

        <span className="map-status">
          {searchResult
            ? "Location found"
            : "Search required"}
        </span>
      </div>

      {/* Trip date and duration summary */}
      <div className="trip-date-summary">
        <CalendarDays size={16} />

        <span>
          {tripDays} {tripDays === 1 ? "day" : "days"} trip
          {" · "}
          {startDate} to {endDate}
        </span>
      </div>

      {/* Destination search button */}
      <button
        type="button"
        onClick={findDestination}
        disabled={loading}
        className="add-itinerary-button"
      >
        <Search size={16} />

        {loading
          ? "Finding destination..."
          : "Find destination on map"}
      </button>

      {/* Error message */}
      {error && (
        <p role="alert" className="map-disclaimer">
          {error}
        </p>
      )}

      {/* Interactive map */}
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        className="trip-map"
      >
        <MapUpdater
          center={center}
          zoom={zoom}
        />

        <MapFocus
          position={focusedPosition}
          selectedId={selectedAttraction}
        />

        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Destination marker */}
        {searchResult && (
          <Marker
            position={center}
            icon={destinationIcon}
          >
            <Popup>
              <strong>{searchedDestination}</strong>
              <br />
              Destination
            </Popup>
          </Marker>
        )}

        {/* Clustered attraction markers */}
        <MarkerClusterGroup
          chunkedLoading
          maxClusterRadius={50}
          spiderfyOnMaxZoom
          showCoverageOnHover={false}
          zoomToBoundsOnClick
        >
          {attractions.map((attraction) => (
            <Marker
              key={attraction.id}
              position={attraction.position}
              icon={getAttractionIcon(attraction.category)}
              eventHandlers={{
                click: () => {
                  setSelectedAttraction(attraction.id);
                  setFocusedPosition(attraction.position);
                },
              }}
            >
              <Popup>
                <strong>{attraction.name}</strong>
                <br />
                Category: {attraction.category}
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {/* Attraction list */}
      <div className="attractions-section">
        <div className="attractions-heading">
          <div>
            <h3>Explore attractions</h3>

            <p>
              {attractions.length} places found near{" "}
              {searchedDestination}
            </p>
          </div>
        </div>

        {attractionsLoading ? (
          <p>Loading attractions...</p>
        ) : attractions.length > 0 ? (
          <div className="attractions-list">
            {attractions.map((attraction, index) => (
              <button
                type="button"
                key={attraction.id}
                className={`attraction-item ${
                  selectedAttraction === attraction.id
                    ? "selected"
                    : ""
                }`}
                onClick={() => {
                  setSelectedAttraction(attraction.id);
                  setFocusedPosition(attraction.position);
                }}
              >
                <span className="attraction-number">
                  {index + 1}
                </span>

                <span className="attraction-info">
                  <strong>{attraction.name}</strong>
                  <small>{attraction.category}</small>
                </span>

                <span className="attraction-arrow">
                  →
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p>No attractions available yet.</p>
        )}
      </div>

      {/* Selected attraction details */}
      {selectedPlace && (
        <div className="attraction-details">
          <div className="details-header">
            <div>
              <span className="details-label">
                ATTRACTION DETAILS
              </span>

              <h3>{selectedPlace.name}</h3>
            </div>

            <span className="details-category">
              {selectedPlace.category}
            </span>
          </div>

          {/* Address */}
          <div className="details-row">
            <strong>Address</strong>

            <p>
              {selectedPlace.address ||
                "Address information is not available."}
            </p>
          </div>

          {/* Opening hours */}
          <div className="details-row">
            <strong>Opening hours</strong>

            <p>
              {selectedPlace.openingHours ||
                "Opening hours are not available."}
            </p>
          </div>

          {/* Website */}
          {selectedPlace.website && (
            <div className="details-row">
              <strong>Website</strong>

              <a
                href={selectedPlace.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit website ↗
              </a>
            </div>
          )}

          {/* Coordinates */}
          <div className="details-row">
            <strong>Location coordinates</strong>

            <p>
              {selectedPlace.position[0].toFixed(5)},{" "}
              {selectedPlace.position[1].toFixed(5)}
            </p>
          </div>

          {/* Add to itinerary */}
          <button
            type="button"
            onClick={() => addToItinerary(selectedPlace.id)}
            disabled={isAdded(selectedPlace.id)}
            className="add-itinerary-button"
          >
            {isAdded(selectedPlace.id)
              ? "✓ Added to itinerary"
              : "+ Add to itinerary"}
          </button>
        </div>
      )}

      {/* Shared itinerary */}
      <div className="my-itinerary">
        <div className="itinerary-heading">
          <h3>My itinerary</h3>

          <span>
            {selectedAttractions.length} places selected
          </span>
        </div>

        {selectedAttractions.length === 0 ? (
          <p>
            Select attractions from the map to add them to
            your itinerary.
          </p>
        ) : (
          selectedAttractions.map((place, index) => (
            <div className="itinerary-item" key={place.id}>
              <span className="itinerary-number">
                {index + 1}
              </span>

              <div className="itinerary-place-info">
                <strong>{place.name}</strong>
                <small>{place.category}</small>
              </div>

              <button
                type="button"
                onClick={() => onRemoveAttraction(place.id)}
              >
                Remove
              </button>
            </div>
          ))
        )}
      </div>

      {/* Map status */}
      <p className="map-disclaimer">
        {attractionsLoading
          ? "Loading tourist attractions..."
          : attractions.length > 0
            ? `Found ${attractions.length} mapped attractions near ${searchedDestination}.`
            : searchResult
              ? `Location found for ${searchedDestination}. No attractions loaded yet.`
              : "Search for a destination to find nearby tourist attractions."}
      </p>

    </section>
  );
}
