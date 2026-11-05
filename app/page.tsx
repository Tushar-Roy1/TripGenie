
"use client";

import { useState,useEffect } from "react";
import dynamic from "next/dynamic";
import ItineraryResults from "@/components/itinerary-results";
import DayWiseItinerary from "@/components/day-wise-itinerary";
import type { Attraction } from "@/lib/types";

import {
  Compass,
  Map,
  MapPin,
  CalendarDays,
  Sparkles,
  Plane,
  Backpack,
  ChevronRight,
  Plus,
  Users,
  Save,
  Printer,
  Share2,
  Trash2,
} from "lucide-react";

const TripMap = dynamic(
  () => import("@/components/trip-map"),
  {
    ssr: false,
    loading: () => (
      <div className="map-loading">
        Loading your trip map...
      </div>
    ),
  }
);

const interests = [
  "Nature",
  "Food",
  "Culture",
  "Adventure",
  "Beaches",
  "Nightlife",
];

// Calculate inclusive trip duration
function calculateTripDays(
  startDate: string,
  endDate: string
) {
  const [startYear, startMonth, startDay] =
    startDate.split("-").map(Number);

  const [endYear, endMonth, endDay] =
    endDate.split("-").map(Number);

  const start = Date.UTC(
    startYear,
    startMonth - 1,
    startDay
  );

  const end = Date.UTC(
    endYear,
    endMonth - 1,
    endDay
  );

  return (
    Math.floor(
      (end - start) / (1000 * 60 * 60 * 24)
    ) + 1
  );
}

export default function Home() {
  const [destination, setDestination] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [travelers, setTravelers] = useState("1");
  const [budget, setBudget] = useState("500");
  const [currency, setCurrency] = useState("USD");
  const [pace, setPace] = useState("Balanced");

  const [selectedInterests, setSelectedInterests] =
    useState<string[]>(["Nature", "Food"]);

  const [generated, setGenerated] = useState(false);

  // Shared selected attractions
  const [selectedAttractions, setSelectedAttractions] =
    useState<Attraction[]>([]);

  // Stores attraction IDs assigned to each day.
  // Day 0 = Day 1, Day 1 = Day 2, etc.
  const [dayAssignments, setDayAssignments] =
    useState<Record<number, string[]>>({});

    // Stores the planned time for each attraction
  const [activityTimes, setActivityTimes] =
  useState<Record<string, string>>({});

  const [activityDurations, setActivityDurations] =
  useState<Record<string, number>>({});
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
// Restore saved itinerary when opening from My Trips
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const tripId = params.get("tripId");

  if (!tripId) return;

  try {
    const savedTrips = JSON.parse(
      localStorage.getItem("tripgenie-saved-trips") || "[]"
    );

    const savedTrip = savedTrips.find(
      (trip: { id: string }) => trip.id === tripId
    );

    if (!savedTrip) return;
    setEditingTripId(savedTrip.id);
    setDestination(savedTrip.destination || "");
    setStartDate(savedTrip.startDate || "");
    setEndDate(savedTrip.endDate || "");
    setTravelers(savedTrip.travelers || "1");
    setBudget(savedTrip.budget || "500");
    setCurrency(savedTrip.currency || "USD");
    setPace(savedTrip.pace || "Balanced");

    setSelectedInterests(savedTrip.selectedInterests || []);
    setSelectedAttractions(savedTrip.selectedAttractions || []);
    setDayAssignments(savedTrip.dayAssignments || {});
    setActivityTimes(savedTrip.activityTimes || {});
    setActivityDurations(savedTrip.activityDurations || {});

    setEditingTripId(null);
    setGenerated(true);
  } catch (error) {
    console.error("Error restoring saved trip:", error);
  }
}, []);
  // Add attraction without duplicates
  function handleAddAttraction(attraction: Attraction) {
    setSelectedAttractions((current) => {
      if (
        current.some((item) => item.id === attraction.id)
      ) {
        return current;
      }

      return [...current, attraction];
    });
  }

  // Remove an attraction from its assigned day
  function handleRemoveAssignment(attractionId: string) {
    setDayAssignments((current) => {
      const updated = { ...current };

      Object.keys(updated).forEach((key) => {
        const dayIndex = Number(key);

        updated[dayIndex] = updated[dayIndex].filter(
          (id) => id !== attractionId
        );
      });

      return updated;
    });
  }

  // Assign attraction to a day
  function handleAssignAttraction(
    attractionId: string,
    dayIndex: number
  ) {
    setDayAssignments((current) => {
      // Remove attraction from any previous day
      const updated = { ...current };

      Object.keys(updated).forEach((key) => {
        const index = Number(key);

        updated[index] = updated[index].filter(
          (id) => id !== attractionId
        );
      });

      // Add attraction to the selected day
      updated[dayIndex] = [
        ...(updated[dayIndex] || []),
        attractionId,
      ];

      return updated;
    });
  }

  function handleSetActivityTime(
  attractionId: string,
  time: string
) {
  setActivityTimes((current) => ({
    ...current,
    [attractionId]: time,
  }));
}

function handleSetActivityDuration(
  attractionId: string,
  duration: number
) {
  setActivityDurations((current) => ({
    ...current,
    [attractionId]: duration,
  }));
}

  // Remove attraction completely from itinerary
  function handleRemoveAttraction(id: string) {
    setSelectedAttractions((current) =>
      current.filter((item) => item.id !== id)
    );

    handleRemoveAssignment(id);
  }

  // Toggle travel interests
  function toggleInterest(interest: string) {
    setSelectedInterests((current) =>
      current.includes(interest)
        ? current.filter((item) => item !== interest)
        : [...current, interest]
    );
  }

  // Submit trip form
  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!startDate || !endDate) {
      alert("Please select your travel dates.");
      return;
    }

    if (endDate < startDate) {
      alert("End date must be on or after the start date.");
      return;
    }

    const duration = calculateTripDays(
      startDate,
      endDate
    );

    if (duration > 14) {
      alert(
        "For our MVP, please choose a trip of 14 days or less."
      );
      return;
    }

    if (selectedInterests.length === 0) {
      alert("Please select at least one travel interest.");
      return;
    }

    setGenerated(true);
  }
  // Save complete itinerary to localStorage
function handleSaveTrip() {
  const newTrip = {
    id: editingTripId || String(Date.now()),
    savedAt: new Date().toISOString(),

    destination,
    startDate,
    endDate,
    travelers,
    budget,
    currency,
    pace,
    selectedInterests,

    selectedAttractions,
    dayAssignments,
    activityTimes,
    activityDurations,
  };

  try {
    const existingTrips = JSON.parse(
      localStorage.getItem("tripgenie-saved-trips") || "[]"
    );

    const filteredTrips = existingTrips.filter(
  (trip: { destination: string; startDate: string; endDate: string }) =>
    !(
      trip.destination === newTrip.destination &&
      trip.startDate === newTrip.startDate &&
      trip.endDate === newTrip.endDate
    )
);

const updatedTrips = editingTripId
  ? existingTrips.map((trip: { id: string }) =>
      trip.id === editingTripId ? newTrip : trip
    )
  : [...filteredTrips, newTrip];

    localStorage.setItem(
      "tripgenie-saved-trips",
      JSON.stringify(updatedTrips)
    );

    alert("Your trip has been saved successfully!");
  } catch (error) {
    console.error("Error saving trip:", error);
    alert("Unable to save your trip. Please try again.");
  }
}

  const tripDays =
    startDate && endDate && endDate >= startDate
      ? calculateTripDays(startDate, endDate)
      : 0;

  return (
    <main className="app-shell">

      {/* Sidebar */}
      <aside className="sidebar">
        <a className="brand" href="/">
          <span className="brand-icon">
            <Compass size={23} />
          </span>
          <span>TripGenie</span>
        </a>

        <p className="nav-label">WORKSPACE</p>

        <a className="nav-item active" href="#planner">
          <Plus size={18} />
          Plan a trip
        </a>

        <a className="nav-item" href="/my-trips">
          <Map size={18} />
          My trips
        </a>

        <a className="nav-item" href="#inspiration">
          <Sparkles size={18} />
          Inspiration
        </a>

        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={20} />
            <strong>Your next adventure awaits</strong>
            <p>Create a personalized itinerary with AI.</p>
          </div>

          <div className="profile">
            <div className="avatar">T</div>
            <div>
              <strong>Traveler</strong>
              <p>Free plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <section className="main-content" id="planner">

        <header className="topbar">
          <div>
            <p className="eyebrow">
              YOUR PERSONAL TRAVEL PLANNER
            </p>

            <h1>Where will you go next?</h1>

            <p className="subtitle">
              Tell us what you love. We'll help plan the journey.
            </p>
          </div>

          <div className="topbar-icon">
            <Backpack size={23} />
          </div>
        </header>

        {/* Hero */}
        <div className="hero-banner">
          <div className="hero-copy">
            <span className="hero-tag">
              <Sparkles size={14} />
              YOUR NEXT ADVENTURE
            </span>

            <h2>
              Less planning.
              <br />
              More exploring.
            </h2>

            <p>
              Discover new places and build a trip that feels like yours.
            </p>
          </div>

          <div className="hero-decoration">
            <Compass size={100} strokeWidth={0.8} />
          </div>
        </div>

        {/* Trip form */}
        <form
          className="planner-card"
          onSubmit={handleSubmit}
        >
          <div className="section-heading">
            <div className="heading-icon">
              <MapPin size={20} />
            </div>

            <div>
              <h2>Plan your adventure</h2>
              <p>Start with the essentials. Customize the rest.</p>
            </div>
          </div>

          {/* Destination */}
          <div className="field-group">
            <label htmlFor="destination">
              Where do you want to go?
            </label>

            <div className="input-with-icon">
              <MapPin size={18} />

              <input
                id="destination"
                value={destination}
                onChange={(e) =>
                  setDestination(e.target.value)
                }
                placeholder="e.g. Kyoto, Japan"
                required
              />
            </div>
          </div>

          {/* Dates */}
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="startDate">
                Start date
              </label>

              <div className="input-with-icon">
                <CalendarDays size={18} />

                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(e.target.value)
                  }
                  required
                />
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="endDate">
                End date
              </label>

              <div className="input-with-icon">
                <CalendarDays size={18} />

                <input
                  id="endDate"
                  type="date"
                  min={startDate || undefined}
                  value={endDate}
                  onChange={(e) =>
                    setEndDate(e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Trip duration preview */}
          {tripDays > 0 && (
            <div className="trip-duration-preview">
              <CalendarDays size={17} />
              <span>
                Your trip duration:{" "}
                <strong>
                  {tripDays} {tripDays === 1 ? "day" : "days"}
                </strong>
              </span>
            </div>
          )}

          {/* Travelers and budget */}
          <div className="form-grid">
            <div className="field-group">
              <label htmlFor="travelers">
                Travelers
              </label>

              <div className="input-with-icon">
                <Users size={18} />

                <select
                  id="travelers"
                  value={travelers}
                  onChange={(e) =>
                    setTravelers(e.target.value)
                  }
                >
                  <option value="1">1 traveler</option>
                  <option value="2">2 travelers</option>
                  <option value="3">3 travelers</option>
                  <option value="4">4 travelers</option>
                  <option value="5">5+ travelers</option>
                </select>
              </div>
            </div>

            <div className="field-group">
              <label htmlFor="budget">
                Total trip budget
              </label>

              <div className="budget-input">
                <select
                  aria-label="Currency"
                  value={currency}
                  onChange={(e) =>
                    setCurrency(e.target.value)
                  }
                >
                  <option value="USD">USD $</option>
                  <option value="INR">INR ₹</option>
                  <option value="EUR">EUR €</option>
                  <option value="GBP">GBP £</option>
                  <option value="JPY">JPY ¥</option>
                </select>

                <input
                  id="budget"
                  type="number"
                  min="1"
                  value={budget}
                  onChange={(e) =>
                    setBudget(e.target.value)
                  }
                  required
                />
              </div>
            </div>
          </div>

          {/* Interests */}
          <div className="field-group">
            <label>What are you interested in?</label>

            <div className="interest-list">
              {interests.map((interest) => (
                <button
                  className={`interest-chip ${
                    selectedInterests.includes(interest)
                      ? "selected"
                      : ""
                  }`}
                  type="button"
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  aria-pressed={selectedInterests.includes(
                    interest
                  )}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          {/* Pace */}
          <div className="field-group">
            <label htmlFor="pace">
              Preferred travel pace
            </label>

            <select
              className="standalone-select"
              id="pace"
              value={pace}
              onChange={(e) => setPace(e.target.value)}
            >
              <option>Relaxed</option>
              <option>Balanced</option>
              <option>Packed with activities</option>
            </select>
          </div>

          <button
            className="generate-button"
            type="submit"
          >
            <Sparkles size={19} />
            Generate my trip
            <ChevronRight size={19} />
          </button>

          <p className="form-note">
            <Sparkles size={14} />
            Your travel preferences shape your personalized plan.
          </p>
        </form>

        {/* Generated trip */}
        {generated && (
          <>
            <ItineraryResults
              destination={destination}
              currency={currency}
              budget={Number(budget)}
            />

            <TripMap
              destination={destination}
              startDate={startDate}
              endDate={endDate}
              tripDays={tripDays}
              selectedAttractions={selectedAttractions}
              onAddAttraction={handleAddAttraction}
              onRemoveAttraction={handleRemoveAttraction}
            />

            <DayWiseItinerary
              activityTimes={activityTimes}
              onSetActivityTime={handleSetActivityTime}
              destination={destination}
              startDate={startDate}
              tripDays={tripDays}
              selectedAttractions={selectedAttractions}
              dayAssignments={dayAssignments}
              onAssignAttraction={handleAssignAttraction}
              onRemoveAssignment={handleRemoveAssignment}
              activityDurations={activityDurations}
              onSetActivityDuration={handleSetActivityDuration}
            />
            
<div className="print-itinerary">
  <header className="print-header">
    <h1>TRIPGENIE</h1>
    <h2>{destination} Travel Itinerary</h2>
    <p>
      {startDate} – {endDate}
    </p>
  </header>

  <section className="print-overview">
    <h2>Trip Overview</h2>
    <p>Destination: {destination}</p>
    <p>Travelers: {travelers}</p>
    <p>Budget: {currency} {budget}</p>
    <p>Travel pace: {pace}</p>
  </section>

  <section className="print-days">
    <h2>Day-wise Schedule</h2>

    {Array.from({ length: tripDays }, (_, index) => {
      const dayNumber = index + 1;
      const assignedIds = dayAssignments[dayNumber] || [];

      const dayDate = new Date(`${startDate}T00:00:00`);
      dayDate.setDate(dayDate.getDate() + index);

      const places = assignedIds
        .map((id) =>
          selectedAttractions.find((place) => place.id === id)
        )
        .filter((place) => place !== undefined);

      return (
        <div className="print-day" key={dayNumber}>
          <h3>
            Day {dayNumber} —{" "}
            {dayDate.toLocaleDateString("en-IN", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </h3>

          {places.length === 0 ? (
            <p>No activities assigned.</p>
          ) : (
            places.map((place) => (
              <div className="print-activity" key={place.id}>
                <h4>{place.name}</h4>
                <p>{place.category}</p>
                <p>{place.address}</p>
                <p>
                  Visit time: {activityTimes[place.id] || "Not scheduled"}
                </p>
                <p>
                  Duration:{" "}
                  {activityDurations[place.id]
                    ? `${activityDurations[place.id]} minutes`
                    : "Not specified"}
                </p>
              </div>
            ))
          )}
        </div>
      );
    })}
  </section>

  <footer className="print-footer">
    Made with TripGenie — Your personal travel planner.
  </footer>
</div>

            <div className="save-trip-container">
  <button
    type="button"
    className="save-trip-button"
    onClick={handleSaveTrip}
  >
    <Save size={18} />
    Save Itinerary
  </button>
  <div className="export-pdf-container">
  <button
    type="button"
    className="export-pdf-button"
    onClick={() => window.print()}
  >
    <Printer size={18} />
    Export Itinerary as PDF
  </button>
</div>
</div>
          </>
        )}

        <footer className="page-footer">
          <Plane size={15} />
          Made for curious travelers, everywhere.
        </footer>

      </section>
    </main>
  );
}
