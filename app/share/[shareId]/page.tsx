
"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams } from "next/navigation";
import {
  MapPin,
  CalendarDays,
  Users,
  Wallet,
  Clock3,
  Download,
} from "lucide-react";

type SharedAttraction = {
  id: string;
  name: string;
  category?: string;
  address?: string;
};

type SharedTripData = {
  destination: string;
  startDate: string;
  endDate: string;
  travelers?: string;
  budget?: string;
  currency?: string;
  pace?: string;
  selectedAttractions?: SharedAttraction[];
  dayAssignments?: Record<number, string[]>;
  activityTimes?: Record<string, string>;
  activityDurations?: Record<string, number>;
};

function convertTimeToMinutes(time: string) {
  if (!time) return Infinity;

  const [clock, period] = time.split(" ");
  const [hours, minutes] = clock.split(":").map(Number);

  let convertedHours = hours % 12;

  if (period === "PM") {
    convertedHours += 12;
  }

  return convertedHours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes: number) {
  const normalizedMinutes = totalMinutes % (24 * 60);
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${String(displayHours).padStart(2, "0")}:${String(
    minutes
  ).padStart(2, "0")} ${period}`;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getTripDays(startDate: string, endDate: string) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);

  const difference = Math.round(
    (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
  );

  return Math.max(0, difference + 1);
}

function getDayDate(startDate: string, dayIndex: number) {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + dayIndex);

  return formatDate(date);
}

function SharedTripContent() {
  const params = useParams<{ shareId: string }>();

  const [trip, setTrip] = useState<SharedTripData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTrip() {
      try {
        const response = await fetch(
          `/api/share?shareId=${encodeURIComponent(params.shareId)}`
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load trip");
        }

        setTrip(data.tripData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Something went wrong"
        );
      } finally {
        setLoading(false);
      }
    }

    fetchTrip();
  }, [params.shareId]);

  if (loading) {
    return (
      <main className="shared-trip-page">
        Loading itinerary...
      </main>
    );
  }

  if (error || !trip) {
    return (
      <main className="shared-trip-page">
        <h1>Trip not found</h1>
        <p>{error || "This shared itinerary is unavailable."}</p>
      </main>
    );
  }

  const selectedAttractions = trip.selectedAttractions || [];
  const dayAssignments = trip.dayAssignments || {};
  const activityTimes = trip.activityTimes || {};
  const activityDurations = trip.activityDurations || {};

  const tripDays = getTripDays(trip.startDate, trip.endDate);

  const totalSelectedPlaces = selectedAttractions.length;

  const totalScheduledActivities = Object.values(dayAssignments).reduce(
    (total, ids) => total + ids.length,
    0
  );

  const totalUnscheduledPlaces = Math.max(
    0,
    totalSelectedPlaces - totalScheduledActivities
  );

  return (
    <main className="shared-trip-page">
      {/* Header */}
      <header className="shared-trip-header">
        <h1>TRIPGENIE</h1>
        <p>Shared Travel Itinerary</p>

        <button
          type="button"
          className="shared-download-button"
          onClick={() => window.print()}
        >
          <Download size={17} />
          Download PDF
        </button>
      </header>

      {/* Trip overview */}
      <section className="shared-trip-card">
        <h2>{trip.destination} Travel Itinerary</h2>

        <div className="shared-trip-detail">
          <CalendarDays />
          <span>
            {trip.startDate} – {trip.endDate}
          </span>
        </div>

        <div className="shared-trip-detail">
          <Users />
          <span>{trip.travelers || "Not specified"} traveler(s)</span>
        </div>

        <div className="shared-trip-detail">
          <Wallet />
          <span>
            Budget: {trip.currency || ""} {trip.budget || "Not specified"}
          </span>
        </div>

        <div className="shared-trip-detail">
          <MapPin />
          <span>Travel pace: {trip.pace || "Not specified"}</span>
        </div>
      </section>

      {/* Public trip summary */}
      <section className="shared-trip-summary">
        <div className="shared-summary-card">
          <CalendarDays size={20} />
          <strong>{tripDays}</strong>
          <span>Total days</span>
        </div>

        <div className="shared-summary-card">
          <MapPin size={20} />
          <strong>{totalSelectedPlaces}</strong>
          <span>Selected places</span>
        </div>

        <div className="shared-summary-card">
          <Clock3 size={20} />
          <strong>{totalScheduledActivities}</strong>
          <span>Scheduled activities</span>
        </div>

        <div className="shared-summary-card">
          <Users size={20} />
          <strong>{totalUnscheduledPlaces}</strong>
          <span>Unscheduled places</span>
        </div>
      </section>

      {/* Day-wise itinerary */}
      <section className="shared-itinerary-section">
        <div className="shared-itinerary-heading">
          <span>YOUR TRAVEL PLAN</span>
          <h2>Day-wise Itinerary</h2>
          <p>
            Explore the activities planned for each day of your trip.
          </p>
        </div>

        {tripDays > 0 ? (
          Array.from({ length: tripDays }, (_, dayIndex) => {
            const assignedIds = dayAssignments[dayIndex] || [];

            const activities = assignedIds
              .map((id) => {
                const place = selectedAttractions.find(
                  (attraction) => attraction.id === id
                );

                if (!place) return null;

                return {
                  ...place,
                  startTime: activityTimes[id] || "",
                  duration: activityDurations[id] || 0,
                };
              })
              .filter((place) => place !== null)
              .sort(
                (a, b) =>
                  convertTimeToMinutes(a.startTime) -
                  convertTimeToMinutes(b.startTime)
              );

            return (
              <div className="shared-day-card" key={dayIndex}>
                <div className="shared-day-heading">
                  <div>
                    <span>DAY {dayIndex + 1}</span>
                    <h3>{getDayDate(trip.startDate, dayIndex)}</h3>
                  </div>

                  <span>
                    {activities.length}{" "}
                    {activities.length === 1 ? "activity" : "activities"}
                  </span>
                </div>

                {activities.length > 0 ? (
                  <div className="shared-activities-list">
                    {activities.map((place, index) => {
                      const endTime =
                        place.startTime && place.duration
                          ? formatMinutesToTime(
                              convertTimeToMinutes(place.startTime) +
                                place.duration
                            )
                          : "";

                      return (
                        <article
                          className="shared-activity-card"
                          key={place.id}
                        >
                          <div className="shared-activity-number">
                            {index + 1}
                          </div>

                          <div className="shared-activity-content">
                            <h4>{place.name}</h4>

                            <p>
                              <MapPin size={14} />
                              {place.address ||
                                place.category ||
                                "Location not specified"}
                            </p>

                            {place.category && (
                              <span className="shared-activity-category">
                                {place.category}
                              </span>
                            )}

                            <div className="shared-activity-meta">
                              <span>
                                <Clock3 size={14} />
                                {place.startTime
                                  ? `${place.startTime}${
                                      endTime ? ` – ${endTime}` : ""
                                    }`
                                  : "Time not scheduled"}
                              </span>

                              {place.duration > 0 && (
                                <span>
                                  {place.duration >= 60
                                    ? `${place.duration / 60} hr`
                                    : `${place.duration} min}`}
                                  {place.duration >= 60 &&
                                    place.duration % 60 !== 0 &&
                                    ` ${place.duration % 60} min`}
                                </span>
                              )}
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                ) : (
                  <p className="shared-empty-day">
                    No activities planned for this day.
                  </p>
                )}
              </div>
            );
          })
        ) : (
          <p>No itinerary days are available.</p>
        )}
      </section>

      <footer>
        Made with TripGenie — Your personal travel planner.
      </footer>
    </main>
  );
}

export default function SharedTripPage() {
  return (
    <Suspense
      fallback={
        <main className="shared-trip-page">
          Loading shared itinerary...
        </main>
      }
    >
      <SharedTripContent />
    </Suspense>
  );
}
