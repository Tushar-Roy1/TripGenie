
export type Activity = {
  id: string;
  time: string;
  name: string;
  category: string;
  description: string;
  duration: string;
  estimatedCost: number;
  location: string;
};

export type TripDay = {
  day: number;
  title: string;
  activities: Activity[];
};

export const mockItinerary: TripDay[] = [
  {
    day: 1,
    title: "Discover the city",
    activities: [
      {
        id: "a1",
        time: "09:00",
        name: "Explore the historic district",
        category: "Culture",
        description: "Walk through historic streets and discover local architecture.",
        duration: "2 hours",
        estimatedCost: 0,
        location: "Historic district",
      },
      {
        id: "a2",
        time: "12:00",
        name: "Local food market",
        category: "Food",
        description: "Try regional dishes and explore local food stalls.",
        duration: "1.5 hours",
        estimatedCost: 15,
        location: "Central market",
      },
      {
        id: "a3",
        time: "15:00",
        name: "City viewpoint",
        category: "Sightseeing",
        description: "Enjoy panoramic views and take photos.",
        duration: "1 hour",
        estimatedCost: 10,
        location: "City viewpoint",
      },
    ],
  },
  {
    day: 2,
    title: "Nature and hidden gems",
    activities: [
      {
        id: "a4",
        time: "08:30",
        name: "Morning nature walk",
        category: "Nature",
        description: "Start the day with a peaceful walk through a green space.",
        duration: "2 hours",
        estimatedCost: 5,
        location: "Nature reserve",
      },
      {
        id: "a5",
        time: "12:00",
        name: "Neighborhood café",
        category: "Food",
        description: "Take a break and sample local coffee and snacks.",
        duration: "1 hour",
        estimatedCost: 12,
        location: "Local neighborhood",
      },
      {
        id: "a6",
        time: "14:30",
        name: "Art and culture museum",
        category: "Culture",
        description: "Explore the city's art, traditions, and history.",
        duration: "2 hours",
        estimatedCost: 18,
        location: "City museum",
      },
    ],
  },
];
