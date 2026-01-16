import { NextRequest, NextResponse } from "next/server";
import { createWriteClient } from "@/sanity/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const writeClient = createWriteClient();

    // Get the current event to find its ID
    const event = await writeClient.fetch(
      `*[_type == "event" && slug.current == $slug][0]{_id, dislikes}`,
      { slug }
    );

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const currentDislikes = event.dislikes || 0;

    // Increment dislikes
    await writeClient
      .patch(event._id)
      .set({ dislikes: currentDislikes + 1 })
      .commit();

    return NextResponse.json({
      success: true,
      dislikes: currentDislikes + 1,
    });
  } catch (error) {
    console.error("Error disliking event:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to dislike event";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
