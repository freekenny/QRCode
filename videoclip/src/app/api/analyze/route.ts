import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

// We expect base64 encoded images from the frontend to analyze
export async function POST(request: Request) {
  try {
    const { frames, prompt } = await request.json();
    
    if (!frames || frames.length === 0) {
      return NextResponse.json({ error: "No frames provided" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Prepare the parts for the prompt
    // Each frame is expected to be a base64 string
    const parts = frames.map((frame: { inlineData: { data: string; mimeType: string } }) => ({
      inlineData: {
        data: frame.inlineData.data,
        mimeType: frame.inlineData.mimeType,
      }
    }));
    
    parts.push({ text: prompt || `Analyze these sequential frames from a craft video. Identify the "key craft steps" and specifically the final "Finish" or reveal of the project. 
    Return a JSON array of objects with the following structure:
    [
      { "time": "MM:SS", "label": "Step description", "isTarget": false },
      ...
      { "time": "MM:SS", "label": "Finish", "isTarget": true }
    ]
    Ensure you only return valid JSON array.`});

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: parts,
      config: {
        responseMimeType: "application/json",
      }
    });

    const resultText = response.text || "[]";
    let timelineData = [];
    try {
      timelineData = JSON.parse(resultText);
    } catch (e) {
      console.error("Failed to parse Gemini response:", resultText);
      timelineData = [];
    }

    return NextResponse.json({ timeline: timelineData });

  } catch (error) {
    console.error("Error analyzing video:", error);
    return NextResponse.json({ error: "Failed to analyze video" }, { status: 500 });
  }
}
