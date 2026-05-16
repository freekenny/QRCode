"use client";

import { useState } from "react";
import VideoUploader from "./components/VideoUploader";
import Timeline from "./components/Timeline";
import ProcessPanel from "./components/ProcessPanel";
import { extractFrames } from "./utils/frameExtractor";
import { clipVideo } from "./utils/ffmpegUtils";
import "./page.css";

export default function Home() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [processStatus, setProcessStatus] = useState<string>("idle");
  const [clippedUrl, setClippedUrl] = useState<string | null>(null);
  const [clippedDuration, setClippedDuration] = useState<number | null>(null);

  const handleVideoSelect = (file: File) => {
    setVideoFile(file);
    setVideoUrl(URL.createObjectURL(file));
    setProcessStatus("idle");
    setTimelineData([]);
    setClippedUrl(null);
    setClippedDuration(null);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, "0");
    const s = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const startAnalysis = async () => {
    if (!videoFile) return;
    setProcessStatus("analyzing");
    
    try {
      // 1. Extract frames
      console.log("Extracting frames...");
      const frames = await extractFrames(videoFile, 5, 20); // every 5s, max 20 frames
      
      // We will enhance the prompt with timestamps
      const prompt = `Analyze these sequential frames from a craft video. The frames correspond to the following timestamps: ${frames.map(f => formatTime(f.time)).join(", ")}.
Identify the "key craft steps" and specifically the final "Finish" or reveal of the project. 
Return a strict JSON array of objects with the following structure:
[
  { "time": "MM:SS", "label": "Step description", "isTarget": false },
  ...
  { "time": "MM:SS", "label": "Finish", "isTarget": true }
]`;

      // 2. Send to Intelligence Agent
      console.log("Sending to Intelligence Agent...");
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, prompt })
      });
      
      const data = await res.json();
      
      if (data.timeline && data.timeline.length > 0) {
        setTimelineData(data.timeline);
        
        const target = data.timeline.find((t: any) => t.isTarget);
        if (target) {
          setProcessStatus("clipping");
          await startClipping(target.time);
        } else {
          setProcessStatus("done"); // No target found
        }
      } else {
        alert("Failed to analyze video properly.");
        setProcessStatus("idle");
      }
    } catch (e) {
      console.error(e);
      alert("Error during analysis");
      setProcessStatus("idle");
    }
  };

  const startClipping = async (startTimeStr: string) => {
    try {
      console.log(`Clipping video at ${startTimeStr}...`);
      const clippedBlob = await clipVideo(videoFile!, startTimeStr, 15);
      
      const url = URL.createObjectURL(clippedBlob);
      setClippedUrl(url);
      const tempVideo = document.createElement('video');
      tempVideo.src = url;
      tempVideo.onloadedmetadata = () => {
        setClippedDuration(tempVideo.duration);
      };
      
      setProcessStatus("uploading");
      await startUpload(clippedBlob);
    } catch (e) {
      console.error(e);
      alert("Error during video clipping");
      setProcessStatus("idle");
    }
  };

  const startUpload = async (videoBlob: Blob) => {
    try {
      console.log("Uploading to YouTube Agent...");
      const formData = new FormData();
      formData.append("video", videoBlob, "highlight.mp4");
      formData.append("title", "Craft Project Highlight");
      formData.append("description", "Automatically extracted craft finish reveal!");

      const res = await fetch("/api/youtube", {
        method: "POST",
        body: formData
      });
      
      const data = await res.json();
      console.log("Upload result:", data);
      
      setProcessStatus("done");
      if (data.url) {
        alert(`Success! Video available at: ${data.url}`);
      }
    } catch (e) {
      console.error(e);
      alert("Error during upload");
      setProcessStatus("done");
    }
  };

  return (
    <main className="container main-layout">
      <header className="header">
        <h1 className="text-gradient">Craft Intelligence</h1>
        <p>AI-powered video analysis, clipping, and publishing.</p>
      </header>

      <div className="grid-layout">
        <div className="left-panel">
          <section className="glass-panel uploader-section">
            <VideoUploader onVideoSelect={handleVideoSelect} videoUrl={videoUrl} />
          </section>

          {videoFile && (
            <section className="glass-panel action-section">
              <ProcessPanel status={processStatus} />
              {processStatus === "idle" && (
                <button className="btn process-btn" onClick={startAnalysis}>
                  Start Magic Extraction ✨
                </button>
              )}
              {clippedUrl && processStatus === "done" && (
                <div style={{ marginTop: '16px', width: '100%' }}>
                  <h3 style={{ marginBottom: '8px', color: 'var(--primary)' }}>Highlight Preview</h3>
                  <video src={clippedUrl} controls style={{ width: '100%', borderRadius: '8px', background: '#000' }} />
                  {clippedDuration !== null && (
                    <p style={{ marginTop: '8px', color: '#94a3b8', fontSize: '0.9rem' }}>
                      Length: {clippedDuration.toFixed(2)} seconds
                    </p>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        <div className="right-panel">
          <section className="glass-panel timeline-section">
            <h2>Extraction Timeline</h2>
            <Timeline data={timelineData} />
          </section>
        </div>
      </div>
    </main>
  );
}
