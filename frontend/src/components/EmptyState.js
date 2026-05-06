import React from 'react';
import '../styles/EmptyState.css';

export const NoAppointments = ({ onBookNew }) => {
  return (
    <div className="empty-state-container">
      <div className="empty-state-illustration">
        <svg viewBox="0 0 200 200" className="empty-calendar-svg">
          <defs>
            <linearGradient id="calendarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-primary)" />
              <stop offset="100%" stopColor="var(--accent-info)" />
            </linearGradient>
          </defs>

          {/* Calendar base */}
          <rect x="40" y="50" width="120" height="130" rx="10"
                fill="var(--bg-tertiary)" stroke="url(#calendarGradient)" strokeWidth="3"/>

          {/* Calendar header */}
          <rect x="40" y="50" width="120" height="30" rx="10"
                fill="url(#calendarGradient)" opacity="0.8"/>

          {/* Binding rings */}
          <circle cx="65" cy="45" r="5" fill="var(--accent-primary)"/>
          <circle cx="100" cy="45" r="5" fill="var(--accent-primary)"/>
          <circle cx="135" cy="45" r="5" fill="var(--accent-primary)"/>

          {/* Calendar grid */}
          <line x1="55" y1="100" x2="145" y2="100" stroke="var(--border-color)" strokeWidth="2"/>
          <line x1="55" y1="120" x2="145" y2="120" stroke="var(--border-color)" strokeWidth="2"/>
          <line x1="55" y1="140" x2="145" y2="140" stroke="var(--border-color)" strokeWidth="2"/>
          <line x1="55" y1="160" x2="145" y2="160" stroke="var(--border-color)" strokeWidth="2"/>

          {/* Checkmark - animated */}
          <circle cx="100" cy="130" r="25" fill="var(--accent-success-light)"
                  className="check-circle" opacity="0"/>
          <path d="M 90 130 L 97 137 L 110 120" stroke="var(--accent-success)"
                strokeWidth="4" fill="none" strokeLinecap="round"
                className="check-mark" strokeDasharray="30" strokeDashoffset="30"/>
        </svg>

        {/* Floating particles */}
        <div className="floating-particle particle-1"></div>
        <div className="floating-particle particle-2"></div>
        <div className="floating-particle particle-3"></div>
      </div>

      <h3 className="empty-state-title">Записів ще немає</h3>
      <p className="empty-state-description">
        Почніть свій шлях до здоров'я, записавшись на перший прийом
      </p>

      {onBookNew && (
        <button onClick={onBookNew} className="empty-state-cta">
          <span className="cta-icon">📅</span>
          Записатися на прийом
        </button>
      )}
    </div>
  );
};

export const NoSlotsAvailable = ({ selectedDate }) => {
  return (
    <div className="empty-state-container compact">
      <div className="empty-state-illustration small">
        <svg viewBox="0 0 120 120" className="no-slots-svg">
          <defs>
            <linearGradient id="clockGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-warning)" />
              <stop offset="100%" stopColor="var(--accent-danger)" />
            </linearGradient>
          </defs>

          {/* Clock face */}
          <circle cx="60" cy="60" r="40" fill="var(--bg-tertiary)"
                  stroke="url(#clockGradient)" strokeWidth="3"/>

          {/* Clock hands */}
          <line x1="60" y1="60" x2="60" y2="35" stroke="var(--accent-warning)"
                strokeWidth="3" strokeLinecap="round" className="clock-hand-hour"/>
          <line x1="60" y1="60" x2="75" y2="60" stroke="var(--accent-warning)"
                strokeWidth="2" strokeLinecap="round" className="clock-hand-minute"/>

          {/* Center dot */}
          <circle cx="60" cy="60" r="4" fill="var(--accent-warning)"/>

          {/* X mark overlay */}
          <line x1="40" y1="40" x2="80" y2="80" stroke="var(--accent-danger)"
                strokeWidth="4" strokeLinecap="round" className="x-mark"/>
          <line x1="80" y1="40" x2="40" y2="80" stroke="var(--accent-danger)"
                strokeWidth="4" strokeLinecap="round" className="x-mark"/>
        </svg>
      </div>

      <h4 className="empty-state-title small">Всі слоти зайняті</h4>
      <p className="empty-state-description small">
        На {selectedDate} немає вільних слотів
      </p>

      <div className="empty-state-suggestions">
        <div className="suggestion-item">
          <span className="suggestion-icon">📅</span>
          <span>Спробуйте інший день</span>
        </div>
        <div className="suggestion-item">
          <span className="suggestion-icon">⏰</span>
          <span>Перевірте наступний тиждень</span>
        </div>
      </div>
    </div>
  );
};

export const NoSearchResults = ({ onClearFilters }) => {
  return (
    <div className="empty-state-container compact">
      <div className="empty-state-illustration small">
        <svg viewBox="0 0 120 120" className="no-results-svg">
          <defs>
            <linearGradient id="searchGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--accent-info)" />
              <stop offset="100%" stopColor="var(--accent-primary)" />
            </linearGradient>
          </defs>

          {/* Magnifying glass */}
          <circle cx="50" cy="50" r="25" fill="none"
                  stroke="url(#searchGradient)" strokeWidth="4" className="search-circle"/>
          <line x1="68" y1="68" x2="85" y2="85" stroke="url(#searchGradient)"
                strokeWidth="5" strokeLinecap="round" className="search-handle"/>

          {/* Question mark inside */}
          <text x="50" y="60" fontSize="30" fill="var(--accent-primary)"
                textAnchor="middle" fontWeight="bold" className="question-mark">?</text>
        </svg>
      </div>

      <h4 className="empty-state-title small">Нічого не знайдено</h4>
      <p className="empty-state-description small">
        Спробуйте змінити фільтри пошуку
      </p>

      {onClearFilters && (
        <button onClick={onClearFilters} className="empty-state-link">
          Очистити фільтри
        </button>
      )}
    </div>
  );
};
