// app/api/youtube-live/route.ts
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const which = searchParams.get("channel");

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing YOUTUBE_API_KEY" },
        { status: 500 }
      );
    }

    let channelId: string | undefined;
    if (which === "puttady") {
      channelId = process.env.YOUTUBE_CHANNEL_PUTTADY_ID;
    } else if (which === "bodi") {
      channelId = process.env.YOUTUBE_CHANNEL_BODI_ID;
    } else {
      return NextResponse.json(
        { error: "Invalid channel parameter" },
        { status: 400 }
      );
    }

    if (!channelId) {
      return NextResponse.json(
        { error: "Channel ID not configured" },
        { status: 500 }
      );
    }

    const url = new URL("https://www.googleapis.com/youtube/v3/search");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("channelId", channelId);
    url.searchParams.set("eventType", "live");
    url.searchParams.set("type", "video");
    url.searchParams.set("key", apiKey);

    const res = await fetch(url.toString(), { cache: "no-store" });
    if (!res.ok) {
      const text = await res.text();
      console.error("YouTube API error:", text);
      return NextResponse.json(
        { error: "YouTube API request failed" },
        { status: 500 }
      );
    }

    const data = await res.json();

    const items = data.items ?? [];
    if (items.length === 0) {
      // no live video
      return NextResponse.json({ live: false });
    }

    const item = items[0];
    const videoId = item.id?.videoId ?? null;
    const title = item.snippet?.title ?? null;

    return NextResponse.json({
      live: !!videoId,
      videoId,
      title,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
