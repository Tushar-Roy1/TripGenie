
"use client";

import { useState } from "react";
import type { Attraction } from "@/lib/types";
import {
  MapPin,
  CalendarDays,
  Clock3,
  Trash2,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Compass,
} from "lucide-react";

type DayWiseItineraryProps = {
  destination: string;
  startDate: string;
  tripDays: number;
  selectedAttractions: Attraction[];
  dayAssignments: Record<number, string[]>;
  onAssignAttraction: (
    attractionId: string,
    dayIndex: number
  ) => void;
  onRemoveAssignment: (attractionId: string) => void;
  activityTimes: Record<string, string>;
  onSetActivityTime: (
    attractionId: string,
    time: string
  ) => void;
  activityDurations: Record<string, number>;
onSetActivityDuration: (
  attractionId: string,
  duration: number
) => void;
};

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getDayDate(startDate: string, dayIndex: number) {
  const [year, month, day] = startDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + dayIndex);
  return formatDate(date);
}

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

export default function DayWiseItinerary({
  destination,
  startDate,
  tripDays,
  selectedAttractions,
  dayAssignments,
  onAssignAttraction,
  onRemoveAssignment,
  activityTimes,
  onSetActivityTime,
  activityDurations,
  onSetActivityDuration,
}: DayWiseItineraryProps) {
  const [activeDay, setActiveDay] = useState(0);

  if (!startDate || tripDays <= 0) return null;

  const days = Array.from(
    { length: tripDays },
    (_, index) => index
  );

  const assignedIds = dayAssignments[activeDay] || [];


const assignedAttractions = assignedIds
  .map((id) =>
    selectedAttractions.find((place) => place.id === id)
  )
  .filter(
    (place): place is Attraction => place !== undefined
  )
  .sort((a, b) => {
    return (
      convertTimeToMinutes(activityTimes[a.id] || "") -
      convertTimeToMinutes(activityTimes[b.id] || "")
    );
  });
const hasScheduleConflict = (
  candidatePlaceId: string,
  candidateStartTime: string,
  candidateDuration: number
) => {
  if (!candidateStartTime) return false;

  const candidateStart =
    convertTimeToMinutes(candidateStartTime);

  const candidateEnd =
    candidateStart + candidateDuration;

  const bufferMinutes = 30;

  return assignedAttractions.some((otherPlace) => {
    if (otherPlace.id === candidatePlaceId) {
      return false;
    }

    const otherStartTime = activityTimes[otherPlace.id];

    if (!otherStartTime) return false;

    const otherStart =
      convertTimeToMinutes(otherStartTime);

    // Assume 1 hour until the user selects a duration.
    const otherDuration =
      activityDurations[otherPlace.id] || 60;

    const otherEnd = otherStart + otherDuration;

    return (
      candidateStart < otherEnd + bufferMinutes &&
      candidateEnd + bufferMinutes > otherStart
    );
  });
};
const scheduledAttractions = assignedAttractions.filter(
  (place) =>
    activityTimes[place.id] &&
    activityDurations[place.id] > 0
);

const totalVisitMinutes = scheduledAttractions.reduce(
  (total, place) =>
    total + activityDurations[place.id],
  0
);

// Minimum 30-minute buffer allowance between activities
const bufferMinutes =
  Math.max(0, scheduledAttractions.length - 1) * 30;

const totalVisitHours = Math.floor(totalVisitMinutes / 60);
const remainingVisitMinutes = totalVisitMinutes % 60;

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours} hr`;

  return `${hours} hr ${mins} min`;
};
// Daily free-time calculation
const dailyAvailableMinutes = 12 * 60;

const remainingFreeMinutes = Math.max(
  0,
  dailyAvailableMinutes -
    totalVisitMinutes -
    bufferMinutes
);

const remainingFreeTime = formatDuration(
  remainingFreeMinutes
);
// Smart itinerary validation

const unscheduledCount = assignedAttractions.filter(
  (place) =>
    !activityTimes[place.id] ||
    !activityDurations[place.id]
).length;

const exceedsDailyLimit =
  totalVisitMinutes + bufferMinutes >
  dailyAvailableMinutes;

const hasOverlappingActivities =
  assignedAttractions.some((place, index) => {
    const startTime = activityTimes[place.id];

    if (!startTime || !activityDurations[place.id]) {
      return false;
    }

    const start = convertTimeToMinutes(startTime);
    const end = start + activityDurations[place.id];

    return assignedAttractions.some((otherPlace) => {
      if (otherPlace.id === place.id) return false;

      const otherStartTime = activityTimes[otherPlace.id];

      if (
        !otherStartTime ||
        !activityDurations[otherPlace.id]
      ) {
        return false;
      }

      const otherStart =
        convertTimeToMinutes(otherStartTime);

      const otherEnd =
        otherStart + activityDurations[otherPlace.id];

      return (
        start < otherEnd + 30 &&
        end + 30 > otherStart
      );
    });
  });
  function getAssignedDay(attractionId: string) {
    for (const [dayIndex, attractionIds] of Object.entries(
      dayAssignments
    )) {
      if (attractionIds.includes(attractionId)) {
        return Number(dayIndex);
      }
    }

    return "";
  }

  const totalAssigned = Object.values(dayAssignments)
    .reduce((total, ids) => total + ids.length, 0);

  const unassignedCount =
    selectedAttractions.length - totalAssigned;

  return (
    <section className="day-itinerary">

      {/* Header */}
      <div className="day-itinerary-header">
        <div>
          <span className="day-itinerary-label">
            <Sparkles size={14} />
            YOUR TRAVEL PLAN
          </span>

          <h2>{destination} Itinerary</h2>

          <p>
            Organize your discoveries and build your perfect trip.
          </p>
        </div>

        <div className="day-count">
          <CalendarDays size={17} />
          {tripDays} Days
        </div>
      </div>

      {/* Summary */}
      <div className="itinerary-stats">
        <div className="itinerary-stat">
          <span className="itinerary-stat-icon">
            <Compass size={19} />
          </span>
          <div>
            <strong>{selectedAttractions.length}</strong>
            <span>Selected places</span>
          </div>
        </div>

        <div className="itinerary-stat">
          <span className="itinerary-stat-icon">
            <CheckCircle2 size={19} />
          </span>
          <div>
            <strong>{totalAssigned}</strong>
            <span>Scheduled places</span>
          </div>
        </div>

        <div className="itinerary-stat">
          <span className="itinerary-stat-icon">
            <Clock3 size={19} />
          </span>
          <div>
            <strong>{unassignedCount}</strong>
            <span>Awaiting schedule</span>
          </div>
        </div>
      </div>

      {/* Day navigation */}
      <div className="day-navigation">
        <div className="day-navigation-heading">
          <h3>Your travel days</h3>
          <span>Select a day to view its activities</span>
        </div>

        <div className="day-tabs">
          {days.map((dayIndex) => {
            const count =
              dayAssignments[dayIndex]?.length || 0;

            return (
              <button
                type="button"
                key={dayIndex}
                className={`day-tab ${
                  activeDay === dayIndex ? "active" : ""
                }`}
                onClick={() => setActiveDay(dayIndex)}
              >
                <span className="day-tab-number">
                  {dayIndex + 1}
                </span>

                <span className="day-tab-content">
                  <strong>Day {dayIndex + 1}</strong>
                  <small>
                    {getDayDate(startDate, dayIndex)}
                  </small>
                  <span className="day-tab-count">
                    {count} {count === 1 ? "place" : "places"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected day */}
      <div className="active-day-panel">

        <div className="active-day-heading">
          <div>
            <span className="active-day-label">
              DAY {activeDay + 1}
            </span>

            <h3>Explore {destination}</h3>

            <p>{getDayDate(startDate, activeDay)}</p>
          </div>

          <span className="active-day-count">
            {assignedAttractions.length} activities
          </span>
        </div>



{/* Daily Schedule Summary */}
<div className="daily-summary">

  {/* Scheduled activities */}
  <div className="daily-summary-card">
    <span className="daily-summary-icon">
      <MapPin size={19} />
    </span>
    <div>
      <strong>{scheduledAttractions.length}</strong>
      <span>Scheduled activities</span>
    </div>
  </div>

  {/* Sightseeing time */}
  <div className="daily-summary-card">
    <span className="daily-summary-icon">
      <Clock3 size={19} />
    </span>
    <div>
      <strong>{formatDuration(totalVisitMinutes)}</strong>
      <span>Sightseeing time</span>
    </div>
  </div>

  {/* Buffer allowance */}
  <div className="daily-summary-card">
    <span className="daily-summary-icon">
      <CalendarDays size={19} />
    </span>
    <div>
      <strong>{formatDuration(bufferMinutes)}</strong>
      <span>Buffer allowance</span>
    </div>
  </div>

  {/* Remaining free time */}
  <div className="daily-summary-card">
    <span className="daily-summary-icon">
      <CalendarDays size={19} />
    </span>
    <div>
      <strong>{remainingFreeTime}</strong>
      <span>Remaining free time</span>
    </div>
  </div>

</div>

{/* Smart Schedule Warnings */}
<div className="schedule-validation">

  {hasOverlappingActivities && (
    <div className="schedule-warning error">
      <Clock3 size={18} />
      <div>
        <strong>Scheduling conflict detected</strong>
        <p>
          Some activities overlap or don't have enough
          30-minute buffer time.
        </p>
      </div>
    </div>
  )}


{unscheduledCount > 0 && (
  <div className="schedule-warning notice">
    <div className="schedule-warning-icon">
      <CalendarDays size={20} />
    </div>

    <div className="schedule-warning-content">
      <strong>Incomplete schedule</strong>
      <p>
        {unscheduledCount}{" "}
        {unscheduledCount === 1
          ? "activity needs"
          : "activities need"}{" "}
        a visit time and duration.
      </p>
    </div>

    <span className="schedule-warning-badge">
      Action needed
    </span>
  </div>
)}


  {exceedsDailyLimit && (
    <div className="schedule-warning error">
      <Clock3 size={18} />
      <div>
        <strong>Daily planning limit exceeded</strong>
        <p>
          Your sightseeing and buffer allowance exceed
          the 12-hour daily planning window.
        </p>
      </div>
    </div>
  )}

 {!hasOverlappingActivities &&
  unscheduledCount === 0 &&
  !exceedsDailyLimit &&
  assignedAttractions.length > 0 && (
    <div className="schedule-warning notice success">
      <div className="schedule-warning-icon">
        <CheckCircle2 size={20} />
      </div>

      <div className="schedule-warning-content">
        <strong>Your schedule looks good!</strong>
        <p>
          All activities are scheduled with sufficient
          buffer time.
        </p>
      </div>

      <span className="schedule-warning-badge">
        All good
      </span>
    </div>
  )}

</div>



        {/* Activities */}
        {assignedAttractions.length > 0 ? (
          <div className="day-activities">
           
{assignedAttractions.map((place, index) => {
  const startTime = activityTimes[place.id];
  const duration = activityDurations[place.id];

  const endTime =
    startTime && duration
      ? formatMinutesToTime(
          convertTimeToMinutes(startTime) + duration
        )
      : null;

  return (
    <article
      className="day-activity-card"
      key={place.id}
    >
      <div className="activity-timeline">
        <span className="activity-timeline-dot">
          {index + 1}
        </span>

        {index !== assignedAttractions.length - 1 && (
          <span className="activity-timeline-line" />
        )}
      </div>

      <div className="activity-card-content">
        <div className="activity-card-top">
          <div className="activity-scheduled-time">
            <Clock3 size={15} />

            <span>
              {startTime || "Unscheduled"}
              {endTime && ` – ${endTime}`}
            </span>
          </div>

          <span className="activity-category">
            {place.category}
          </span>

          <span className="activity-number">
            PLACE {index + 1}
          </span>
        </div>

        <h4>{place.name}</h4>

        <div className="activity-location">
          <MapPin size={15} />
          <span>
            {place.address || place.category}
          </span>
        </div>

      
<div className="activity-card-actions">
  {/* Visit time */}
  <div className="activity-control-group">
    <label className="move-activity-label">
      <Clock3 size={15} />
      Visit time
    </label>

    <select
      aria-label={`Choose visit time for ${place.name}`}
      value={activityTimes[place.id] || ""}
      onChange={(e) =>
        onSetActivityTime(place.id, e.target.value)
      }
    >
      <option value="">Choose time</option>

      {[
        "09:00 AM",
        "11:00 AM",
        "12:00 PM",
        "12:30 PM",
        "01:00 PM",
        "02:00 PM",
        "03:00 PM",
        "04:00 PM",
        "05:00 PM",
        "06:00 PM",
        "07:00 PM",
      ].map((time) => {
        const hasConflict =
          activityTimes[place.id] !== time &&
          hasScheduleConflict(
            place.id,
            time,
            activityDurations[place.id] || 60
          );

        return (
          <option
            key={time}
            value={time}
            disabled={hasConflict}
          >
            {time}
            {hasConflict ? " (Schedule conflict)" : ""}
          </option>
        );
      })}
    </select>
  </div>

  {/* Visit duration */}
  <div className="activity-control-group">
    <label className="move-activity-label">
      <Clock3 size={15} />
      Visit duration
    </label>

    <select
      aria-label={`Choose visit duration for ${place.name}`}
      value={activityDurations[place.id] || ""}
      onChange={(e) =>
        onSetActivityDuration(
          place.id,
          Number(e.target.value)
        )
      }
    >
      <option value="">Choose duration</option>

      {[
        { value: 30, label: "30 minutes" },
        { value: 60, label: "1 hour" },
        { value: 90, label: "1.5 hours" },
        { value: 120, label: "2 hours" },
        { value: 180, label: "3 hours" },
      ].map((option) => {
        const hasConflict =
          activityTimes[place.id] &&
          activityDurations[place.id] !== option.value &&
          hasScheduleConflict(
            place.id,
            activityTimes[place.id],
            option.value
          );

        return (
          <option
            key={option.value}
            value={option.value}
            disabled={Boolean(hasConflict)}
          >
            {option.label}
            {hasConflict ? " (Schedule conflict)" : ""}
          </option>
        );
      })}
    </select>
  </div>

  {/* Move to another day */}
  <div className="activity-control-group">
    <label className="move-activity-label">
      <ArrowRight size={15} />
      Move to
    </label>

    <select
      aria-label={`Move ${place.name} to another day`}
      value={activeDay}
      onChange={(e) =>
        onAssignAttraction(
          place.id,
          Number(e.target.value)
        )
      }
    >
      {days.map((dayIndex) => (
        <option key={dayIndex} value={dayIndex}>
          Day {dayIndex + 1}
        </option>
      ))}
    </select>
  </div>

  {/* Remove activity */}
  <button
    type="button"
    className="remove-activity-button"
    onClick={() => onRemoveAssignment(place.id)}
    aria-label={`Remove ${place.name} from this day`}
    title="Remove from this day"
  >
    <Trash2 size={16} />
  </button>
</div>

      </div>
    </article>
  );
})}

          </div>
        ) : (
          <div className="day-empty-state">
            <span className="day-empty-icon">
              <MapPin size={24} />
            </span>

            <h4>No activities planned yet</h4>

            <p>
              Add attractions from your selected places below
              to build this day's itinerary.
            </p>
          </div>
        )}
      </div>

      {/* Selected attractions */}
      <div className="selected-attractions">
        <div className="selected-attractions-heading">
          <div>
            <span className="day-itinerary-label">
              YOUR COLLECTION
            </span>
            <h3>Selected attractions</h3>
            <p>
              Assign your saved places to different travel days.
            </p>
          </div>

          <span className="selected-count">
            {selectedAttractions.length} places
          </span>
        </div>

        {selectedAttractions.length === 0 ? (
          <div className="no-selected-attractions">
            <Compass size={25} />
            <p>
              No attractions selected yet. Explore the map
              and add places to your collection.
            </p>
          </div>
        ) : (
          <div className="selected-attractions-list">
            {selectedAttractions.map((place, index) => {
              const assignedDay = getAssignedDay(place.id);

              return (
                <div
                  className="selected-attraction-item"
                  key={place.id}
                >
                  <span className="selected-attraction-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  <div className="selected-attraction-info">
                    <strong>{place.name}</strong>
                    <p>{place.category}</p>
                  </div>

                  <div className="assignment-control">
                    <select
                      aria-label={`Assign ${place.name} to a day`}
                      value={assignedDay}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (value === "") {
                          onRemoveAssignment(place.id);
                        } else {
                          onAssignAttraction(
                            place.id,
                            Number(value)
                          );
                        }
                      }}
                    >
                      <option value="">
                        Not scheduled
                      </option>

                      {days.map((dayIndex) => (
                        <option
                          key={dayIndex}
                          value={dayIndex}
                        >
                          Day {dayIndex + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
}
