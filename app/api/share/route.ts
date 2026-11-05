
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import connectDB from "@/lib/mongodb";
import SharedTrip from "@/models/SharedTrip";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tripData } = body;

    if (!tripData || !tripData.destination) {
      return NextResponse.json(
        { success: false, message: "Invalid trip data" },
        { status: 400 }
      );
    }

    await connectDB();

    const shareId = randomUUID();

    await SharedTrip.create({
      shareId,
      tripData,
    });

    return NextResponse.json({
      success: true,
      shareId,
      shareUrl: `/share/${shareId}`,
    });
  } catch (error) {
    console.error("Share API error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to share itinerary" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json(
        { success: false, message: "Share ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const sharedTrip = await SharedTrip.findOne({
      shareId,
    }).lean();

    if (!sharedTrip) {
      return NextResponse.json(
        { success: false, message: "Shared trip not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tripData: sharedTrip.tripData,
    });
  } catch (error) {
    console.error("Get shared trip error:", error);

    return NextResponse.json(
      { success: false, message: "Unable to retrieve shared trip" },
      { status: 500 }
    );
  }
}
