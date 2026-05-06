import React from 'react';
import './LoadingSpinner.css';

function LoadingSpinner({ message = 'Завантаження...', size = 'medium', fullScreen = false }) {
  const sizeClass = `spinner-${size}`;

  if (fullScreen) {
    return (
      <div className="loading-overlay">
        <div className="loading-container">
          <div className={`spinner ${sizeClass}`}>
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
            <div className="spinner-circle"></div>
          </div>
          <p className="loading-message">{message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="loading-inline">
      <div className={`spinner ${sizeClass}`}>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>
      {message && <p className="loading-message">{message}</p>}
    </div>
  );
}

export default LoadingSpinner;
