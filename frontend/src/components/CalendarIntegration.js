import React, { useState } from 'react';
import { toast } from 'react-toastify';
import '../styles/CalendarIntegration.css';

const CalendarIntegration = ({ appointment, userPhone }) => {
  const [calendarLinks, setCalendarLinks] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showOptions, setShowOptions] = useState(false);

  const fetchCalendarLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/v1/calendar/appointment/${appointment.id}/links?phone=${userPhone}`
      );

      if (response.ok) {
        const data = await response.json();
        setCalendarLinks(data);
        setShowOptions(true);
      } else {
        toast.error('Помилка отримання посилань');
      }
    } catch (error) {
      toast.error('Помилка отримання посилань');
    } finally {
      setLoading(false);
    }
  };

  const downloadICS = async () => {
    try {
      const response = await fetch(
        `/api/v1/calendar/appointment/${appointment.id}/ics?phone=${userPhone}`
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `appointment_${appointment.id}.ics`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        toast.success('Файл завантажено');
      } else {
        toast.error('Помилка завантаження файлу');
      }
    } catch (error) {
      toast.error('Помилка завантаження файлу');
    }
  };

  return (
    <div className="calendar-integration">
      <button
        className="btn-add-calendar"
        onClick={fetchCalendarLinks}
        disabled={loading}
      >
        📅 {loading ? 'Завантаження...' : 'Додати в календар'}
      </button>

      {showOptions && calendarLinks && (
        <div className="calendar-options">
          <div className="calendar-options-header">
            <h3>Оберіть календар</h3>
            <button
              className="close-button"
              onClick={() => setShowOptions(false)}
            >
              ✕
            </button>
          </div>

          <div className="calendar-buttons">
            <a
              href={calendarLinks.google}
              target="_blank"
              rel="noopener noreferrer"
              className="calendar-option google"
            >
              <span className="icon">📧</span>
              Google Calendar
            </a>

            <a
              href={calendarLinks.outlook}
              target="_blank"
              rel="noopener noreferrer"
              className="calendar-option outlook"
            >
              <span className="icon">📮</span>
              Outlook Calendar
            </a>

            <a
              href={calendarLinks.yahoo}
              target="_blank"
              rel="noopener noreferrer"
              className="calendar-option yahoo"
            >
              <span className="icon">📬</span>
              Yahoo Calendar
            </a>

            <button
              onClick={downloadICS}
              className="calendar-option download"
            >
              <span className="icon">💾</span>
              Завантажити ICS файл
            </button>
          </div>

          <div className="calendar-info">
            <p>
              💡 Після додавання в календар ви отримаєте автоматичне нагадування
              за 24 години до прийому
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarIntegration;
