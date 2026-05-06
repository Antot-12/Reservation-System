import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../styles/CalendarFeed.css';

const CalendarFeed = ({ userPhone }) => {
  const [feedUrl, setFeedUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  const generateFeed = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/calendar/feed/generate?phone=${userPhone}`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        setFeedUrl(data.feed_url);
        toast.success('Посилання на календар створено');
      } else {
        toast.error('Помилка створення посилання');
      }
    } catch (error) {
      toast.error('Помилка створення посилання');
    } finally {
      setLoading(false);
    }
  };

  const copyFeedUrl = () => {
    if (feedUrl) {
      navigator.clipboard.writeText(feedUrl);
      toast.success('Посилання скопійовано');
    }
  };

  const revokeFeed = async () => {
    if (!window.confirm('Ви впевнені? Поточне посилання стане недійсним.')) {
      return;
    }

    try {
      const response = await fetch(
        `/api/v1/calendar/feed/revoke?phone=${userPhone}`,
        { method: 'DELETE' }
      );

      if (response.ok) {
        setFeedUrl(null);
        toast.success('Доступ скасовано');
      } else {
        toast.error('Помилка скасування');
      }
    } catch (error) {
      toast.error('Помилка скасування');
    }
  };

  return (
    <div className="calendar-feed">
      <div className="calendar-feed-header">
        <h3>📆 Підписка на календар</h3>
        <p>
          Підпишіться на свій календар записів для автоматичного оновлення в
          Google Calendar, Apple Calendar, Outlook та інших
        </p>
      </div>

      {!feedUrl ? (
        <button
          className="btn-generate-feed"
          onClick={generateFeed}
          disabled={loading}
        >
          {loading ? 'Створення...' : 'Створити підписку на календар'}
        </button>
      ) : (
        <div className="feed-content">
          <div className="feed-url-box">
            <label>Посилання на календар:</label>
            <div className="feed-url-display">
              <input
                type="text"
                value={feedUrl}
                readOnly
                className="feed-url-input"
              />
              <button onClick={copyFeedUrl} className="btn-copy">
                📋 Копіювати
              </button>
            </div>
          </div>

          <div className="feed-actions">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className="btn-instructions"
            >
              {showInstructions ? '▼' : '▶'} Як підписатися
            </button>
            <button onClick={revokeFeed} className="btn-revoke">
              🗑️ Скасувати підписку
            </button>
          </div>

          {showInstructions && (
            <div className="instructions">
              <h4>Інструкція з підписки:</h4>

              <div className="instruction-section">
                <strong>📱 Apple Calendar (iPhone/iPad/Mac):</strong>
                <ol>
                  <li>Відкрийте додаток "Календар"</li>
                  <li>Натисніть "Додати календар" → "Додати підписку на календар"</li>
                  <li>Вставте скопійоване посилання</li>
                  <li>Натисніть "Підписатися"</li>
                </ol>
              </div>

              <div className="instruction-section">
                <strong>📧 Google Calendar:</strong>
                <ol>
                  <li>Відкрийте Google Calendar на комп'ютері</li>
                  <li>
                    Зліва натисніть "+" біля "Інші календарі" → "Додати за URL"
                  </li>
                  <li>Вставте посилання та натисніть "Додати календар"</li>
                </ol>
              </div>

              <div className="instruction-section">
                <strong>📮 Outlook:</strong>
                <ol>
                  <li>Відкрийте Outlook Calendar</li>
                  <li>Натисніть "Додати календар" → "Підписатися з веб"</li>
                  <li>Вставте посилання та натисніть "Імпортувати"</li>
                </ol>
              </div>

              <div className="feed-note">
                <p>
                  ⚠️ <strong>Важливо:</strong> Не діліться цим посиланням з
                  іншими. Воно містить особистий токен доступу до ваших записів.
                </p>
                <p>
                  🔄 Календар автоматично оновлюється. Всі нові та скасовані
                  записи з'являться у вашому календарі протягом кількох годин.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarFeed;
