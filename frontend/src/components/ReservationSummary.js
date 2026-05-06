import React from 'react';
import { format, differenceInDays, differenceInHours } from 'date-fns';
import { uk } from 'date-fns/locale';
import '../styles/ReservationSummary.css';

const ReservationSummary = ({ selectedSlot, onEdit }) => {
  const slotDate = new Date(selectedSlot);
  const now = new Date();
  const daysUntil = differenceInDays(slotDate, now);
  const hoursUntil = differenceInHours(slotDate, now);

  const getTimeUntilText = () => {
    if (daysUntil > 0) {
      return `Через ${daysUntil} ${daysUntil === 1 ? 'день' : daysUntil < 5 ? 'дні' : 'днів'}`;
    } else if (hoursUntil > 0) {
      return `Через ${hoursUntil} ${hoursUntil === 1 ? 'годину' : hoursUntil < 5 ? 'години' : 'годин'}`;
    } else {
      return 'Сьогодні';
    }
  };

  return (
    <div className="reservation-summary">
      <div className="summary-header">
        <h3>📋 Ваш запис</h3>
        <button onClick={onEdit} className="edit-button">
          ✏️ Змінити
        </button>
      </div>

      <div className="summary-content">
        <div className="summary-card">
          <div className="summary-icon">📅</div>
          <div className="summary-details">
            <div className="summary-label">Дата</div>
            <div className="summary-value">
              {format(slotDate, 'EEEE, d MMMM yyyy', { locale: uk })}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">🕐</div>
          <div className="summary-details">
            <div className="summary-label">Час</div>
            <div className="summary-value">
              {format(slotDate, 'HH:mm')} - {format(new Date(slotDate.getTime() + 60 * 60 * 1000), 'HH:mm')}
            </div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon">⏱️</div>
          <div className="summary-details">
            <div className="summary-label">Тривалість</div>
            <div className="summary-value">1 година</div>
          </div>
        </div>

        <div className="summary-card highlight">
          <div className="summary-icon">⏰</div>
          <div className="summary-details">
            <div className="summary-label">До прийому</div>
            <div className="summary-value countdown">{getTimeUntilText()}</div>
          </div>
        </div>
      </div>

      <div className="summary-reminder">
        <div className="reminder-icon">🔔</div>
        <div className="reminder-text">
          <strong>Нагадування:</strong> Ви отримаєте SMS за 24 години до прийому
        </div>
      </div>

      <div className="summary-tips">
        <div className="tip-item">
          <span className="tip-icon">💡</span>
          <span>Приходьте на 5-10 хвилин раніше</span>
        </div>
      </div>
    </div>
  );
};

export default ReservationSummary;
