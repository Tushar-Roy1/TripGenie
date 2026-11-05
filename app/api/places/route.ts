
import { NextRequest, NextResponse } from "next/server";
import { unstable_rethrow } from "next/navigation";

type GeoapifyFeature = {
  properties?: {
    place_id?: string;
    name?: string;
    categories?: string[];
    formatted?: string;
    address_line1?: string;
    address_line2?: string;
    website?: string;
    opening_hours?: string;
    lat?: number;
    lon?: number;
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

const CATEGORY_LABELS: Record<string, string> = {
  "tourism.attraction": "Tourist Attraction",
  "tourism.sights": "Landmark",
  "entertainment.museum": "Museum",
  "entertainment.culture": "Cultural Site",
  "building.historic": "Historic Building",
  heritage: "Heritage Site",
  "leisure.park": "Park",
};

function getCategory(categories: string[] = []) {
  const priority = [
    "entertainment.museum",
    "building.historic",
    "heritage",
    "tourism.sights",
    "tourism.attraction",
    "entertainment.culture",
    "leisure.park",
  ];

  for (const category of priority) {
    if (categories.includes(category)) {
      return CATEGORY_LABELS[category];
    }
  }

  return "Tourist Attraction";
}

function getAttractionScore(category: string) {
  const scores: Record<string, number> = {
    Landmark: 5,
    Museum: 4,
    "Heritage Site": 4,
    "Historic Building": 3,
    "Cultural Site": 3,
    "Tourist Attraction": 2,
    Park: 1,
  };

  return scores[category] ?? 0;
}

function isUsefulAttraction(name: string) {
  const cleanedName = name.trim();

  if (!cleanedName || cleanedName.length < 3) {
    return false;
  }

  if (/^PA[_-]?\d+$/i.test(cleanedName)) {
    return false;
  }

  const unwantedNames = [
    "unknown",
    "unnamed",
    "attraction",
    "tourism",
    "point of interest",
  ];

  return !unwantedNames.includes(cleanedName.toLowerCase());
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const lat = Number(searchParams.get("lat"));
    const lon = Number(searchParams.get("lon"));

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      return NextResponse.json(
        { error: "Valid latitude and longitude are required." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEOAPIFY_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Geoapify API key is not configured." },
        { status: 500 }
      );
    }

    const params = new URLSearchParams({
      categories: [
        "tourism.attraction",
        "tourism.sights",
        "entertainment.museum",
        "entertainment.culture",
        "building.historic",
        "heritage",
        "leisure.park",
      ].join(","),
      filter: `circle:${lon},${lat},5000`,
      bias: `proximity:${lon},${lat}`,
      limit: "50",
      apiKey,
    });

    const response = await fetch(
      `https://api.geoapify.com/v2/places?${params.toString()}`,
      {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.error("Geoapify status:", response.status);

      throw new Error(
        `Geoapify returned ${response.status}`
      );
    }

    const data: {
      features?: GeoapifyFeature[];
    } = await response.json();

    const seen = new Set<string>();

    const attractions = (data.features ?? [])
      .map((feature) => {
        const properties = feature.properties;
        const coordinates = feature.geometry?.coordinates;

        if (
          !properties?.place_id ||
          !properties.name ||
          !coordinates ||
          coordinates.length < 2
        ) {
          return null;
        }

        const name = properties.name.trim();

        if (!isUsefulAttraction(name)) {
          return null;
        }

        const [longitude, latitude] = coordinates;

        if (
          !Number.isFinite(latitude) ||
          !Number.isFinite(longitude)
        ) {
          return null;
        }

        const uniqueKey = properties.place_id;

        if (seen.has(uniqueKey)) {
          return null;
        }

        seen.add(uniqueKey);

        const category = getCategory(properties.categories);

        // Use the formatted address when available.
        // Otherwise combine the available address lines.
        const address =
          properties.formatted ||
          [
            properties.address_line1,
            properties.address_line2,
          ]
            .filter(Boolean)
            .join(", ");

        return {
          id: properties.place_id,
          name,
          position: [latitude, longitude] as [
            number,
            number
          ],
          category,
          address: address || null,
          website: properties.website || null,
          openingHours: properties.opening_hours || null,
          score: getAttractionScore(category),
        };
      })
      .filter(
        (place): place is NonNullable<typeof place> =>
          place !== null
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map(({ score, ...place }) => place);

    return NextResponse.json({
      attractions,
      count: attractions.length,
    });
  } catch (error) {
  unstable_rethrow(error);

  console.error("Places API error:", error);

  return NextResponse.json(
    { error: "Unable to fetch attractions right now." },
    { status: 502 }
  );
}
}
