import React from 'react';
import '../styles/Loading.css';

export const Spinner = ({ size = 'medium', color = 'primary' }) => {
  return (
    <div className={`spinner spinner-${size} spinner-${color}`}>
      <div className="spinner-circle"></div>
    </div>
  );
};

export const LoadingOverlay = ({ message = 'Завантаження...' }) => {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <Spinner size="large" />
        <p>{message}</p>
      </div>
    </div>
  );
};

export const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton skeleton-title"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-text"></div>
      <div className="skeleton skeleton-button"></div>
    </div>
  );
};

export const SkeletonList = ({ count = 3 }) => {
  return (
    <div className="skeleton-list">
      {[...Array(count)].map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
};

export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="skeleton-table">
      {[...Array(rows)].map((_, index) => (
        <div key={index} className="skeleton-table-row">
          <div className="skeleton skeleton-cell"></div>
          <div className="skeleton skeleton-cell"></div>
          <div className="skeleton skeleton-cell"></div>
        </div>
      ))}
    </div>
  );
};

export const ButtonLoading = ({ children, loading, ...props }) => {
  return (
    <button {...props} disabled={loading || props.disabled}>
      {loading ? (
        <>
          <Spinner size="small" color="white" />
          <span style={{ marginLeft: '0.5rem' }}>Завантаження...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Spinner;
