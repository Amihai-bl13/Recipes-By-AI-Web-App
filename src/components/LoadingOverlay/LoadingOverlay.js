// LoadingOverlay.js
import React from 'react';
import './LoadingOverlay.css';

export default function LoadingOverlay() {
  return (
    <div className="loading-overlay">
      <div className="loading-modal">
        <div className="loader" />
        <p className="loading-text">Crafting your perfect recipe...</p>
        <p className="loading-subtext">This may take a moment</p>
      </div>
    </div>
  );
}
