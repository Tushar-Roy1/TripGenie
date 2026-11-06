
"use client";

import { useEffect, useState } from "react";
import {
  MapPin,
  CalendarDays,
  Users,
  Trash2,
  Share2,
  Compass,
  Map,
  Sparkles,
  Plus,
  Menu,
  X,
  FileText,
} from "lucide-react";

type SavedTrip = {
  id: string;
  savedAt: string;
  destination: string;
  startDate: string;
  endDate: string;
  travelers: string;
  budget: string;
  currency: string;
  pace?: string;
};

export default function MyTripsPage() {
  const [trips, setTrips] = useState<SavedTrip[]>([]);
const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  useEffect(() => {
    const savedTrips = JSON.parse(
      localStorage.getItem("tripgenie-saved-trips") || "[]"
    );

    setTrips(savedTrips);
  }, []);


function handleDeleteTrip(id: string) {
  const confirmed = window.confirm(
    "Are you sure you want to delete this saved trip?"
  );

  if (!confirmed) return;

  const updatedTrips = trips.filter((trip) => trip.id !== id);

  localStorage.setItem(
    "tripgenie-saved-trips",
    JSON.stringify(updatedTrips)
  );

  setTrips(updatedTrips);
}


return (
  <main className="app-shell">

    {/* Sidebar */}
    <aside className={`sidebar ${isMobileMenuOpen ? "mobile-open" : ""}`}>

      <button
        type="button"
        className="mobile-sidebar-close"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-label="Close navigation menu"
      >
        <X size={22} />
      </button>

      <a
        className="brand"
        href="/"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span className="brand-icon">
          <Compass size={23} />
        </span>
        <span>TripGenie</span>
      </a>

      <p className="nav-label">WORKSPACE</p>

      <a
        className="nav-item"
        href="/#planner"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Plus size={18} />
        Plan a trip
      </a>

      <a
        className="nav-item active"
        href="/my-trips"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <Map size={18} />
        My trips
      </a>

      <a
        className="nav-item"
        href="/TripGenie_User_Guide_and_Features.pdf"
        target="_blank"
        rel="noopener noreferrer"
      >
        <FileText size={18} />
        User Guide
      </a>

      <a
        className="nav-item"
        href="/#inspiration"
        onClick={() => setIsMobileMenuOpen(false)}
      >
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

    {/* Mobile overlay */}
    {isMobileMenuOpen && (
      <button
        type="button"
        className="mobile-sidebar-overlay"
        onClick={() => setIsMobileMenuOpen(false)}
        aria-label="Close navigation menu"
      />
    )}

    {/* Main content */}
    <section className="main-content">

      <header className="topbar">

        <button
          type="button"
          className="mobile-menu-button"
          onClick={() => setIsMobileMenuOpen(true)}
          aria-label="Open navigation menu"
        >
          <Menu size={24} />
        </button>

        <div>
          <p className="eyebrow">YOUR TRAVEL COLLECTION</p>
          <h1>My Trips</h1>
          <p className="subtitle">
            Your saved travel itineraries in one place.
          </p>
        </div>

      </header>

      <div className="my-trips-page">

        {trips.length === 0 ? (

          <div className="empty-trips">
            <MapPin size={40} />

            <h2>No saved trips yet</h2>

            <p>
              Your next adventure starts here. Create your first
              itinerary and save it for later!
            </p>

            <button
              type="button"
              className="create-first-trip-button"
              onClick={() => {
                window.location.href = "/";
              }}
            >
              <MapPin size={17} />
              Create Your First Trip
            </button>
          </div>

        ) : (

          <div className="my-trips-grid">

            {trips.map((trip) => (

              <div className="my-trip-card" key={trip.id}>

                <h2>{trip.destination}</h2>

                <div className="trip-card-extra">
                  <span>
                    {Math.max(
                      1,
                      Math.round(
                        (new Date(trip.endDate).getTime() -
                          new Date(trip.startDate).getTime()) /
                          (1000 * 60 * 60 * 24)
                      ) + 1
                    )} days trip
                  </span>

                  {trip.pace && <span>{trip.pace} pace</span>}

                  <span>
                    Saved{" "}
                    {new Date(trip.savedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>

                <p>
                  <CalendarDays size={16} />
                  {trip.startDate} – {trip.endDate}
                </p>

                <p>
                  <Users size={16} />
                  {trip.travelers} traveler(s)
                </p>

                <p>
                  Budget: {trip.currency} {trip.budget}
                </p>

                <div className="trip-card-actions">

                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `/?tripId=${trip.id}`;
                    }}
                    className="view-trip-button"
                  >
                    View Trip
                  </button>

                  <button
                    type="button"
                    className="share-trip-button"
                    onClick={async () => {
                      try {
                        const response = await fetch("/api/share", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            tripData: trip,
                          }),
                        });

                        const data = await response.json();

                        if (!response.ok || !data.success) {
                          throw new Error(
                            data.message || "Unable to share trip"
                          );
                        }

                        const shareUrl =
                          `${window.location.origin}${data.shareUrl}`;

                        await navigator.clipboard.writeText(shareUrl);

                        alert("Public trip link copied successfully!");

                      } catch (error) {
                        console.error("Share trip error:", error);

                        alert(
                          error instanceof Error
                            ? error.message
                            : "Unable to share trip. Please try again."
                        );
                      }
                    }}
                  >
                    <Share2 size={16} />
                    Share Trip
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteTrip(trip.id)}
                  >
                    <Trash2 size={16} />
                    Delete Trip
                  </button>

                </div>
              </div>

            ))}

          </div>

        )}

      </div>

    </section>
  </main>
);
}
