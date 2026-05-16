import { google } from "googleapis";
import { NextResponse } from "next/server";
import { Readable } from "stream";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const videoFile = formData.get("video") as Blob | null;
    const title = formData.get("title") as string | "Craft Finish Highlight";
    const description = formData.get("description") as string | "Amazing craft reveal!";

    if (!videoFile) {
      return NextResponse.json({ error: "No video provided" }, { status: 400 });
    }

    // In a real application, you would use OAuth2 to authenticate a user.
    // Here we'll rely on server-side credentials or require the user to configure them.
    // If not configured, we'll return a simulated success for the sake of the demonstration.
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET || !process.env.YOUTUBE_REFRESH_TOKEN) {
      console.warn("YouTube API credentials not fully configured. Simulating upload success.");
      return NextResponse.json({ 
        videoId: "simulated_id_123", 
        url: "https://youtube.com/watch?v=simulated_id_123",
        message: "Simulated upload (API keys missing)" 
      });
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      "http://localhost:3000/oauth2callback"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
    });

    const youtube = google.youtube({
      version: 'v3',
      auth: oauth2Client,
    });

    const buffer = Buffer.from(await videoFile.arrayBuffer());
    const stream = Readable.from(buffer);

    const res = await youtube.videos.insert({
      part: ['snippet', 'status'],
      requestBody: {
        snippet: {
          title,
          description,
          tags: ['craft', 'diy', 'highlight'],
          categoryId: '22', // People & Blogs
        },
        status: {
          privacyStatus: 'private', // Upload as private for safety
        },
      },
      media: {
        body: stream,
      },
    });

    return NextResponse.json({ 
      videoId: res.data.id,
      url: `https://youtube.com/watch?v=${res.data.id}`,
      message: "Uploaded successfully" 
    });
  } catch (error) {
    console.error("YouTube upload error:", error);
    return NextResponse.json({ error: "Failed to upload to YouTube" }, { status: 500 });
  }
}
