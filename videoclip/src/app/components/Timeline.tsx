"use client";

import React from "react";

interface TimelineEvent {
  time: string;
  label: string;
  isTarget?: boolean;
}

interface TimelineProps {
  data: TimelineEvent[];
}

export default function Timeline({ data }: TimelineProps) {
  if (!data || data.length === 0) {
    return (
      <div className="empty-timeline">
        <p>Awaiting video analysis...</p>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {data.map((item, index) => (
        <div key={index} className={`timeline-item ${item.isTarget ? "target" : ""}`}>
          <div className="timeline-marker"></div>
          <div className="timeline-content">
            <span className="time">{item.time}</span>
            <span className="label">{item.label}</span>
          </div>
        </div>
      ))}
      <style jsx>{`
        .timeline-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
          padding-left: 8px;
          border-left: 2px solid var(--glass-border);
          margin-left: 12px;
        }
        .empty-timeline {
          padding: 24px;
          text-align: center;
          color: #94a3b8;
          font-style: italic;
        }
        .timeline-item {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(0,0,0,0.2);
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          transition: transform 0.2s ease;
        }
        .timeline-item:hover {
          transform: translateX(4px);
        }
        .timeline-marker {
          position: absolute;
          left: -27px;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: var(--background);
          border: 3px solid #94a3b8;
        }
        .timeline-item.target {
          background: rgba(236, 72, 153, 0.15);
          border: 1px solid rgba(236, 72, 153, 0.3);
        }
        .timeline-item.target .timeline-marker {
          border-color: var(--secondary);
          box-shadow: 0 0 10px var(--secondary);
        }
        .timeline-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .time {
          font-family: var(--font-geist-mono), monospace;
          font-size: 0.85rem;
          color: #cbd5e1;
          font-weight: 600;
        }
        .label {
          font-size: 1rem;
          color: white;
        }
        .timeline-item.target .label {
          color: var(--secondary);
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
