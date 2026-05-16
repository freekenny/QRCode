"use client";

import React, { useRef, useState } from "react";

interface VideoUploaderProps {
  onVideoSelect: (file: File) => void;
  videoUrl: string | null;
}

export default function VideoUploader({ onVideoSelect, videoUrl }: VideoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("video/")) {
        onVideoSelect(file);
      } else {
        alert("Please upload a valid video file.");
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onVideoSelect(e.target.files[0]);
    }
  };

  return (
    <div className="uploader-container">
      {!videoUrl ? (
        <div
          className={`drop-zone ${isDragging ? "dragging" : ""}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="drop-content">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="upload-icon">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drag & drop your craft video here</p>
            <span className="text-sm">or click to browse</span>
          </div>
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      ) : (
        <div className="video-preview-container">
          <video
            src={videoUrl}
            controls
            className="video-preview"
          />
          <button className="btn btn-secondary mt-4" onClick={() => fileInputRef.current?.click()}>
            Change Video
          </button>
          <input
            type="file"
            accept="video/*"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
        </div>
      )}
      <style jsx>{`
        .uploader-container {
          width: 100%;
        }
        .drop-zone {
          border: 2px dashed var(--glass-border);
          border-radius: var(--radius-md);
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background: rgba(0,0,0,0.2);
        }
        .drop-zone.dragging {
          border-color: var(--primary);
          background: rgba(139, 92, 246, 0.1);
        }
        .drop-zone:hover {
          border-color: var(--primary-hover);
        }
        .drop-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }
        .upload-icon {
          color: var(--primary);
          margin-bottom: 8px;
        }
        .text-sm {
          font-size: 0.875rem;
          color: #94a3b8;
        }
        .video-preview-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
        }
        .video-preview {
          width: 100%;
          max-height: 400px;
          border-radius: var(--radius-md);
          background: #000;
        }
        .mt-4 {
          margin-top: 16px;
        }
      `}</style>
    </div>
  );
}
