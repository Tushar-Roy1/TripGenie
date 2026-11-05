
"use client";

import { useState } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Wallet,
  Trash2,
  Plus,
  CheckCircle2,
} from "lucide-react";
import {
  mockItinerary,
  type Activity,
  type TripDay,
} from "@/lib/mock-itinerary";

type ItineraryResultsProps = {
  destination: string;
  currency: string;
  budget: number;
};

export default function ItineraryResults({
  destination,
  currency,
  budget,
}: ItineraryResultsProps) {
  const [days, setDays] = useState<TripDay[]>(mockItinerary);
  const [activeDay, setActiveDay] = useState(1);

  const day = days.find((item) => item.day === activeDay);
  const allActivities = days.flatMap((item) => item.activities);
  const estimatedCost = allActivities.reduce(
    (total, activity) => total + activity.estimatedCost,
    0
  );

  function removeActivity(activityId: string) {
    setDays((current) =>
      current.map((item) => ({
        ...item,
        activities: item.activities.filter(
          (activity) => activity.id !== activityId
        ),
      }))
    );
  }

  function addActivity() {
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      time: "16:00",
      name: "New activity",
      category: "Custom",
      description: "Edit this activity to personalize your trip.",
      duration: "1 hour",
      estimatedCost: 0,
      location: destination,
    };

    setDays((current) =>
      current.map((item) =>
        item.day === activeDay
          ? { ...item, activities: [...item.activities, newActivity] }
          : item
      )
    );
  }

  if (!day) return null;

  return (
    <section className="itinerary-results">
      <header className="itinerary-header">
        <div>
          <p className="itinerary-eyebrow">YOUR PERSONALIZED ADVENTURE</p>
          <h2>{destination} Explorer</h2>
          <p>Explore your day-by-day plan and customize it as you go.</p>
        </div>
        <span className="draft-badge">Sample itinerary</span>
      </header>

      <div className="itinerary-summary">
        <div>
          <CalendarDays size={19} />
          <span>{days.length} days</span>
        </div>
        <div>
          <Wallet size={19} />
          <span>
            {currency} {estimatedCost} sample activity costs
          </span>
        </div>
        <div>
          <CheckCircle2 size={19} />
          <span>
            {budget >= estimatedCost
              ? "Within activity-cost limit"
              : "Activity costs exceed limit"}
          </span>
        </div>
      </div>

      <div className="day-tabs">
        {days.map((item) => (
          <button
            key={item.day}
            type="button"
            className={activeDay === item.day ? "day-tab active" : "day-tab"}
            onClick={() => setActiveDay(item.day)}
          >
            <span>Day {item.day}</span>
            <small>{item.title}</small>
          </button>
        ))}
      </div>

      <div className="itinerary-day">
        <div className="day-heading">
          <div>
            <p>DAY {day.day}</p>
            <h3>{day.title}</h3>
          </div>
          <button className="add-activity" onClick={addActivity} type="button">
            <Plus size={16} />
            Add activity
          </button>
        </div>

        {day.activities.length === 0 ? (
          <p className="empty-day">No activities yet. Add one to get started.</p>
        ) : (
          <div className="activity-list">
            {day.activities.map((activity) => (
              <article className="activity-card" key={activity.id}>
                <div className="activity-time">
                  <Clock size={15} />
                  {activity.time}
                </div>

                <div className="activity-marker" />

                <div className="activity-content">
                  <div className="activity-topline">
                    <span className="activity-category">
                      {activity.category}
                    </span>
                    <button
                      className="remove-activity"
                      type="button"
                      aria-label={`Remove ${activity.name}`}
                      onClick={() => removeActivity(activity.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h4>{activity.name}</h4>
                  <p>{activity.description}</p>

                  <div className="activity-meta">
                    <span>
                      <MapPin size={14} />
                      {activity.location}
                    </span>
                    <span>
                      <Clock size={14} />
                      {activity.duration}
                    </span>
                    <span>
                      <Wallet size={14} />
                      {currency} {activity.estimatedCost}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <p className="sample-disclaimer">
        Sample data only. Places, routes, and costs are not verified.
      </p>
    </section>
  );
}
