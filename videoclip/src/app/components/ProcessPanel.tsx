"use client";

import React from "react";

interface ProcessPanelProps {
  status: string;
}

export default function ProcessPanel({ status }: ProcessPanelProps) {
  if (status === "idle") return null;

  const steps = [
    { id: "analyzing", label: "Agent Analysis", desc: "Extracting key craft steps..." },
    { id: "clipping", label: "Video Worker", desc: "Slicing the final 'Finish' moment..." },
    { id: "uploading", label: "YouTube Agent", desc: "Publishing the highlight..." },
    { id: "done", label: "Complete!", desc: "The clip has been processed." }
  ];

  const currentIndex = steps.findIndex(s => s.id === status) !== -1 ? steps.findIndex(s => s.id === status) : steps.length - 1;

  return (
    <div className="process-panel w-100">
      <h3 className="mb-4">Processing Pipeline</h3>
      <div className="steps-container">
        {steps.map((step, index) => {
          const isActive = index === currentIndex;
          const isPast = index < currentIndex;
          
          return (
            <div key={step.id} className={`step-item ${isActive ? "active" : ""} ${isPast ? "past" : ""}`}>
              <div className="step-icon">
                {isActive && status !== "done" ? (
                  <div className="spinner"></div>
                ) : isPast || step.id === "done" && status === "done" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="check-icon">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                ) : (
                  <div className="circle"></div>
                )}
              </div>
              <div className="step-content">
                <div className="step-label">{step.label}</div>
                <div className="step-desc">{step.desc}</div>
              </div>
            </div>
          );
        })}
      </div>
      <style jsx>{`
        .w-100 { width: 100%; }
        .mb-4 { margin-bottom: 16px; color: white; }
        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .step-item {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          opacity: 0.5;
          transition: all 0.3s ease;
        }
        .step-item.active, .step-item.past {
          opacity: 1;
        }
        .step-icon {
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .circle {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: #475569;
        }
        .check-icon {
          color: #10b981;
        }
        .step-item.active .step-icon {
          color: var(--primary);
        }
        .step-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .step-label {
          font-weight: 600;
          color: white;
          font-size: 1rem;
        }
        .step-item.active .step-label {
          color: var(--primary);
        }
        .step-desc {
          font-size: 0.85rem;
          color: #94a3b8;
        }
      `}</style>
    </div>
  );
}
