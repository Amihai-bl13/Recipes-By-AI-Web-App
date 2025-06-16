import React from 'react';
import './LoadingOverlay.css';

export default function LoadingOverlay({ text = "Crafting your perfect recipe...", subtext = "This may take a moment" }) {
  return (
    <div className="loading-overlay">
      <div className="loading-modal">
        <div className="loader" />
        <p className="loading-text">{text}</p>
        <p className="loading-subtext">{subtext}</p>
      </div>
    </div>
  );
}