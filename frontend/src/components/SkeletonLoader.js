import React from 'react';
import '../styles/SkeletonLoader.css';

export const SlotSkeleton = () => {
  return (
    <div className="slot-skeleton">
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export const AppointmentCardSkeleton = () => {
  return (
    <div className="appointment-card-skeleton">
      <div className="skeleton-header">
        <div className="skeleton-line skeleton-title"></div>
        <div className="skeleton-line skeleton-date"></div>
      </div>
      <div className="skeleton-body">
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text short"></div>
      </div>
      <div className="skeleton-footer">
        <div className="skeleton-button"></div>
      </div>
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export const SummaryCardSkeleton = () => {
  return (
    <div className="summary-card-skeleton">
      <div className="skeleton-icon"></div>
      <div className="skeleton-line skeleton-label"></div>
      <div className="skeleton-line skeleton-value"></div>
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export const TableRowSkeleton = () => {
  return (
    <div className="table-row-skeleton">
      <div className="skeleton-section">
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text short"></div>
        <div className="skeleton-line skeleton-text"></div>
      </div>
      <div className="skeleton-section">
        <div className="skeleton-line skeleton-text"></div>
        <div className="skeleton-line skeleton-text short"></div>
      </div>
      <div className="skeleton-shimmer"></div>
    </div>
  );
};

export const CalendarSkeleton = () => {
  return (
    <div className="calendar-skeleton">
      <div className="skeleton-calendar-header">
        <div className="skeleton-line skeleton-month"></div>
      </div>
      <div className="skeleton-calendar-grid">
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="skeleton-calendar-day"></div>
        ))}
      </div>
      <div className="skeleton-shimmer"></div>
    </div>
  );
};
