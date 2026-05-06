import React from 'react';
import '../styles/OpeningHours.css';

const OpeningHours = () => {
  const schedule = [
    { day: 'Понеділок', hours: '09:00 - 18:00', isOpen: true },
    { day: 'Вівторок', hours: '09:00 - 18:00', isOpen: true },
    { day: 'Середа', hours: '09:00 - 18:00', isOpen: true },
    { day: 'Четвер', hours: '09:00 - 18:00', isOpen: true },
    { day: "П'ятниця", hours: '09:00 - 18:00', isOpen: true },
    { day: 'Субота', hours: 'Вихідний', isOpen: false },
    { day: 'Неділя', hours: 'Вихідний', isOpen: false },
  ];

  const getCurrentDay = () => {
    const days = ['Неділя', 'Понеділок', 'Вівторок', 'Середа', 'Четвер', "П'ятниця", 'Субота'];
    return days[new Date().getDay()];
  };

  const currentDay = getCurrentDay();

  return (
    <div className="opening-hours">
      <div className="opening-hours-header">
        <h3>📅 Години прийому</h3>
        <div className="current-status">
          <span className="status-indicator open"></span>
          <span>Приймаємо записи</span>
        </div>
      </div>

      <div className="schedule-list">
        {schedule.map((item, index) => (
          <div
            key={index}
            className={`schedule-item ${!item.isOpen ? 'closed' : ''} ${
              item.day === currentDay ? 'today' : ''
            }`}
          >
            <div className="day-name">
              {item.day}
              {item.day === currentDay && <span className="today-badge">Сьогодні</span>}
            </div>
            <div className={`hours ${!item.isOpen ? 'closed-text' : ''}`}>
              {item.hours}
            </div>
          </div>
        ))}
      </div>

      <div className="hours-info">
        <div className="info-item">
          <span className="info-icon">⏰</span>
          <span>Тривалість прийому: 1 година</span>
        </div>
        <div className="info-item">
          <span className="info-icon">📞</span>
          <span>Запис можливий на 2 місяці вперед</span>
        </div>
        <div className="info-item">
          <span className="info-icon">🔄</span>
          <span>Скасування за 48 годин до прийому</span>
        </div>
      </div>
    </div>
  );
};

export default OpeningHours;
